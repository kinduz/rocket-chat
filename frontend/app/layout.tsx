import type { Metadata } from 'next';
import { Geist, Roboto } from 'next/font/google';
import './globals.css';
import { getUserProfile } from '@app/entities/user';
import { ACCESS_TOKEN_KEY, type Profile } from '@app/shared';
import { getRcClient } from '@app/shared/api/server';
import { I18nInitializer } from '@app/shared/i18n';
import { cn } from '@app/shared/lib/utils';
import {
  QueryProvider,
  StoreHydrator,
  ThemeProvider,
  Toaster,
} from '@app/shared/ui';
import { cookies } from 'next/headers';
import type { PropsWithChildren } from 'react';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const roboto = Roboto({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Rocket-chat',
  description: 'Rocket-chat',
};

export default async function RootLayout({ children }: PropsWithChildren) {
  const rcClient = await getRcClient();
  const accessToken = (await cookies()).get(ACCESS_TOKEN_KEY)?.value;

  const [userProfile] = accessToken
    ? await Promise.all([getUserProfile(rcClient)])
    : [undefined];

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
          <QueryProvider>
            <StoreHydrator profile={userProfile as Profile} />
            <I18nInitializer />
            {children}
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
