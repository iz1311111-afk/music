import { SUPA_URL, SUPA_KEY } from '../../lib/supa';

export async function POST(request) {
  try {
    const { gid, title, artist } = await request.json();
    await fetch(`${SUPA_URL}/rest/v1/plays`, {
      method: 'POST',
      headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ gid: String(gid || '').slice(0, 20), title: String(title || '').slice(0, 120), artist: String(artist || '').slice(0, 120) })
    });
  } catch (e) {}
  return Response.json({ ok: true });
}
