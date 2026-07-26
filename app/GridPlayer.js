'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

// グリッドを表示し、タップで30秒プレビューを再生するクライアント部品。
// 音源URLは押されたときに /api/preview から取りに行く(初期表示を重くしない)。
export default function GridPlayer({ items, cols }) {
  const [current, setCurrent] = useState(-1);
  const [loading, setLoading] = useState(-1);
  const [auto, setAuto] = useState(false);
  const audioRef = useRef(null);
  const cacheRef = useRef({});
  const idxRef = useRef(-1);
  const autoRef = useRef(false);
  const playRef = useRef(null);

  useEffect(() => {
    const a = new Audio();
    a.preload = 'none';
    audioRef.current = a;
    return () => {
      a.pause();
      a.src = '';
    };
  }, []);

  const fetchPreview = useCallback(async (it) => {
    const key = `${it.src || 'itunes'}:${it.type || 'song'}:${it.id}`;
    if (key in cacheRef.current) return cacheRef.current[key];
    try {
      const r = await fetch(`/api/preview?id=${encodeURIComponent(it.id)}&type=${it.type === 'album' ? 'album' : 'song'}&src=${it.src === 'deezer' ? 'deezer' : 'itunes'}`);
      const d = await r.json();
      cacheRef.current[key] = d && d.preview ? d.preview : null;
    } catch (e) {
      cacheRef.current[key] = null;
    }
    return cacheRef.current[key];
  }, []);

  const stop = useCallback(() => {
    const a = audioRef.current;
    if (a) a.pause();
    autoRef.current = false;
    idxRef.current = -1;
    setAuto(false);
    setCurrent(-1);
  }, []);

  const play = useCallback(
    async (i) => {
      const it = items[i];
      const a = audioRef.current;
      if (!a || !it || !it.id) return;
      if (idxRef.current === i) {
        stop();
        return;
      }
      setLoading(i);
      const url = await fetchPreview(it);
      setLoading(-1);
      if (!url) {
        idxRef.current = -1;
        setCurrent(-1);
        return;
      }
      a.src = url;
      try {
        await a.play();
        idxRef.current = i;
        setCurrent(i);
      } catch (e) {
        idxRef.current = -1;
        setCurrent(-1);
      }
    },
    [items, fetchPreview, stop]
  );

  useEffect(() => {
    playRef.current = play;
  }, [play]);

  // 連続再生: 1曲終わったら次の枠へ
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return undefined;
    const onEnd = () => {
      if (!autoRef.current) {
        idxRef.current = -1;
        setCurrent(-1);
        return;
      }
      let n = idxRef.current + 1;
      while (n < items.length && !(items[n] && items[n].id)) n++;
      if (n >= items.length) {
        autoRef.current = false;
        idxRef.current = -1;
        setAuto(false);
        setCurrent(-1);
        return;
      }
      idxRef.current = -1;
      if (playRef.current) playRef.current(n);
    };
    a.addEventListener('ended', onEnd);
    return () => a.removeEventListener('ended', onEnd);
  }, [items]);

  const playAll = () => {
    if (auto) {
      stop();
      return;
    }
    const first = items.findIndex((it) => it && it.id);
    if (first < 0) return;
    autoRef.current = true;
    setAuto(true);
    idxRef.current = -1;
    play(first);
  };

  const badge = (i) => {
    if (loading === i) return '…';
    if (current === i) return '❚❚';
    return '▶';
  };

  return (
    <>
      <div className="grid" style={{ gridTemplateColumns: `repeat(${cols},1fr)` }}>
        {items.map((it, i) => (
          <div
            className="slot filled"
            key={i}
            title={`${it.title} — ${it.artist}`}
            onClick={() => play(i)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                play(i);
              }
            }}
            style={{ cursor: it.id ? 'pointer' : 'default', position: 'relative', outline: current === i ? '2px solid var(--accent)' : 'none' }}
          >
            <img src={it.art} alt={it.title} />
            {it.id ? (
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  right: 4,
                  bottom: 4,
                  fontSize: 10,
                  lineHeight: '18px',
                  width: 18,
                  height: 18,
                  textAlign: 'center',
                  borderRadius: 9,
                  background: current === i || loading === i ? 'var(--accent)' : 'rgba(0,0,0,.55)',
                  color: '#fff',
                  opacity: current === i || loading === i ? 1 : 0.75
                }}
              >
                {badge(i)}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={playAll}>{auto ? '■ 停止' : '▶ 順番に試聴'}</button>
        <span className="hint" style={{ fontSize: 12 }}>ジャケットをタップすると30秒試聴できます</span>
      </div>
    </>
  );
}
