import { THEMES, currentTheme, themePath } from '../lib/themes';
import { SUPA_URL, SUPA_KEY } from '../lib/supa';

const H = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` };

async function counts() {
  const res = await fetch(`${SUPA_URL}/rest/v1/grids?select=title&limit=2000`, { headers: H, next: { revalidate: 600 } });
  const rows = (await res.json().catch(() => [])) || [];
  const map = {};
  rows.forEach((r) => { const t = String(r.title || '').trim(); map[t] = (map[t] || 0) + 1; });
  return map;
}

export const metadata = {
  title: 'お題アーカイブ | MusicGrid',
  description: '週替わりのお題で作られた24枚を、お題ごとにまとめて見られます。',
  openGraph: { title: 'お題アーカイブ | MusicGrid', description: '週替わりのお題で作られた24枚。', type: 'website' },
  twitter: { card: 'summary_large_image' }
};

export default async function ThemeIndex() {
  const map = await counts();
  const now = currentTheme();
  return (
    <>
      <header>
        <h1>Music<span>Grid</span> <small style={{ fontSize: 11, color: 'var(--muted)' }}>β</small></h1>
        <p>聴いてきた音楽で、自分を語ろう。</p>
      </header>
      <div className="wrap">
        <div className="panel" style={{ background: '#eef0ff', borderColor: '#d8dcff' }}>
          <span className="hint">今週のお題</span>
          <div style={{ fontSize: 18, fontWeight: 700, margin: '4px 0 10px' }}>{now}</div>
          <a href="/"><button className="primary">このお題で作る</button></a>
        </div>
        <div className="panel">
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>お題アーカイブ</h2>
          {THEMES.map((t, i) => (
            <a key={t} href={themePath(t)} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ padding: '8px 0', borderTop: i ? '1px solid var(--line)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: t === now ? 700 : 400 }}>{t}{t === now ? ' ← 今週' : ''}</span>
                <span className="hint">{map[t] || 0}枚</span>
              </div>
            </a>
          ))}
        </div>
      </div>
      <footer>MusicGrid β — アートワークは iTunes Search API より取得しています</footer>
    </>
  );
}
