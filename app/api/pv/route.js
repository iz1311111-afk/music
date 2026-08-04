import { SUPA_URL, SUPA_KEY } from '../../lib/supa';

const H = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' };

async function insert(row) {
  const res = await fetch(`${SUPA_URL}/rest/v1/pageviews`, { method: 'POST', headers: H, body: JSON.stringify(row) });
  return res.ok;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const path = String((body && body.path) || '/').slice(0, 100);
    const referrer = body && body.referrer ? String(body.referrer).slice(0, 200) : null;
    const utm = body && body.utm ? String(body.utm).slice(0, 60) : null;
    // referrer/utm列が未作成の環境では失敗するため、その場合はpathのみで再送する
    const ok = await insert({ path, referrer, utm });
    if (!ok) await insert({ path });
  } catch (e) {}
  return Response.json({ ok: true });
}
