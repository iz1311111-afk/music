export const revalidate = 86400;

// 試聴音源(30秒)のURLを返す。
// song  -> その曲自身のプレビュー
// album -> 収録曲から代表曲を1曲選び、そのプレビュー
// 音源元は iTunes と Deezer の両方に対応(items.src)。
async function fromItunes(id, type) {
  const url =
    type === 'album'
      ? `https://itunes.apple.com/lookup?id=${id}&entity=song&limit=12&country=JP`
      : `https://itunes.apple.com/lookup?id=${id}&country=JP`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  const data = await res.json();
  const list = Array.isArray(data.results) ? data.results : [];
  const t = list.find((r) => r && r.previewUrl);
  return t ? { preview: t.previewUrl, track: t.trackName || null } : { preview: null };
}

async function fromDeezer(id, type) {
  const url = type === 'album' ? `https://api.deezer.com/album/${id}` : `https://api.deezer.com/track/${id}`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  const d = await res.json();
  if (type === 'album') {
    const list = (d && d.tracks && Array.isArray(d.tracks.data) ? d.tracks.data : []).filter((t) => t && t.preview);
    return list.length ? { preview: list[0].preview, track: list[0].title || null } : { preview: null };
  }
  return d && d.preview ? { preview: d.preview, track: d.title || null } : { preview: null };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = (searchParams.get('id') || '').replace(/[^0-9]/g, '');
  const type = searchParams.get('type') === 'album' ? 'album' : 'song';
  const src = searchParams.get('src') === 'deezer' ? 'deezer' : 'itunes';
  if (!id) return Response.json({ preview: null });
  try {
    return Response.json(src === 'deezer' ? await fromDeezer(id, type) : await fromItunes(id, type));
  } catch (e) {
    return Response.json({ preview: null, error: 'upstream' }, { status: 502 });
  }
}
