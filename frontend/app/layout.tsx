import type { Metadata } from 'next';
import { Geist, Roboto } from 'next/font/google';
import './globals.css';
import { cn } from '@app/lib/utils';
import { I18nInitializer } from '@app/shared/i18n';
import { ThemeProvider, Toaster } from '@app/shared/ui';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const roboto = Roboto({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Rocket-chat',
  description: 'Rocket-chat',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={cn('font-sans', geist.variable)}
    >
      <body
        className={`${roboto.className} bg-background text-foreground min-h-screen`}
      >
        <ThemeProvider>
          <I18nInitializer />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
