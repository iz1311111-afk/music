import { SUPA_URL, SUPA_KEY } from '../../lib/supa';
import { themeFromSlug, currentTheme } from '../../lib/themes';

const H = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` };

async function getGrids(theme) {
  const res = await fetch(`${SUPA_URL}/rest/v1/grids?title=eq.${encodeURIComponent(theme)}&select=id,title,author,items,created_at&order=created_at.desc&limit=200`, {
    headers: H,
    next: { revalidate: 600 }
  });
  return (await res.json().catch(() => [])) || [];
}

export async function generateMetadata({ params }) {
  const theme = themeFromSlug(params.slug);
  if (!theme) return { title: 'お題 | MusicGrid' };
  const t = `${theme} | MusicGrid`;
  return {
    title: t,
    description: `お題「${theme}」で作られた24枚の一覧。`,
    openGraph: { title: t, description: `お題「${theme}」で作られた24枚。`, type: 'website' },
    twitter: { card: 'summary_large_image' }
  };
}

export default async function ThemePage({ params }) {
  const theme = themeFromSlug(params.slug);
  if (!theme) {
    return <div className="wrap"><p className="hint">そのお題は見つかりませんでした</p></div>;
  }
  const grids = await getGrids(theme);
  const isNow = theme === currentTheme();
  return (
    <>
      <header>
        <h1>Music<span>Grid</span> <small style={{ fontSize: 11, color: 'var(--muted)' }}>β</small></h1>
        <p>聴いてきた音楽で、自分を語ろう。</p>
      </header>
      <div className="wrap">
        <div className="panel">
          <span className="hint">{isNow ? '今週のお題' : 'お題アーカイブ'}</span>
          <h2 style={{ fontSize: 18, margin: '4px 0 6px' }}>{theme}</h2>
          <p className="hint">{grids.length}枚</p>
        </div>
        <div className="panel">
          {grids.length ? grids.map((g, i) => (
            <a key={g.id} href={'/g/' + g.id} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ padding: '6px 0', borderTop: i ? '1px solid var(--line)' : 'none' }}>
                <div style={{ fontSize: 13 }}><b>{g.title}</b> <span className="hint">{g.author || '名無し'}</span></div>
                <div style={{ display: 'flex', gap: 3, overflow: 'hidden', marginTop: 4 }}>
                  {(g.items || []).filter(Boolean).slice(0, 8).map((it, j) => <img key={j} src={it.art} alt="" style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover', flex: 'none' }} />)}
                </div>
              </div>
            </a>
          )) : <p className="hint">まだ1枚もありません。最初の1枚を作りませんか?</p>}
        </div>
        <div className="toolbar">
          <a href="/"><button className="primary">このお題で作る</button></a>
          <a href="/theme"><button className="secondary">ほかのお題を見る</button></a>
        </div>
      </div>
      <footer>MusicGrid β — アートワークは iTunes Search API より取得しています</footer>
    </>
  );
}
