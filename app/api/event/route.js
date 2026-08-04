import { SUPA_URL, SUPA_KEY } from '../../lib/supa';

// クリックイベントの記録。eventsテーブルが未作成でも呼び出し元を壊さない。
export async function POST(request) {
  try {
    const body = await request.json();
    const name = String((body && body.name) || '').slice(0, 40);
    if (!name) return Response.json({ ok: false });
    await fetch(`${SUPA_URL}/rest/v1/events`, {
      method: 'POST',
      headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({
        name,
        gid: body.gid ? String(body.gid).slice(0, 20) : null,
        meta: body.meta ? String(body.meta).slice(0, 120) : null
      })
    });
  } catch (e) {}
  return Response.json({ ok: true });
}
