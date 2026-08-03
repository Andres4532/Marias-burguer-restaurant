import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { PwaRegister } from '@/components/pwa/PwaRegister';
import {
  getPublicBrandingForMetadata,
  getSiteIcons,
} from '@/lib/branding';
import './globals.css';

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getPublicBrandingForMetadata();

  return {
    title: branding.name,
    description: 'Sistema de ventas para restaurante',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: branding.name,
    },
    icons: getSiteIcons(branding.logoUrl),
  };
}

export const viewport: Viewport = {
  themeColor: '#ea580c',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${manrope.variable} font-sans antialiased`}>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
