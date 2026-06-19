import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'المؤتمر الدولي للسيرة النبوية',
  description: 'منصة التسجيل والدعوات للمؤتمر الدولي للسيرة النبوية',
  keywords: 'سيرة نبوية، مؤتمر، تسجيل، دعوة',
  openGraph: {
    title: 'المؤتمر الدولي للسيرة النبوية',
    description: 'سجّل الآن واحصل على بطاقة دعوتك الإلكترونية',
    locale: 'ar_SA',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Cairo:wght@300;400;500;600;700;900&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
