import { SUPA_URL, SUPA_KEY } from '../../lib/supa';

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch (e) { return Response.json({ error: 'bad json' }, { status: 400 }); }
  const { title, cols, rows, items } = body || {};
  if (!Array.isArray(items) || !items.filter(Boolean).length) return Response.json({ error: 'empty' }, { status: 400 });
  if (items.length > 30) return Response.json({ error: 'too many' }, { status: 400 });
  const id = Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6);
  const clean = items.map((it) => it ? {
    art: String(it.art || '').slice(0, 300),
    title: String(it.title || '').slice(0, 120),
    artist: String(it.artist || '').slice(0, 120),
    id: it.id || null,
    type: it.type === 'album' ? 'album' : 'song'
  } : null);
  const res = await fetch(`${SUPA_URL}/rest/v1/grids`, {
    method: 'POST',
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ id, title: String(title || '').slice(0, 60), cols: Number(cols) || 6, rows: Number(rows) || 4, items: clean })
  });
  if (!res.ok) return Response.json({ error: 'db' }, { status: 502 });
  return Response.json({ id });
}
