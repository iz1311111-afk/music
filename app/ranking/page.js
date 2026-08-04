'use client';
import { useEffect, useState } from 'react';
import { SUPA_URL, SUPA_KEY } from '../lib/supa';
import { currentTheme, themePath } from '../lib/themes';

const H = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` };

function GridRow({ g, i, note }) {
  return (
    <a href={'/g/' + g.id} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{ padding: '6px 0', borderTop: i ? '1px solid var(--line)' : 'none' }}>
        <div style={{ fontSize: 13 }}>
          <span style={{ fontWeight: 600, color: i < 3 ? 'var(--accent)' : 'inherit' }}>{i + 1}.</span> <b>{g.title}</b>{' '}
          <span className="hint">{g.author || '名無し'} ・ {note}</span>
        </div>
        <div style={{ display: 'flex', gap: 3, overflow: 'hidden', marginTop: 4 }}>
          {(g.items || []).filter(Boolean).slice(0, 8).map((it, j) => (
            <img key={j} src={it.art} alt="" style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover', flex: 'none' }} />
          ))}
        </div>
      </div>
    </a>
  );
}

export default function Ranking() {
  const [songs, setSongs] = useState(null);
  const [grids, setGrids] = useState(null);
  const [liked, setLiked] = useState(null);
  const theme = currentTheme();

  useEffect(() => {
    (async () => {
      try {
        const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

        const p = await fetch(`${SUPA_URL}/rest/v1/plays?created_at=gte.${since}&select=title,artist&limit=3000`, { headers: H });
        const plays = await p.json();
        const cnt = {};
        plays.forEach((x) => { const k = `${x.title}\t${x.artist}`; cnt[k] = (cnt[k] || 0) + 1; });
        setSongs(Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([k, n]) => { const [t, a] = k.split('\t'); return { t, a, n }; }));

        const fetchGrids = async (ids) => {
          if (!ids.length) return [];
          const g = await fetch(`${SUPA_URL}/rest/v1/grids?id=in.(${ids.join(',')})&select=id,title,author,items`, { headers: H });
          return (await g.json()) || [];
        };

        // いいねが多いグリッド
        const lk = await fetch(`${SUPA_URL}/rest/v1/likes?select=gid&limit=5000`, { headers: H });
        const likeRows = await lk.json().catch(() => []);
        const lc = {};
        (likeRows || []).forEach((x) => { if (x.gid) lc[x.gid] = (lc[x.gid] || 0) + 1; });
        const topLiked = Object.entries(lc).sort((a, b) => b[1] - a[1]).slice(0, 10);
        const likedGrids = await fetchGrids(topLiked.map(([id]) => id));
        setLiked(topLiked.map(([id, n]) => { const gg = likedGrids.find((x) => x.id === id); return gg ? { ...gg, n } : null; }).filter(Boolean));

        // よく見られたグリッド
        const pv = await fetch(`${SUPA_URL}/rest/v1/pageviews?path=like./g/*&select=path&limit=5000`, { headers: H });
        const rows = await pv.json();
        const gc = {};
        rows.forEach((x) => { gc[x.path] = (gc[x.path] || 0) + 1; });
        const top = Object.entries(gc).sort((a, b) => b[1] - a[1]).slice(0, 10);
        const viewGrids = await fetchGrids(top.map(([p2]) => p2.split('/')[2]).filter(Boolean));
        setGrids(top.map(([p2, n]) => { const gid = p2.split('/')[2]; const gg = viewGrids.find((x) => x.id === gid); return gg ? { ...gg, n } : null; }).filter(Boolean));
      } catch (e) { setSongs([]); setGrids([]); setLiked([]); }
    })();
  }, []);

  return (
    <div className="wrap">
      <div className="panel">
        <h2 style={{ fontSize: 16, marginBottom: 4 }}>今週のランキング</h2>
        <p className="hint">直近7日間の「聴く」クリック・いいね・閲覧をもとに毎日更新</p>
      </div>

      <div className="panel" style={{ background: '#eef0ff', borderColor: '#d8dcff' }}>
        <span className="hint">今週のお題</span>
        <div style={{ fontSize: 16, fontWeight: 700, margin: '2px 0 6px' }}>{theme}</div>
        <a href={themePath(theme)}><button className="secondary">このお題の24枚を見る</button></a>
      </div>

      <div className="panel">
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>♥ いいねが多いグリッド Top10</h3>
        {liked === null && <p className="hint">集計中…</p>}
        {liked && liked.map((g, i) => <GridRow key={g.id} g={g} i={i} note={`♥${g.n}`} />)}
        {liked && !liked.length && <p className="hint">まだいいねがありません</p>}
      </div>

      <div className="panel">
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>聴かれた曲 Top20</h3>
        {songs === null && <p className="hint">集計中…</p>}
        {songs && songs.map((s, i) => (
          <div key={i} style={{ padding: '4px 0', fontSize: 13, borderTop: i ? '1px solid var(--line)' : 'none' }}>
            <span style={{ fontWeight: 600, color: i < 3 ? 'var(--accent)' : 'inherit' }}>{i + 1}.</span> <b>{s.t}</b> —{' '}
            <a href={'/a/' + encodeURIComponent(s.a)} style={{ color: 'inherit' }}>{s.a}</a>
            <span className="hint"> ({s.n}回)</span>
            <a href={'https://music.apple.com/jp/search?term=' + encodeURIComponent(s.t + ' ' + s.a)} style={{ color: 'var(--accent)', marginLeft: 6 }}>聴く</a>
          </div>
        ))}
        {songs && !songs.length && <p className="hint">今週はまだデータがありません</p>}
      </div>

      <div className="panel">
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>よく見られたグリッド Top10</h3>
        {grids === null && <p className="hint">集計中…</p>}
        {grids && grids.map((g, i) => <GridRow key={g.id} g={g} i={i} note={`${g.n}view`} />)}
        {grids && !grids.length && <p className="hint">今週はまだデータがありません</p>}
      </div>
    </div>
  );
}
