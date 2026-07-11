import { SUPA_URL, SUPA_KEY } from '../../lib/supa';

async function getGrid(id) {
  const res = await fetch(`${SUPA_URL}/rest/v1/grids?id=eq.${encodeURIComponent(id)}&select=*`, {
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` },
    next: { revalidate: 3600 }
  });
  const rows = await res.json().catch(() => []);
  return rows[0] || null;
}

export async function generateMetadata({ params }) {
  const g = await getGrid(params.id);
  const t = g ? `${g.title} | MusicGrid` : 'MusicGrid';
  return {
    title: t,
    description: '聴いてきた音楽で、自分を語ろう。',
    openGraph: { title: t, description: '聴いてきた音楽で、自分を語ろう。', type: 'article' },
    twitter: { card: 'summary_large_image' }
  };
}

export default async function GridPage({ params }) {
  const g = await getGrid(params.id);
  if (!g) {
    return <div className="wrap"><p className="hint">グリッドが見つかりませんでした</p></div>;
  }
  const items = (g.items || []).filter(Boolean);
  return (
    <>
      <header>
        <h1>Music<span>Grid</span> <small style={{ fontSize: 11, color: 'var(--muted)' }}>β</small></h1>
        <p>聴いてきた音楽で、自分を語ろう。</p>
      </header>
      <div className="wrap">
        <div className="panel">
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>{g.title}</h2>
          <div className="grid" style={{ gridTemplateColumns: `repeat(${g.cols},1fr)` }}>
            {items.map((it, i) => (
              <div className="slot filled" key={i} title={`${it.title} — ${it.artist}`}>
                <img src={it.art} alt={it.title} />
              </div>
            ))}
          </div>
          <div className="tracklist">
            {items.map((it, i) => (
              <div key={i}>{i + 1}. <b>{it.title}</b> — {it.artist}<a href={it.id ? (it.type === 'album' ? 'https://album.link/i/' : 'https://song.link/i/') + it.id : 'https://music.apple.com/jp/search?term=' + encodeURIComponent(it.title + ' ' + it.artist)} style={{ color: 'var(--accent)', marginLeft: 6 }}>聴く</a></div>
            ))}
          </div>
        </div>
        <div className="toolbar">
          <a href="/"><button className="primary">自分のグリッドを作る</button></a>
        </div>
      </div>
      <footer>MusicGrid β — アートワークは iTunes Search API より取得しています</footer>
    </>
  );
}
