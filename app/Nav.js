'use client';

export default function Nav() {
  return (
    <nav style={{ display: 'flex', gap: 18, justifyContent: 'center', padding: '12px 0 0', fontSize: 13 }}>
      <a href="/" style={{ color: 'var(--text)' }}>つくる</a>
      <a href="/explore" style={{ color: 'var(--text)' }}>みんなの24枚</a>
      <a href="/ranking" style={{ color: 'var(--text)' }}>ランキング</a>
      <a href="/me" style={{ color: 'var(--text)' }}>マイページ</a>
    </nav>
  );
}
