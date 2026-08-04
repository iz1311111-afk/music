import { SUPA_URL, SUPA_KEY } from './lib/supa';
import { THEMES, themePath } from './lib/themes';

const H = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` };
const norm = (s) => String(s || '').trim();

export default async function sitemap() {
  const base = 'https://musicgrid-nine.vercel.app';
  let grids = [];
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/grids?select=id,created_at,items&order=created_at.desc&limit=500`, { headers: H });
    grids = (await r.json()) || [];
  } catch (e) {}

  // よく登場するアーティストのページもインデックス対象にする
  const artists = {};
  grids.forEach((g) => {
    (g.items || []).filter(Boolean).forEach((it) => {
      const a = norm(it.artist);
      if (a) artists[a] = (artists[a] || 0) + 1;
    });
  });
  const topArtists = Object.entries(artists)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 200)
    .map(([a]) => a);

  return [
    { url: base },
    { url: `${base}/explore` },
    { url: `${base}/ranking` },
    { url: `${base}/theme` },
    ...THEMES.map((t) => ({ url: base + themePath(t) })),
    ...topArtists.map((a) => ({ url: `${base}/a/${encodeURIComponent(a)}` })),
    ...grids.map((g) => ({ url: `${base}/g/${g.id}`, lastModified: g.created_at }))
  ];
}
