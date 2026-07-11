'use client';
import { useEffect, useState } from 'react';
import { SUPA_URL, SUPA_KEY } from '../lib/supa';

const H = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` };

export default function Explore() {
  const [grids, setGrids] = useState(null);
  const [genre, setGenre] = useState('すべて');

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${SUPA_URL}/rest/v1/grids?select=id,title,author,user_id,items,created_at&order=created_at.desc&limit=60`, { headers: H });
        setGrids(await r.json());
      } catch (e) { setGrids([]); }
    })();
  }, []);

  const genres = ['すべて'];
  (grids || []).forEach((g) => (g.items || []).forEach((it) => { if (it && it.genre && !genres.includes(it.genre)) genres.push(it.genre); }));
  const shown = (grids || []).filter((g) => genre === 'すべて' || (g.items || []).some((it) => it && it.genre === genre));

  return (
    <div className="wrap">
      <div className="panel">
        <h2 style={{ fontSize: 16, marginBottom: 10 }}>みんなの24枚</h2>
        <div className="row">
          {genres.slice(0, 14).map((g) => (
            <button key={g} className={g === genre ? 'primary' : 'secondary'} style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setGenre(g)}>{g}</button>
          ))}
        </div>
      </div>
      {grids === null && <p className="hint" style={{ textAlign: 'center' }}>読み込み中…</p>}
      {shown.map((g) => (
        <a key={g.id} href={'/g/' + g.id} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="panel">
            <div style={{ fontSize: 14, fontWeight: 600 }}>{g.title}</div>
            <div className="hint" style={{ margin: '2px 0 8px' }}>{g.author || '名無し'} ・ {new Date(g.created_at).toLocaleDateString('ja-JP')}</div>
            <div style={{ display: 'flex', gap: 4, overflow: 'hidden' }}>
              {(g.items || []).filter(Boolean).slice(0, 8).map((it, i) => (
                <img key={i} src={it.art} alt="" style={{ width: 62, height: 62, borderRadius: 6, objectFit: 'cover', flex: 'none' }} />
              ))}
            </div>
          </div>
        </a>
      ))}
      {grids && !shown.length && <p className="hint" style={{ textAlign: 'center' }}>該当するグリッドがありません</p>}
    </div>
  );
}
