import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ['400', '500', '700', '900'],
  variable: '--font-noto-sans-kr',
});

export const metadata: Metadata = {
  title: "엄마와의 전쟁 끝 - 공부 인증 시작",
  description: "매일 공부를 인증하고 꾸준함을 기르는 우리 가족 학습 매니저",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${notoSansKr.variable} font-sans antialiased text-gray-900`}>
        {children}
        <Toaster position="top-center" toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '16px',
            padding: '16px',
            fontWeight: 'bold',
          },
          success: {
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
        }} />
      </body>
    </html>
  );
}
