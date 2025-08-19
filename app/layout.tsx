import type { Metadata } from 'next';
import { Source_Sans_3 } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { getBaseURL } from '@/lib/deployment';

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'VertaaRauhassa',
  description: 'Vertaa VR matkojen hintoja',
  alternates: {
    canonical: getBaseURL(),
  },
  openGraph: {
    title: 'VertaaRauhassa',
    description: 'Vertaa VR matkojen hintoja',
    url: getBaseURL(),
    siteName: 'VertaaRauhassa',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sourceSans.className} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
