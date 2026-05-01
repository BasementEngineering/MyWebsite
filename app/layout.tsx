import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import ScrollProvider from '@/components/providers/ScrollProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Jan Kettler',
  description: 'Legacy-Systeme. Moderne Intelligenz. Echter Mehrwert.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased">
        <ScrollProvider>{children}</ScrollProvider>
      </body>
    </html>
  );
}
