'use client';
import { useState, useEffect } from 'react';

export default function LikeButton({ gid }) {
  const [count, setCount] = useState(null);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try { setLiked(!!localStorage.getItem('mg_like_' + gid)); } catch (e) {}
    fetch('/api/like?gid=' + encodeURIComponent(gid)).then((r) => r.json()).then((d) => setCount(d.count)).catch(() => setCount(0));
  }, [gid]);

  const toggle = async () => {
    if (liked || busy) return;
    setBusy(true);
    setLiked(true);
    setCount((c) => (c || 0) + 1);
    try { localStorage.setItem('mg_like_' + gid, '1'); } catch (e) {}
    try {
      const d = await fetch('/api/like', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gid }) }).then((r) => r.json());
      if (typeof d.count === 'number') setCount(d.count);
    } catch (e) {}
    setBusy(false);
  };

  return (
    <button onClick={toggle} disabled={liked}
      style={{ background: liked ? '#ffe8ee' : '#fff', color: liked ? '#e0245e' : 'var(--text)', border: '1px solid ' + (liked ? '#ffc2d1' : 'var(--line)'), borderRadius: 99, padding: '8px 18px', fontSize: 15, cursor: liked ? 'default' : 'pointer' }}>
      {liked ? '♥' : '♡'} {count === null ? '' : count}
    </button>
  );
}
