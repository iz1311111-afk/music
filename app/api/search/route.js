export const revalidate = 3600;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const entity = searchParams.get('entity') === 'song' ? 'song' : 'album';
  if (!q.trim()) return Response.json({ results: [] });
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=${entity}&country=JP&limit=50`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const data = await res.json();
    return Response.json({ results: data.results || [] });
  } catch (e) {
    return Response.json({ results: [], error: 'upstream' }, { status: 502 });
  }
}
