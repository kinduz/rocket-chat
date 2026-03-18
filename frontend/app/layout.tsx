import type { Metadata } from 'next';
import { Inter, Geist } from 'next/font/google';
import './globals.css';
import { I18nInitializer } from '@app/shared/i18n';
import { ThemeProvider } from '@app/shared/ui';
import { cn } from "@app/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ['latin'] });

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
    <html lang="ru" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className={`${inter.className} bg-background text-foreground min-h-screen`}>
        <ThemeProvider>
          <I18nInitializer />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
