import type { Metadata } from 'next';
import './globals.css';
import { ClientProviders } from '@/src/components/providers/ClientProviders';

export const metadata: Metadata = {
  title: 'Bidroom Admin Panel',
  description: 'Bidroom Admin Panel Design',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}

