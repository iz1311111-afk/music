'use client';
import { useEffect, useState } from 'react';

export default function InAppNotice() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const ua = navigator.userAgent || '';
    if (/Twitter|Line\/|Instagram|FBAV|FBAN|FB_IAB/i.test(ua)) setShow(true);
  }, []);
  if (!show) return null;
  return (
    <div style={{ background: '#fff7e0', color: '#6b5b1e', fontSize: 12, padding: '8px 14px', textAlign: 'center', lineHeight: 1.5 }}>
      アプリ内ブラウザでは一部リンク(ログインが必要なサービス)が開けません。右上の「…」メニューから「ブラウザで開く」を選んでね
      <button onClick={() => setShow(false)} style={{ marginLeft: 8, background: 'transparent', color: '#6b5b1e', border: '1px solid #d8c98a', borderRadius: 6, padding: '2px 8px', fontSize: 11 }}>閉じる</button>
    </div>
  );
}
