import { ImageResponse } from 'next/og';
import { SUPA_URL, SUPA_KEY } from '../../lib/supa';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }) {
  let g = null;
  try {
    const res = await fetch(`${SUPA_URL}/rest/v1/grids?id=eq.${encodeURIComponent(params.id)}&select=*`, {
      headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` }
    });
    const rows = await res.json();
    g = rows[0] || null;
  } catch (e) {}
  const items = ((g && g.items) || []).filter(Boolean).slice(0, 24);
  const cols = (g && g.cols) || 6;
  const rowsN = Math.max(1, Math.ceil(items.length / cols));
  const cell = Math.max(40, Math.min(Math.floor(1120 / cols), Math.floor(440 / rowsN)) - 6);
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#faf9f6', padding: 40 }}>
        <div style={{ display: 'flex', fontSize: 40, color: '#2b2b30', fontWeight: 600, marginBottom: 16 }}>{(g && g.title) || 'MusicGrid'}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', width: cols * (cell + 6) }}>
          {items.map((it, i) => (
            <img key={i} src={it.art} width={cell} height={cell} style={{ margin: 3 }} />
          ))}
        </div>
        <div style={{ display: 'flex', position: 'absolute', bottom: 20, right: 40, color: '#b8b6ae', fontSize: 24 }}>musicgrid-nine.vercel.app</div>
      </div>
    ),
    size
  );
}
