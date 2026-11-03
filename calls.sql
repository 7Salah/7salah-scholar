-- شغّل بعد الملفات السابقة: مكالمات صوت وفيديو (إشارات WebRTC عبر جدول محميّ بنفس قواعد الحظر)
create table call_signals(id bigint generated always as identity primary key, conv_id uuid not null references conversations on delete cascade,
 user_id uuid not null default auth.uid() references profiles on delete cascade, kind text not null check(kind in('offer','answer','ice','bye')),
 payload jsonb not null check(pg_column_size(payload)<20000), created_at timestamptz default now());
alter table call_signals enable row level security;
create policy "sig read" on call_signals for select using(is_member(conv_id));
create policy "sig send" on call_signals for insert to authenticated with check(user_id=auth.uid() and can_send(conv_id)
 and exists(select 1 from conversations where id=conv_id and kind='dm'));
create function purge_signals() returns trigger language plpgsql security definer set search_path=public as $$
begin delete from call_signals where created_at<now()-interval '10 minutes'; return null; end $$;
create trigger sig_purge after insert on call_signals for each statement execute function purge_signals();
alter publication supabase_realtime add table call_signals;
