import { SUPA_URL, SUPA_KEY } from '../../lib/supa';

const H = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json' };

export async function POST(request) {
  let gid;
  try { gid = (await request.json()).gid; } catch (e) { return Response.json({ error: 'bad' }, { status: 400 }); }
  gid = String(gid || '').slice(0, 20);
  if (!gid) return Response.json({ error: 'empty' }, { status: 400 });
  await fetch(`${SUPA_URL}/rest/v1/likes`, { method: 'POST', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify({ gid }) });
  const r = await fetch(`${SUPA_URL}/rest/v1/likes?gid=eq.${encodeURIComponent(gid)}&select=id`, { headers: { ...H, Prefer: 'count=exact' } });
  const range = r.headers.get('content-range') || '';
  const count = parseInt(range.split('/')[1] || '0', 10);
  return Response.json({ count });
}

export async function GET(request) {
  const gid = new URL(request.url).searchParams.get('gid') || '';
  if (!gid) return Response.json({ count: 0 });
  const r = await fetch(`${SUPA_URL}/rest/v1/likes?gid=eq.${encodeURIComponent(gid)}&select=id`, { headers: { ...H, Prefer: 'count=exact' } });
  const count = parseInt((r.headers.get('content-range') || '').split('/')[1] || '0', 10);
  return Response.json({ count });
}
