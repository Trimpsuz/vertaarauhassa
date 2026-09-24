import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const VR_TRPC_BASE_URL = process.env.VR_API_BASE_URL ?? 'https://www.vr.fi/api/trpc';
const ALLOWED_PROCEDURES = new Set(['journey.searchJourney', 'sales.createNewSalesSession']);
const VR_SESSION_COOKIE = 'sessionId';
const VR_AUTH_COOKIE_NAMES = [
  'loggedIn',
  'loggedIn.sig',
  'refresh_token',
  'refresh_token.iv',
  'refresh_token.sig',
  'access_token',
  'access_token.iv',
  'access_token.sig',
  'selectedRole',
  'selectedRole.sig',
];

const encodeProcedure = (procedure: string) => Array.from(procedure, (character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`).join('');

const getVrCookieHeader = (request: NextRequest) =>
  request.cookies
    .getAll()
    .filter(({ name }) => name.toLowerCase() === VR_SESSION_COOKIE.toLowerCase())
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');

const getSetCookies = (headers: Headers) => {
  const headersWithSetCookie = headers as Headers & { getSetCookie?: () => string[] };
  // A combined Set-Cookie header is unsafe to parse because Expires contains commas.
  return typeof headersWithSetCookie.getSetCookie === 'function' ? headersWithSetCookie.getSetCookie() : [];
};

const getCookieName = (setCookie: string) => setCookie.split(';', 1)[0]?.split('=', 1)[0]?.trim().toLowerCase();

const getVrSessionSetCookies = (headers: Headers) => getSetCookies(headers).filter((setCookie) => getCookieName(setCookie) === VR_SESSION_COOKIE.toLowerCase());

const getExpiredAuthCookies = () => VR_AUTH_COOKIE_NAMES.map((name) => `${name}=; Max-Age=0; Path=/; SameSite=Lax`);

type RouteContext = {
  params: Promise<{ trpc: string }>;
};

async function proxyRequest(request: NextRequest, context: RouteContext, method: 'GET' | 'POST') {
  const { trpc } = await context.params;

  if (!ALLOWED_PROCEDURES.has(trpc)) {
    return NextResponse.json({ error: { message: 'Unknown VR API procedure' } }, { status: 404 });
  }

  const targetUrl = new URL(`${VR_TRPC_BASE_URL}/${encodeProcedure(trpc)}`);
  request.nextUrl.searchParams.forEach((value, key) => targetUrl.searchParams.append(key, value));

  const headers = new Headers({ accept: 'application/json' });
  const body = method === 'POST' ? await request.text() : undefined;

  if (body !== undefined) headers.set('content-type', 'application/json');

  const wafToken = request.headers.get('x-aws-waf-token') ?? process.env.VR_AWS_WAF_TOKEN;
  const vrUrl = request.headers.get('x-vr-url') ?? process.env.VR_WEB_URL ?? '/kertalippu-menomatkan-hakutulokset';
  const vrVersion = request.headers.get('x-vr-version') ?? process.env.VR_WEB_FRONTEND_VERSION;

  if (wafToken) headers.set('x-aws-waf-token', wafToken);
  if (vrUrl) headers.set('x-vr-url', vrUrl);
  if (vrVersion) headers.set('x-vr-version', vrVersion);

  const cookieHeader = getVrCookieHeader(request);
  if (cookieHeader) headers.set('cookie', cookieHeader);

  try {
    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
      cache: 'no-store',
    });
    const responseBody = await response.text();
    const responseHeaders = new Headers({
      'cache-control': 'no-store',
      'content-type': response.headers.get('content-type') ?? 'application/json',
    });

    for (const setCookie of getVrSessionSetCookies(response.headers)) responseHeaders.append('set-cookie', setCookie);
    for (const setCookie of getExpiredAuthCookies()) responseHeaders.append('set-cookie', setCookie);

    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json({ error: { message: 'Could not reach the VR API' } }, { status: 502 });
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context, 'GET');
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context, 'POST');
}
