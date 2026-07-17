import { SUPA_URL, SUPA_KEY } from './lib/supa';

export default async function sitemap() {
  const base = 'https://musicgrid-nine.vercel.app';
  let ids = [];
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/grids?select=id,created_at&order=created_at.desc&limit=500`, {
      headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` }
    });
    ids = await r.json();
  } catch (e) {}
  return [
    { url: base },
    { url: `${base}/explore` },
    { url: `${base}/ranking` },
    ...ids.map((g) => ({ url: `${base}/g/${g.id}`, lastModified: g.created_at }))
  ];
}
