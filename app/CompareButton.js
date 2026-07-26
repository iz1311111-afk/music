'use client';
import { useEffect, useState } from 'react';
import { SUPA_URL, SUPA_KEY } from './lib/supa';
import { getUser } from './lib/user';

const H = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` };

// 「自分との相性を見る」ボタン。
// 自分のグリッドは (1)アカウントのuser_id (2)端末に残した作成履歴 の順に探す。
export default function CompareButton({ gid }) {
  const [mine, setMine] = useState(undefined); // undefined=判定中 / null=未作成 / string=グリッドID

  useEffect(() => {
    let alive = true;
    (async () => {
      const u = getUser();
      if (u && u.id) {
        try {
          const r = await fetch(`${SUPA_URL}/rest/v1/grids?user_id=eq.${encodeURIComponent(u.id)}&select=id&order=created_at.desc&limit=1`, { headers: H });
          const rows = await r.json();
          if (alive && Array.isArray(rows) && rows[0] && rows[0].id !== gid) {
            setMine(rows[0].id);
            return;
          }
        } catch (e) {}
      }
      let local = [];
      try {
        local = JSON.parse(localStorage.getItem('mg_mine') || '[]');
      } catch (e) {}
      const own = (Array.isArray(local) ? local : []).filter((x) => x && x !== gid);
      if (alive) setMine(own.length ? own[own.length - 1] : null);
    })();
    return () => {
      alive = false;
    };
  }, [gid]);

  if (mine === undefined) return null;
  if (mine === null) {
    return (
      <a href="/">
        <button>自分の24枚を作って相性を見る</button>
      </a>
    );
  }
  return (
    <a href={`/match/${encodeURIComponent(mine)}/${encodeURIComponent(gid)}`}>
      <button>♪ 自分との相性を見る</button>
    </a>
  );
}
