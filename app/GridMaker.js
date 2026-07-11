'use client';
import { useState, useRef, useEffect } from 'react';

const MODE_LABEL = { album: 'アルバム', song: '曲' };
const FORMATS = {
  x169: { w: 1600, h: 900, label: 'X向け 16:9(1600×900)' },
  insta45: { w: 1080, h: 1350, label: 'インスタ投稿 4:5(1080×1350)' },
  insta11: { w: 1080, h: 1080, label: 'インスタ正方形 1:1(1080×1080)' },
  story916: { w: 1080, h: 1920, label: 'ストーリーズ 9:16(1080×1920)' }
};

function loadImg(src) {
  return new Promise((res) => {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => res(im);
    im.onerror = () => res(null);
    im.src = src;
  });
}

function truncate(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text;
  while (text.length > 1 && ctx.measureText(text + '…').width > maxW) text = text.slice(0, -1);
  return text + '…';
}

function fallbackCell(ctx, x, y, s, item) {
  ctx.fillStyle = '#e9e7e1'; ctx.fillRect(x, y, s, s);
  ctx.fillStyle = '#2b2b30'; ctx.font = `${Math.max(12, s * 0.09)}px sans-serif`; ctx.textAlign = 'center';
  ctx.fillText((item.title || '').slice(0, 10), x + s / 2, y + s / 2);
  ctx.fillStyle = '#8f8d97'; ctx.font = `${Math.max(10, s * 0.07)}px sans-serif`;
  ctx.fillText((item.artist || '').slice(0, 12), x + s / 2, y + s / 2 + s * 0.11);
}

export default function GridMaker() {
  const [title, setTitle] = useState('私を象徴する24枚');
  const [cols, setCols] = useState(6);
  const [rows, setRows] = useState(4);
  const [mode, setMode] = useState('album');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [format, setFormat] = useState('x169');
  const [done, setDone] = useState('');
  const [pubUrl, setPubUrl] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const canvasRef = useRef(null);
  const toastTimer = useRef(null);

  const slots = cols * rows;

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('mg_state') || 'null');
      if (s) {
        if (s.title) setTitle(s.title);
        if (s.cols) setCols(s.cols);
        if (s.rows) setRows(s.rows);
        if (Array.isArray(s.items)) setItems(s.items);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem('mg_state', JSON.stringify({ title, cols, rows, items })); } catch (e) {}
  }, [title, cols, rows, items]);

  function toast(msg) {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 1800);
  }

  async function search() {
    if (!query.trim()) return;
    setSearching(true);
    setResults(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&entity=${mode}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (e) {
      setResults([]);
    }
    setSearching(false);
  }

  function addItem(r) {
    const next = items.slice(0, slots);
    let pos = next.findIndex((v) => !v);
    if (pos === -1) pos = next.length < slots ? next.length : -1;
    if (pos === -1) { toast('枠がいっぱい!入れ替えたい枠の×で消してね'); return; }
    next[pos] = {
      art: (r.artworkUrl100 || '').replace('100x100', '600x600'),
      title: mode === 'album' ? r.collectionName : r.trackName,
      artist: r.artistName,
      id: r.trackId || r.collectionId,
      type: mode
    };
    setItems(next);
    toast(`${pos + 1}枠目に${MODE_LABEL[mode]}を追加`);
  }

  function clickSlot(i) {
    if (selected === null) {
      if (items[i]) setSelected(i);
    } else {
      const next = items.slice();
      const t = next[selected];
      next[selected] = next[i];
      next[i] = t;
      setItems(next);
      setSelected(null);
    }
  }

  function removeItem(i, e) {
    e.stopPropagation();
    const next = items.slice();
    next[i] = null;
    setItems(next);
    setSelected(null);
  }

  function changeLayout(v) {
    const [c, r] = v.split('x').map(Number);
    setCols(c); setRows(r);
    setItems(items.slice(0, c * r));
    setSelected(null);
  }

  async function generate() {
    const filled = items.filter(Boolean);
    if (!filled.length) { toast('まず曲やアルバムを追加してね'); return; }
    toast('画像を生成中…');

    const fmt = FORMATS[format];
    const W = fmt.w, H = fmt.h, GAP = 8;
    const M = Math.round(W * 0.035) + 12;
    const sideLayout = W / H >= 1.4;

    const cv = canvasRef.current;
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#faf9f6'; ctx.fillRect(0, 0, W, H);

    const titleSize = Math.round(W * 0.0275) + (sideLayout ? 0 : 4);
    const headerY = M + titleSize;
    ctx.fillStyle = '#2b2b30';
    ctx.font = `600 ${titleSize}px "Hiragino Sans","Noto Sans JP",sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(title || '私の音楽グリッド', M, headerY);
    ctx.strokeStyle = '#e7e5df'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(M, headerY + 20); ctx.lineTo(W - M, headerY + 20); ctx.stroke();
    const top = headerY + 44;

    const imgs = await Promise.all(
      Array.from({ length: slots }, (_, i) => (items[i] ? loadImg(items[i].art) : Promise.resolve(null)))
    );
    const list = [];
    for (let i = 0; i < slots; i++) if (items[i]) list.push({ n: i + 1, ...items[i] });

    const drawGridAt = (gx, gy, cell) => {
      for (let i = 0; i < slots; i++) {
        const x = gx + (i % cols) * (cell + GAP);
        const y = gy + Math.floor(i / cols) * (cell + GAP);
        if (imgs[i]) {
          try { ctx.drawImage(imgs[i], x, y, cell, cell); } catch (e) { fallbackCell(ctx, x, y, cell, items[i]); }
        } else if (items[i]) {
          fallbackCell(ctx, x, y, cell, items[i]);
        } else {
          ctx.fillStyle = '#efeee9'; ctx.fillRect(x, y, cell, cell);
        }
      }
    };

    if (sideLayout) {
      const availH = H - top - M - 10;
      const listMinW = 380;
      const gridMaxW = W - M * 2 - listMinW - 44;
      let cell = Math.floor((availH - (rows - 1) * GAP) / rows);
      cell = Math.min(cell, Math.floor((gridMaxW - (cols - 1) * GAP) / cols));
      const gridW = cols * cell + (cols - 1) * GAP;
      const gridH = rows * cell + (rows - 1) * GAP;
      drawGridAt(M, top + Math.floor((availH - gridH) / 2), cell);

      const listX = M + gridW + 44;
      const listW = W - listX - M;
      const twoCol = list.length > 13 && listW >= 560;
      const colW = twoCol ? Math.floor((listW - 24) / 2) : listW;
      const perCol = twoCol ? Math.ceil(list.length / 2) : list.length;
      const lineH = Math.min(52, Math.floor(availH / perCol));
      const ts = Math.min(22, lineH > 44 ? 22 : 18);
      list.forEach((it, idx) => {
        const col = twoCol ? Math.floor(idx / perCol) : 0;
        const rowI = twoCol ? idx % perCol : idx;
        const x = listX + col * (colW + 24);
        const y = top + 18 + rowI * lineH;
        ctx.textAlign = 'left';
        if (lineH >= 46) {
          ctx.fillStyle = '#2b2b30';
          ctx.font = `600 ${ts}px "Hiragino Sans","Noto Sans JP",sans-serif`;
          ctx.fillText(truncate(ctx, `${it.n}. ${it.title}`, colW), x, y);
          ctx.fillStyle = '#55545c';
          ctx.font = `500 ${ts - 3}px "Hiragino Sans","Noto Sans JP",sans-serif`;
          ctx.fillText(truncate(ctx, it.artist, colW - 20), x + 20, y + ts);
        } else {
          ctx.fillStyle = '#2b2b30';
          ctx.font = `600 ${ts}px "Hiragino Sans","Noto Sans JP",sans-serif`;
          const head = truncate(ctx, `${it.n}. ${it.title}`, colW * 0.6);
          ctx.fillText(head, x, y);
          const hw = ctx.measureText(head).width;
          ctx.fillStyle = '#55545c';
          ctx.font = `500 ${ts - 2}px "Hiragino Sans","Noto Sans JP",sans-serif`;
          ctx.fillText(truncate(ctx, ` — ${it.artist}`, colW - hw - 4), x + hw, y);
        }
      });
    } else {
      let cell = Math.floor((W - 2 * M - (cols - 1) * GAP) / cols);
      const gridCapH = Math.floor(H * 0.52);
      cell = Math.min(cell, Math.floor((gridCapH - (rows - 1) * GAP) / rows));
      const gridW = cols * cell + (cols - 1) * GAP;
      const gridH = rows * cell + (rows - 1) * GAP;
      drawGridAt(M + Math.floor((W - 2 * M - gridW) / 2), top, cell);

      const listTop = top + gridH + 34;
      const availH = H - listTop - M - 30;
      let nc = 1;
      for (const c of [1, 2, 3]) {
        nc = c;
        if (Math.floor(availH / Math.ceil(list.length / c)) >= 30) break;
      }
      const perCol = Math.ceil(list.length / nc);
      const lineH = Math.min(56, Math.floor(availH / perCol));
      const ts = Math.max(14, Math.min(24, Math.floor(lineH * 0.55)));
      const colW = Math.floor((W - 2 * M - (nc - 1) * 20) / nc);
      list.forEach((it, idx) => {
        const col = Math.floor(idx / perCol);
        const rowI = idx % perCol;
        const x = M + col * (colW + 20);
        const y = listTop + 14 + rowI * lineH;
        ctx.textAlign = 'left';
        ctx.font = `600 ${ts}px "Hiragino Sans","Noto Sans JP",sans-serif`;
        ctx.fillStyle = '#2b2b30';
        const head = truncate(ctx, `${it.n}. ${it.title}`, colW * 0.62);
        ctx.fillText(head, x, y);
        const hw = ctx.measureText(head).width;
        ctx.fillStyle = '#55545c';
        ctx.font = `500 ${ts - 2}px "Hiragino Sans","Noto Sans JP",sans-serif`;
        ctx.fillText(truncate(ctx, ` — ${it.artist}`, colW - hw - 4), x + hw, y);
      });
    }

    ctx.fillStyle = '#b8b6ae';
    ctx.font = `${Math.round(W * 0.014) + 6}px "Hiragino Sans",sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText('MusicGrid β — musicgrid-nine.vercel.app', W - M, H - Math.round(M * 0.5));

    setDone(fmt.label);
    setImgUrl(cv.toDataURL('image/png'));
    setTimeout(() => { const el = document.getElementById('mg-preview'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 50);
  }

  function download() {
    const a = document.createElement('a');
    a.download = `musicgrid_${format}.png`;
    a.href = canvasRef.current.toDataURL('image/png');
    a.click();
  }

  function shareX() {
    const text = encodeURIComponent(`${title || '私の音楽グリッド'} #MusicGrid #私を象徴する24枚`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(pubUrl || 'https://musicgrid-nine.vercel.app')}`, '_blank');
  }

  function shareNative() {
    canvasRef.current.toBlob(async (blob) => {
      const file = new File([blob], 'musicgrid.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: title || 'MusicGrid', text: (title || '私の音楽グリッド') + ' #MusicGrid https://musicgrid-nine.vercel.app' });
        } catch (e) {}
      } else {
        toast('この端末は直接共有に非対応。画像を保存して投稿してね');
      }
    }, 'image/png');
  }

  async function publish() {
    const filled = items.filter(Boolean);
    if (!filled.length) { toast('まず曲やアルバムを追加してね'); return; }
    if (pubUrl) { toast('作成済みです(下のURL)'); return; }
    toast('公開URLを作成中…');
    try {
      const res = await fetch('/api/grids', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, cols, rows, items }) });
      const d = await res.json();
      if (d.id) { setPubUrl(window.location.origin + '/g/' + d.id); toast('公開URLができました!'); }
      else { toast('作成に失敗しました'); }
    } catch (e) { toast('作成に失敗しました'); }
  }

  return (
    <div className="wrap">
      <div className="panel">
        <div className="row">
          <input type="text" value={title} maxLength={30} onChange={(e) => setTitle(e.target.value)} />
          <select value={`${cols}x${rows}`} onChange={(e) => changeLayout(e.target.value)}>
            <option value="6x4">4×6(24枚)</option>
            <option value="8x3">3×8(24枚)</option>
            <option value="5x5">5×5(25枚)</option>
          </select>
        </div>
      </div>

      <div className="panel">
        <div className="row">
          <div className="seg">
            <button className={mode === 'album' ? '' : 'off'} onClick={() => { setMode('album'); setResults(null); }}>アルバム</button>
            <button className={mode === 'song' ? '' : 'off'} onClick={() => { setMode('song'); setResults(null); }}>曲</button>
          </div>
          <input
            type="text"
            placeholder={mode === 'album' ? 'アルバム名・アーティスト名で検索' : '曲名・アーティスト名で検索'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') search(); }}
          />
          <button className="primary" onClick={search}>検索</button>
        </div>
        <div className="results">
          {searching && <p className="hint">検索中…</p>}
          {results && !results.length && !searching && <p className="hint">見つかりませんでした</p>}
          {results && results.map((r, i) => (
            <div className="result" key={i} onClick={() => addItem(r)}>
              <img src={r.artworkUrl100} loading="lazy" alt="" />
              <div className="meta">
                <div className="t">{mode === 'album' ? r.collectionName : r.trackName}</div>
                <div className="a">{r.artistName}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <p className="hint" style={{ marginBottom: 8 }}>検索結果をタップで追加 / 枠を2回タップで入れ替え / ×で削除</p>
        <div className="grid" style={{ gridTemplateColumns: `repeat(${cols},1fr)` }}>
          {Array.from({ length: slots }, (_, i) => (
            <div
              key={i}
              className={'slot' + (items[i] ? ' filled' : '') + (selected === i ? ' selected' : '')}
              onClick={() => clickSlot(i)}
              title={items[i] ? `${items[i].title} — ${items[i].artist}` : ''}
            >
              {items[i] ? (
                <>
                  <img src={items[i].art} alt={items[i].title} />
                  <button className="rm" onClick={(e) => removeItem(i, e)}>×</button>
                </>
              ) : (
                <div className="num">{i + 1}</div>
              )}
            </div>
          ))}
        </div>
        <div className="tracklist">
          {items.map((it, i) => (it && i < slots ? (
            <div key={i}>{i + 1}. <b>{it.title}</b> — {it.artist}<a href={it.id ? (it.type === 'album' ? 'https://album.link/i/' : 'https://song.link/i/') + it.id : 'https://music.apple.com/jp/search?term=' + encodeURIComponent(it.title + ' ' + it.artist)} target="_blank" rel="noopener" style={{ color: 'var(--accent)', marginLeft: 6 }}>聴く</a></div>
          ) : null))}
        </div>
      </div>

      <div className="toolbar">
        <select value={format} onChange={(e) => setFormat(e.target.value)}>
          <option value="x169">X 横長(16:9)</option>
          <option value="insta45">インスタ投稿(4:5)</option>
          <option value="insta11">インスタ正方形(1:1)</option>
          <option value="story916">ストーリーズ(9:16)</option>
        </select>
        <button className="primary" onClick={generate}>画像を作る</button>
        <button className="secondary" onClick={() => { if (confirm('全部消しますか?')) { setItems([]); setSelected(null); setDone(''); } }}>全部クリア</button>
      </div>

      <div id="mg-preview" className="panel preview" style={{ display: done ? 'block' : 'none' }}>
        <div className="badge">できあがり! {done}</div>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        {imgUrl ? <img src={imgUrl} alt="生成画像" style={{ maxWidth: '100%', borderRadius: 12, marginTop: 10, border: '1px solid var(--line)' }} /> : null}
        <div className="toolbar" style={{ marginTop: 12 }}>
          <button onClick={download}>画像を保存</button>
          <button className="secondary" onClick={shareX}>Xで共有</button>
          <button className="secondary" onClick={shareNative}>スマホで共有(インスタ等)</button>
          <button onClick={publish}>公開URLを作る</button>
        </div>
        {pubUrl ? <p className="hint" style={{ marginTop: 8 }}><a href={pubUrl} target="_blank" rel="noopener" style={{ color: 'var(--accent)' }}>{pubUrl}</a> <button className="secondary" style={{ padding: '4px 10px', fontSize: 12, marginLeft: 6 }} onClick={() => { navigator.clipboard.writeText(pubUrl); toast('コピーしました'); }}>コピー</button></p> : null}
        <p className="hint" style={{ marginTop: 8 }}>保存した画像をポスト・投稿に添付してね(スマホは画像長押しでも保存できます)</p>
      </div>

      <div className={'toast' + (toastMsg ? ' show' : '')}>{toastMsg}</div>
    </div>
  );
}
