'use client';
import { useEffect, useState } from 'react';
import { SUPA_URL, SUPA_KEY } from '../lib/supa';
import { getUser, saveUser } from '../lib/user';

const H = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` };

export default function Me() {
  const [user, setUser] = useState(undefined);
  const [name, setName] = useState('');
  const [mine, setMine] = useState([]);
  const [feed, setFeed] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setUser(getUser()); }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const r = await fetch(`${SUPA_URL}/rest/v1/grids?user_id=eq.${user.id}&select=id,title,created_at&order=created_at.desc`, { headers: H });
        setMine(await r.json());
        const f = await fetch(`${SUPA_URL}/rest/v1/follows?follower=eq.${user.id}&select=followee`, { headers: H });
        const fw = (await f.json()).map((x) => x.followee);
        if (fw.length) {
          const g = await fetch(`${SUPA_URL}/rest/v1/grids?user_id=in.(${fw.join(',')})&select=id,title,author,created_at&order=created_at.desc&limit=30`, { headers: H });
          setFeed(await g.json());
        } else setFeed([]);
      } catch (e) { setFeed([]); }
    })();
  }, [user]);

  const create = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await fetch(`${SUPA_URL}/rest/v1/rpc/create_user`, { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_name: name }) });
      const u = await r.json();
      if (u && u.id) { saveUser(u); setUser(u); }
    } catch (e) {}
    setBusy(false);
  };

  if (user === undefined) return <div className="wrap"><p className="hint">読み込み中…</p></div>;

  if (!user) return (
    <div className="wrap">
      <div className="panel">
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>アカウント作成(10秒)</h2>
        <p className="hint" style={{ marginBottom: 10 }}>ニックネームだけでOK。フォロー機能と自分のグリッド一覧が使えるようになります。情報はこの端末に保存されます。</p>
        <div className="row">
          <input type="text" placeholder="ニックネーム" value={name} maxLength={20} onChange={(e) => setName(e.target.value)} />
          <button className="primary" onClick={create} disabled={busy}>作成</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="wrap">
      <div className="panel">
        <h2 style={{ fontSize: 17 }}>{user.name}</h2>
        <p className="hint">プロフィール: <a href={'/u/' + user.id} style={{ color: 'var(--accent)' }}>/u/{user.id}</a>（このURLを共有するとフォローしてもらえます）</p>
      </div>
      <div className="panel">
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>自分のグリッド</h3>
        {mine.map((g) => (
          <div key={g.id} style={{ padding: '4px 0' }}><a href={'/g/' + g.id} style={{ color: 'var(--accent)' }}>{g.title}</a> <span className="hint">{new Date(g.created_at).toLocaleDateString('ja-JP')}</span></div>
        ))}
        {!mine.length && <p className="hint">まだありません。グリッドを作って「公開URLを作る」とここに並びます</p>}
      </div>
      <div className="panel">
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>フォロー中の新着</h3>
        {feed === null && <p className="hint">読み込み中…</p>}
        {feed && feed.map((g) => (
          <div key={g.id} style={{ padding: '4px 0' }}><a href={'/g/' + g.id} style={{ color: 'var(--accent)' }}>{g.title}</a> <span className="hint">{g.author} ・ {new Date(g.created_at).toLocaleDateString('ja-JP')}</span></div>
        ))}
        {feed && !feed.length && <p className="hint">誰かをフォローすると新着が流れます。<a href="/explore" style={{ color: 'var(--accent)' }}>みんなの24枚</a>から探してみよう</p>}
      </div>
    </div>
  );
}
