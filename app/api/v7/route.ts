import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const response = (await axios.post('https://www.vr.fi/api/v7', await request.json())).data;

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(error.response.data, { status: error.response.status });
  }
}
