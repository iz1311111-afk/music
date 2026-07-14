export const revalidate = 3600;

async function j(url, headers) {
  try {
    const r = await fetch(url, { next: { revalidate: 3600 }, headers: headers || {} });
    return await r.json();
  } catch (e) { return null; }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const entity = searchParams.get('entity') === 'song' ? 'song' : 'album';
  if (!q.trim()) return Response.json({ results: [] });
  const enc = encodeURIComponent(q);
  const [jp, us, dz] = await Promise.all([
    j(`https://itunes.apple.com/search?term=${enc}&entity=${entity}&country=JP&limit=100`),
    j(`https://itunes.apple.com/search?term=${enc}&entity=${entity}&country=US&limit=50`),
    j(entity === 'song' ? `https://api.deezer.com/search?q=${enc}&limit=50` : `https://api.deezer.com/search/album?q=${enc}&limit=50`)
  ]);
  const out = [];
  const seen = new Set();
  const push = (r) => {
    const title = entity === 'album' ? r.collectionName : r.trackName;
    const key = (String(title || '') + '|' + String(r.artistName || '')).toLowerCase().replace(/\s+/g, '');
    if (!title || seen.has(key)) return;
    seen.add(key);
    out.push(r);
  };
  ((jp && jp.results) || []).forEach((r) => push({ ...r, src: 'itunes' }));
  ((us && us.results) || []).forEach((r) => push({ ...r, src: 'itunes' }));
  ((dz && dz.data) || []).forEach((d) => {
    if (entity === 'song') {
      push({ trackName: d.title, artistName: d.artist && d.artist.name, collectionName: d.album && d.album.title, artworkUrl100: d.album && d.album.cover_big, trackId: d.id, primaryGenreName: null, src: 'deezer' });
    } else {
      push({ collectionName: d.title, artistName: d.artist && d.artist.name, artworkUrl100: d.cover_big, collectionId: d.id, primaryGenreName: null, src: 'deezer' });
    }
  });
  if (out.length < 15 && entity === 'song') {
    const mb = await j(`https://musicbrainz.org/ws/2/recording?query=${enc}&fmt=json&limit=15`, { 'User-Agent': 'MusicGrid/1.0 (https://musicgrid-nine.vercel.app)' });
    ((mb && mb.recordings) || []).forEach((m) => {
      const rel = (m.releases && m.releases[0]) || null;
      push({ trackName: m.title, artistName: m['artist-credit'] && m['artist-credit'][0] && m['artist-credit'][0].name, collectionName: rel && rel.title, artworkUrl100: rel ? `https://coverartarchive.org/release/${rel.id}/front-250` : null, trackId: null, primaryGenreName: null, src: 'mb' });
    });
  }
  return Response.json({ results: out.slice(0, 150) });
}
