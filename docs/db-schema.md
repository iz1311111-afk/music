# MusicGrid データベーススキーマ

Supabase (PostgreSQL) プロジェクト: `woagmpfyhrzobouktudp`

このファイルは本番DBの完全な再現手順です。DBが失われた場合、以下のSQLを
SupabaseのSQL Editorで上から順に実行すればスキーマを復元できます。

## 全体像

| テーブル | 役割 | 書き込み経路 |
|---|---|---|
| grids | 公開されたグリッド(24枚/9枚) | /api/grids (サーバー) |
| plays | 「聴く」クリックのログ | /api/play (sendBeacon) |
| comments | グリッドへの感想 | /api/comments (サーバー) |
| pageviews | ページビューのログ | /api/pv (sendBeacon) |
| users | 匿名アカウント(secretは非公開) | RPC create_user のみ |
| follows | フォロー関係 | RPC set_follow のみ |

セキュリティ方針: クライアントには公開可能キー(publishable key)しか渡さない。
RLS(Row Level Security)で「誰でも読める/書ける」範囲を絞り、
なりすましが問題になる操作(アカウント作成・フォロー)は
SECURITY DEFINER関数(RPC)経由でのみ許可し、secretで本人確認する。

## 再現SQL

```sql
-- 拡張(ランダムID生成に使用)
create extension if not exists pgcrypto;

-- 公開グリッド
create table if not exists grids (
  id text primary key,          -- 公開URLのスラッグ(ランダム10字)
  title text,
  cols int,
  rows int,
  items jsonb,                  -- [{art,title,artist,id,genre,src,type}] nullを含む
  user_id text,                 -- 作者(任意)
  author text,                  -- 作者表示名のスナップショット
  created_at timestamptz default now()
);
alter table grids enable row level security;
create policy "anon_insert" on grids for insert with check (true);
create policy "anon_read"   on grids for select using (true);

-- 聴くクリックのログ
create table if not exists plays (
  id bigserial primary key,
  gid text, title text, artist text,
  created_at timestamptz default now()
);
alter table plays enable row level security;
create policy "anon_insert_plays" on plays for insert with check (true);
create policy "anon_read_plays"   on plays for select using (true);

-- 感想
create table if not exists comments (
  id bigserial primary key,
  gid text, name text, body text,
  created_at timestamptz default now()
);
alter table comments enable row level security;
create policy "anon_insert_comments" on comments for insert with check (true);
create policy "anon_read_comments"   on comments for select using (true);

-- ページビュー
create table if not exists pageviews (
  id bigserial primary key,
  path text,
  created_at timestamptz default now()
);
alter table pageviews enable row level security;
create policy "anon_insert_pv" on pageviews for insert with check (true);
create policy "anon_read_pv"   on pageviews for select using (true);

-- 匿名アカウント(RLSポリシー無し = 直接アクセス全面禁止。RPCとビュー経由のみ)
create table if not exists users (
  id text primary key,
  secret text not null,         -- 本人確認用。絶対に公開しない
  name text not null,
  created_at timestamptz default now()
);
alter table users enable row level security;

-- secretを除いた公開ビュー
create or replace view users_public as
  select id, name, created_at from users;
grant select on users_public to anon;

-- フォロー関係(insert/deleteはRPC経由のみ)
create table if not exists follows (
  follower text, followee text,
  created_at timestamptz default now(),
  primary key (follower, followee)
);
alter table follows enable row level security;
create policy "anon_read_follows" on follows for select using (true);

-- アカウント作成RPC
create or replace function create_user(p_name text) returns json
language plpgsql security definer as $fn$
declare
  v_id text := encode(gen_random_bytes(8),'hex');
  v_secret text := encode(gen_random_bytes(16),'hex');
  v_name text := coalesce(nullif(trim(p_name),''),'名無し');
begin
  insert into users (id, secret, name) values (v_id, v_secret, v_name);
  return json_build_object('id', v_id, 'secret', v_secret, 'name', v_name);
end $fn$;
grant execute on function create_user(text) to anon;

-- フォロー切替RPC(secretで本人確認)
create or replace function set_follow(p_follower text, p_secret text, p_followee text, p_on boolean) returns boolean
language plpgsql security definer as $fn$
begin
  if not exists (select 1 from users where id = p_follower and secret = p_secret) then return false; end if;
  if p_follower = p_followee then return false; end if;
  if p_on then
    insert into follows (follower, followee) values (p_follower, p_followee) on conflict do nothing;
  else
    delete from follows where follower = p_follower and followee = p_followee;
  end if;
  return true;
end $fn$;
grant execute on function set_follow(text,text,text,boolean) to anon;

-- PostgRESTにスキーマ変更を通知
notify pgrst, 'reload schema';
```

## 既知の設計上の割り切り(MVP判断)

- grids/comments/plays/pageviews は匿名で誰でもinsert可能(スパム対策は文字数制限のみ)
- アカウントは端末のlocalStorageに保存され、機種変更で引き継げない
- grids.user_id はクライアント申告制(グリッドの作者なりすましは可能。フォローは不可能)
