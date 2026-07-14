import { SUPA_URL, SUPA_KEY } from '../../lib/supa';

export async function POST(request) {
  try {
    const { path } = await request.json();
    await fetch(`${SUPA_URL}/rest/v1/pageviews`, {
      method: 'POST',
      headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ path: String(path || '/').slice(0, 100) })
    });
  } catch (e) {}
  return Response.json({ ok: true });
}
