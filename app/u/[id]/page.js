'use client';
import { useEffect, useState } from 'react';
import { SUPA_URL, SUPA_KEY } from '../../lib/supa';
import { getUser } from '../../lib/user';

const H = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` };

export default function Profile({ params }) {
  const uid = params.id;
  const [prof, setProf] = useState(null);
  const [grids, setGrids] = useState([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  const me = typeof window !== 'undefined' ? getUser() : null;

  const load = async () => {
    try {
      const p = await fetch(`${SUPA_URL}/rest/v1/users_public?id=eq.${encodeURIComponent(uid)}&select=*`, { headers: H });
      const rows = await p.json();
      setProf(rows[0] || false);
      const g = await fetch(`${SUPA_URL}/rest/v1/grids?user_id=eq.${encodeURIComponent(uid)}&select=id,title,items,created_at&order=created_at.desc`, { headers: H });
      setGrids(await g.json());
      const fc = await fetch(`${SUPA_URL}/rest/v1/follows?followee=eq.${encodeURIComponent(uid)}&select=follower`, { headers: H });
      const fl = await fc.json();
      setFollowers(fl.length);
      const m = getUser();
      if (m) setFollowing(fl.some((x) => x.follower === m.id));
    } catch (e) {}
  };

  useEffect(() => { load(); }, []);

  const toggle = async () => {
    const m = getUser();
    if (!m) { window.location.href = '/me'; return; }
    if (busy) return;
    setBusy(true);
    try {
      await fetch(`${SUPA_URL}/rest/v1/rpc/set_follow`, { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_follower: m.id, p_secret: m.secret, p_followee: uid, p_on: !following }) });
      await load();
    } catch (e) {}
    setBusy(false);
  };

  if (prof === false) return <div className="wrap"><p className="hint">ユーザーが見つかりませんでした</p></div>;
  if (!prof) return <div className="wrap"><p className="hint">読み込み中…</p></div>;

  return (
    <div className="wrap">
      <div className="panel">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 17 }}>{prof.name}</h2>
            <p className="hint">フォロワー {followers} ・ {new Date(prof.created_at).toLocaleDateString('ja-JP')}から</p>
          </div>
          {(!me || me.id !== uid) && (
            <button className={following ? 'secondary' : 'primary'} onClick={toggle} disabled={busy}>{following ? 'フォロー中' : 'フォローする'}</button>
          )}
        </div>
      </div>
      {grids.map((g) => (
        <a key={g.id} href={'/g/' + g.id} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="panel">
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{g.title}</div>
            <div style={{ display: 'flex', gap: 4, overflow: 'hidden' }}>
              {(g.items || []).filter(Boolean).slice(0, 8).map((it, i) => (
                <img key={i} src={it.art} alt="" style={{ width: 62, height: 62, borderRadius: 6, objectFit: 'cover', flex: 'none' }} />
              ))}
            </div>
          </div>
        </a>
      ))}
      {!grids.length && <p className="hint" style={{ textAlign: 'center' }}>公開グリッドはまだありません</p>}
    </div>
  );
}
