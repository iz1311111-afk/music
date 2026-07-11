import './globals.css';
import { Analytics } from '@vercel/analytics/react';

export const metadata = {
  title: 'MusicGrid — 私を代表する24枚',
  description: '聴いてきた音楽で、自分を語ろう。好きなアルバム・曲でグリッド画像を作ってSNSでシェア。',
  openGraph: {
    title: 'MusicGrid — 私を代表する24枚',
    description: '聴いてきた音楽で、自分を語ろう。',
    type: 'website'
  },
  twitter: { card: 'summary_large_image' }
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>{children}<Analytics /></body>
    </html>
  );
}
