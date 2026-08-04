// 主要ボタンのクリックを記録する(離脱地点の特定用)。
// 失敗しても画面の動作には一切影響させない。
export function track(name, extra) {
  if (typeof window === 'undefined') return;
  try {
    const body = JSON.stringify({ name, ...(extra || {}) });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/event', new Blob([body], { type: 'application/json' }));
    } else {
      fetch('/api/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true });
    }
  } catch (e) {}
}
