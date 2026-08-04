// 週替わりのお題。GridMakerとお題アーカイブページで共有する。
export const THEMES = [
  '夏の終わりに聴きたい24曲',
  '人生を変えた24枚',
  '雨の日に沈みる24曲',
  '青春の24曲',
  '夜ふかしのお供24曲',
  '元気が出る24曲',
  '泣きたい夜の24曲',
  'ドライブで流したい24曲'
];

export function currentTheme(now) {
  const t = typeof now === 'number' ? now : Date.now();
  return THEMES[Math.floor(t / (7 * 24 * 3600 * 1000)) % THEMES.length];
}

export function themePath(theme) {
  return '/theme/' + encodeURIComponent(theme);
}

export function themeFromSlug(slug) {
  let s = slug;
  try { s = decodeURIComponent(slug); } catch (e) {}
  return THEMES.find((t) => t === s) || null;
}
