'use client';
import { APPLE_AFF } from './lib/aff';

export default function TrackLink({ href, gid, title, artist }) {
  const onClick = () => {
    try {
      navigator.sendBeacon('/api/play', new Blob([JSON.stringify({ gid, title, artist })], { type: 'application/json' }));
    } catch (e) {}
  };
  const h = APPLE_AFF && href && href.includes('music.apple.com') ? href + (href.includes('?') ? '&' : '?') + 'at=' + APPLE_AFF : href;
  return <a href={h} onClick={onClick} style={{ color: 'var(--accent)', marginLeft: 6 }}>聴く</a>;
}
