'use client';
import { useState, useEffect } from 'react';
import { SUPA_URL, SUPA_KEY } from './lib/supa';

export default function Comments({ gid }) {
  const [list, setList] = useState(null);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const r = await fetch(`${SUPA_URL}/rest/v1/comments?gid=eq.${encodeURIComponent(gid)}&select=*&order=created_at.desc&limit=50`, {
        headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` }
      });
      setList(await r.json());
    } catch (e) { setList([]); }
  };

  useEffect(() => { load(); }, []);

  const post = async () => {
    if (!body.trim() || busy) return;
    setBusy(true);
    try {
      await fetch('/api/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gid, name, body }) });
      setBody('');
      await load();
    } catch (e) {}
    setBusy(false);
  };

  return (
    <div className="panel">
      <h2 style={{ fontSize: 15, marginBottom: 10 }}>感想</h2>
      <div className="row" style={{ marginBottom: 8 }}>
        <input type="text" placeholder="ニックネーム(任意)" value={name} maxLength={20} onChange={(e) => setName(e.target.value)} style={{ flex: '0 1 180px' }} />
      </div>
      <div className="row">
        <input type="text" placeholder="この24枚への感想を書く…" value={body} maxLength={280} onChange={(e) => setBody(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') post(); }} />
        <button className="primary" onClick={post} disabled={busy}>投稿</button>
      </div>
      <div style={{ marginTop: 12 }}>
        {list === null && <p className="hint">読み込み中…</p>}
        {list && !list.length && <p className="hint">まだ感想はありません。最初の一件を書いてみよう</p>}
        {list && list.map((c) => (
          <div key={c.id} style={{ padding: '8px 0', borderTop: '1px solid var(--line)' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.name} ・ {new Date(c.created_at).toLocaleDateString('ja-JP')}</div>
            <div style={{ fontSize: 14, marginTop: 2, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{c.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
