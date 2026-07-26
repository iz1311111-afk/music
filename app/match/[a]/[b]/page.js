import { SUPA_URL, SUPA_KEY } from '../../../lib/supa';

async function getGrid(id) {
  const res = await fetch(`${SUPA_URL}/rest/v1/grids?id=eq.${encodeURIComponent(id)}&select=*`, {
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` },
    next: { revalidate: 600 }
  });
  const rows = await res.json().catch(() => []);
  return rows[0] || null;
}

const norm = (s) => String(s || '').trim().toLowerCase();
const keyOf = (it) => (it.id ? `id:${it.id}` : `t:${norm(it.title)}|${norm(it.artist)}`);

// 2つのグリッドの重なりから相性を出す。
// 作品の一致を重く(65%)、アーティストの一致を軽く(35%)見る。
export function calcMatch(a, b) {
  const ia = (a.items || []).filter(Boolean);
  const ib = (b.items || []).filter(Boolean);
  const mapB = new Map(ib.map((it) => [keyOf(it), it]));
  const seen = new Set();
  const works = [];
  ia.forEach((it) => {
    const k = keyOf(it);
    if (mapB.has(k) && !seen.has(k)) {
      seen.add(k);
      works.push(it);
    }
  });
  const artA = new Set(ia.map((it) => norm(it.artist)).filter(Boolean));
  const artB = new Set(ib.map((it) => norm(it.artist)).filter(Boolean));
  const artistKeys = [...artA].filter((x) => artB.has(x));
  const artists = artistKeys.map((k) => {
    const hit = ia.find((it) => norm(it.artist) === k);
    return hit ? hit.artist : k;
  });

  const workRate = works.length / (Math.min(ia.length, ib.length) || 1);
  const artistRate = artistKeys.length / (Math.min(artA.size, artB.size) || 1);
  const score = Math.max(0, Math.min(100, Math.round((workRate * 0.65 + artistRate * 0.35) * 100)));
  return { works, artists, score, countA: ia.length, countB: ib.length };
}

function label(score) {
  if (score >= 85) return { t: '運命の相手', d: '同じ曲で同じ夜を越えてきたタイプ。' };
  if (score >= 65) return { t: 'かなり近い', d: '音楽の芯が重なっています。話が合うはず。' };
  if (score >= 45) return { t: '気が合いそう', d: '共通の入口がいくつもあります。' };
  if (score >= 25) return { t: 'ゆるく重なる', d: '被りは少なめ。おすすめし合うと面白い相手。' };
  if (score >= 10) return { t: 'ほぼ別の惑星', d: '重なりはわずか。だからこそ発見がありそう。' };
  return { t: '交わらない二人', d: '重なりゼロ。まったく違う音を聴いてきました。' };
}

export async function generateMetadata({ params }) {
  const [a, b] = await Promise.all([getGrid(params.a), getGrid(params.b)]);
  if (!a || !b) return { title: '相性診断 | MusicGrid' };
  const { score } = calcMatch(a, b);
  const t = `音楽の相性 ${score}% | MusicGrid`;
  return {
    title: t,
    description: `「${a.title}」と「${b.title}」の相性は ${score}%`,
    openGraph: { title: t, description: `「${a.title}」と「${b.title}」の相性は ${score}%`, type: 'article' },
    twitter: { card: 'summary_large_image' }
  };
}

export default async function MatchPage({ params }) {
  const [a, b] = await Promise.all([getGrid(params.a), getGrid(params.b)]);
  if (!a || !b) {
    return (
      <div className="wrap">
        <p className="hint">グリッドが見つかりませんでした</p>
      </div>
    );
  }
  const { works, artists, score } = calcMatch(a, b);
  const lb = label(score);
  const shareText = `音楽の相性は ${score}% だった`;
  const shareUrl = `https://musicgrid-nine.vercel.app/match/${params.a}/${params.b}`;

  return (
    <>
      <header>
        <h1>
          Music<span>Grid</span> <small style={{ fontSize: 11, color: 'var(--muted)' }}>β</small>
        </h1>
        <p>聴いてきた音楽で、自分を語ろう。</p>
      </header>
      <div className="wrap">
        <div className="panel" style={{ textAlign: 'center' }}>
          <div className="hint" style={{ fontSize: 13 }}>
            <a href={`/g/${params.a}`} style={{ color: 'var(--accent)' }}>{a.title}</a>
            {' × '}
            <a href={`/g/${params.b}`} style={{ color: 'var(--accent)' }}>{b.title}</a>
          </div>
          <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.1, margin: '10px 0 2px' }}>{score}%</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{lb.t}</div>
          <p className="hint" style={{ marginTop: 6 }}>{lb.d}</p>
          <div className="hint" style={{ fontSize: 13, marginTop: 10 }}>
            共通の作品 {works.length}／共通のアーティスト {artists.length}
          </div>
        </div>

        {works.length ? (
          <div className="panel">
            <h2 style={{ fontSize: 16, marginBottom: 10 }}>共通の作品</h2>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(6,1fr)' }}>
              {works.map((it, i) => (
                <div className="slot filled" key={i} title={`${it.title} — ${it.artist}`}>
                  <img src={it.art} alt={it.title} />
                </div>
              ))}
            </div>
            <div className="tracklist">
              {works.map((it, i) => (
                <div key={i}>
                  {i + 1}. <b>{it.title}</b> — {it.artist}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {artists.length ? (
          <div className="panel">
            <h2 style={{ fontSize: 16, marginBottom: 10 }}>共通のアーティスト</h2>
            <p style={{ fontSize: 14, lineHeight: 1.9 }}>{artists.join(' / ')}</p>
          </div>
        ) : null}

        <div className="toolbar">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener"
          >
            <button>Xで共有</button>
          </a>
          <a href={`/g/${params.b}`}>
            <button>相手の24枚を見る</button>
          </a>
          <a href="/">
            <button className="primary">自分のグリッドを作る</button>
          </a>
        </div>
      </div>
      <footer>MusicGrid β — アートワークは iTunes Search API より取得しています</footer>
    </>
  );
}
