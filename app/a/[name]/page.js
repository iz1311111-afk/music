import { SUPA_URL, SUPA_KEY } from '../../lib/supa';

const H = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` };
const norm = (s) => String(s || '').trim().toLowerCase();

async function getGrids() {
  const res = await fetch(`${SUPA_URL}/rest/v1/grids?select=id,title,author,items,created_at&order=created_at.desc&limit=800`, {
    headers: H,
    next: { revalidate: 600 }
  });
  return (await res.json().catch(() => [])) || [];
}

function decode(name) {
  try { return decodeURIComponent(name); } catch (e) { return name; }
}

async function collect(name) {
  const artist = decode(name);
  const key = norm(artist);
  const grids = await getGrids();
  const hits = [];
  const works = {};
  let display = artist;
  grids.forEach((g) => {
    const items = (g.items || []).filter(Boolean);
    const mine = items.filter((it) => norm(it.artist) === key);
    if (!mine.length) return;
    display = mine[0].artist || display;
    hits.push({ id: g.id, title: g.title, author: g.author, items, count: mine.length });
    mine.forEach((it) => {
      const k = it.id || it.title;
      if (!works[k]) works[k] = { art: it.art, title: it.title, n: 0 };
      works[k].n += 1;
    });
  });
  const top = Object.values(works).sort((a, b) => b.n - a.n).slice(0, 12);
  return { artist: display, hits, top };
}

export async function generateMetadata({ params }) {
  const artist = decode(params.name);
  const t = `${artist}を選んだ人の24枚 | MusicGrid`;
  const d = `${artist}を「私を象徴する24枚」に選んだ人のグリッド一覧。`;
  return {
    title: t,
    description: d,
    openGraph: { title: t, description: d, type: 'website' },
    twitter: { card: 'summary_large_image' }
  };
}

export default async function ArtistPage({ params }) {
  const { artist, hits, top } = await collect(params.name);
  return (
    <>
      <header>
        <h1>Music<span>Grid</span> <small style={{ fontSize: 11, color: 'var(--muted)' }}>β</small></h1>
        <p>聴いてきた音楽で、自分を語ろう。</p>
      </header>
      <div className="wrap">
        <div className="panel">
          <h2 style={{ fontSize: 18, marginBottom: 4 }}>{artist} を選んだ人の24枚</h2>
          <p className="hint">{hits.length}人がグリッドに入れています</p>
        </div>

        {top.length ? (
          <div className="panel">
            <h3 style={{ fontSize: 14, marginBottom: 8 }}>よく選ばれている作品</h3>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {top.map((w, i) => (
                <div key={i} style={{ width: 72 }}>
                  <img src={w.art} alt={w.title} style={{ width: 72, height: 72, borderRadius: 6, objectFit: 'cover' }} />
                  <div style={{ fontSize: 10, lineHeight: 1.3, marginTop: 2, color: 'var(--muted)' }}>{w.n}人</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="panel">
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>このアーティストを入れているグリッド</h3>
          {hits.length ? hits.slice(0, 50).map((g, i) => (
            <a key={g.id} href={'/g/' + g.id} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ padding: '6px 0', borderTop: i ? '1px solid var(--line)' : 'none' }}>
                <div style={{ fontSize: 13 }}><b>{g.title}</b> <span className="hint">{g.author || '名無し'} ・ {g.count}枚</span></div>
                <div style={{ display: 'flex', gap: 3, overflow: 'hidden', marginTop: 4 }}>
                  {g.items.slice(0, 8).map((it, j) => <img key={j} src={it.art} alt="" style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover', flex: 'none' }} />)}
                </div>
              </div>
            </a>
          )) : <p className="hint">まだ見つかりませんでした</p>}
        </div>

        <div className="toolbar">
          <a href="/"><button className="primary">自分の24枚を作る</button></a>
          <a href="/explore"><button className="secondary">みんなの24枚を見る</button></a>
        </div>
      </div>
      <footer>MusicGrid β — アートワークは iTunes Search API より取得しています</footer>
    </>
  );
}
