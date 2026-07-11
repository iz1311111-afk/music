'use client';

export default function TrackLink({ href, gid, title, artist }) {
  const onClick = () => {
    try {
      navigator.sendBeacon('/api/play', new Blob([JSON.stringify({ gid, title, artist })], { type: 'application/json' }));
    } catch (e) {}
  };
  return <a href={href} onClick={onClick} style={{ color: 'var(--accent)', marginLeft: 6 }}>聴く</a>;
}
