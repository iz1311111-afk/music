'use client';
import { useEffect, useState } from 'react';
import { SUPA_URL, SUPA_KEY } from '../lib/supa';

const H = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` };
const KEY = 'nao-0711';

export default function Admin() {
  const [ok, setOk] = useState(false);
  const [d, setD] = useState(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const k = p.get('key') || localStorage.getItem('mg_admin') || '';
    if (k === KEY) { localStorage.setItem('mg_admin', k); setOk(true); }
  }, []);

  useEffect(() => {
    if (!ok) return;
    (async () => {
      const g = async (u) => { try { const r = await fetch(`${SUPA_URL}/rest/v1/${u}`, { headers: H }); return await r.json(); } catch (e) { return []; } };
      const [grids, users, plays, comments, pv] = await Promise.all([
        g('grids?select=id,title,author,created_at&order=created_at.desc&limit=200'),
        g('users_public?select=id'),
        g('plays?select=title,artist,created_at&order=created_at.desc&limit=2000'),
        g('comments?select=gid,name,body,created_at&order=created_at.desc&limit=20'),
        g('pageviews?select=path,created_at&order=created_at.desc&limit=5000')
      ]);
      setD({ grids, users, plays, comments, pv });
    })();
  }, [ok]);

  if (!ok) return <div className="wrap"><p className="hint" style={{ textAlign: 'center' }}>このページはオーナー専用です</p></div>;
  if (!d) return <div className="wrap"><p className="hint" style={{ textAlign: 'center' }}>集計中…</p></div>;

  const days = [...Array(14)].map((_, i) => { const t = new Date(); t.setDate(t.getDate() - (13 - i)); return t.toISOString().slice(0, 10); });
  const pvByDay = days.map((day) => ({ day, n: d.pv.filter((x) => String(x.created_at).slice(0, 10) === day).length }));
  const maxPv = Math.max(1, ...pvByDay.map((x) => x.n));
  const pathCount = {};
  d.pv.forEach((x) => { pathCount[x.path] = (pathCount[x.path] || 0) + 1; });
  const topPaths = Object.entries(pathCount).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const playCount = {};
  d.plays.forEach((x) => { const k = `${x.title} — ${x.artist}`; playCount[k] = (playCount[k] || 0) + 1; });
  const topPlays = Object.entries(playCount).sort((a, b) => b[1] - a[1]).slice(0, 10);

  const stat = (label, n) => (
    <div className="panel" style={{ flex: 1, textAlign: 'center', minWidth: 100 }}>
      <div style={{ fontSize: 24, fontWeight: 600 }}>{n}</div>
      <div className="hint">{label}</div>
    </div>
  );

  return (
    <div className="wrap">
      <h2 style={{ fontSize: 16, textAlign: 'center' }}>オーナーダッシュボード</h2>
      <div className="row">
        {stat('公開グリッド', d.grids.length)}
        {stat('ユーザー', d.users.length)}
        {stat('聴くクリック', d.plays.length)}
        {stat('PV(直近)', d.pv.length)}
      </div>
      <div className="panel">
        <h3 style={{ fontSize: 14, marginBottom: 10 }}>PV 直近14日</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 100 }}>
          {pvByDay.map((x) => (
            <div key={x.day} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ background: 'var(--accent)', borderRadius: 3, height: Math.max(2, (x.n / maxPv) * 80) }} title={`${x.day}: ${x.n}`} />
              <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>{x.day.slice(8)}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="panel">
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>よく見られているページ</h3>
        {topPaths.map(([p, n]) => <div key={p} style={{ padding: '2px 0', fontSize: 13 }}>{n}回 ・ {p}</div>)}
        {!topPaths.length && <p className="hint">まだデータがありません</p>}
      </div>
      <div className="panel">
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>聴かれた曲 Top10</h3>
        {topPlays.map(([k, n], i) => <div key={k} style={{ padding: '2px 0', fontSize: 13 }}>{i + 1}. {k} <span className="hint">({n}回)</span></div>)}
        {!topPlays.length && <p className="hint">まだデータがありません</p>}
      </div>
      <div className="panel">
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>新着グリッド</h3>
        {d.grids.slice(0, 10).map((g2) => <div key={g2.id} style={{ padding: '2px 0', fontSize: 13 }}><a href={'/g/' + g2.id} style={{ color: 'var(--accent)' }}>{g2.title}</a> <span className="hint">{g2.author || '名無し'} ・ {new Date(g2.created_at).toLocaleString('ja-JP')}</span></div>)}
      </div>
      <div className="panel">
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>直近の感想</h3>
        {d.comments.map((c, i) => <div key={i} style={{ padding: '4px 0', fontSize: 13, borderTop: '1px solid var(--line)' }}><span className="hint">{c.name} → <a href={'/g/' + c.gid} style={{ color: 'var(--accent)' }}>{c.gid}</a></span><br />{c.body}</div>)}
        {!d.comments.length && <p className="hint">まだ感想はありません</p>}
      </div>
    </div>
  );
}
