import { SUPA_URL, SUPA_KEY } from '../../lib/supa';

export async function POST(request) {
  let b;
  try { b = await request.json(); } catch (e) { return Response.json({ error: 'bad json' }, { status: 400 }); }
  const gid = String(b.gid || '').slice(0, 20);
  const name = String(b.name || '').trim().slice(0, 20);
  const body = String(b.body || '').trim().slice(0, 280);
  if (!gid || !body) return Response.json({ error: 'empty' }, { status: 400 });
  const res = await fetch(`${SUPA_URL}/rest/v1/comments`, {
    method: 'POST',
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ gid, name: name || '名無し', body })
  });
  if (!res.ok) return Response.json({ error: 'db' }, { status: 502 });
  return Response.json({ ok: true });
}
