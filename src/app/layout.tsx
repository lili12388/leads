import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Extension License System',
  description: 'API for managing browser extension licenses',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
