-- 7Salah Scholar v19p — القصص القصيرة ⏳ (تنتهي بعد 24 ساعة)
-- شغّله مرة واحدة في Supabase → SQL Editor (بعد v19o-deck-adds.sql). آمن لإعادة التشغيل.
-- أنواع القصص: نص، «ما راجعته اليوم»، صورة (تُرفع إلى دلو posts في مجلد صاحبها).
-- الانتهاء يُفرض في القاعدة (لا يستطيع العميل تمديده): المشغّل يضبط created_at وexpires_at ويحدّ 10 قصص/24 ساعة.

create table if not exists public.stories(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  kind text not null check(kind in('text','study','image')),
  body text check(body is null or length(body)<=280),
  bg smallint not null default 0 check(bg between 0 and 5),
  file_path text check(file_path is null or (file_path ~ ('^'||user_id::text||'/[A-Za-z0-9._-]{1,120}$') and file_path not like '%..%')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now()+interval '24 hours',
  check((kind='image' and file_path is not null) or (kind<>'image' and body is not null and length(btrim(body))>0)));
create index if not exists stories_user_idx on public.stories(user_id,created_at desc);
create index if not exists stories_exp_idx on public.stories(expires_at);

create table if not exists public.story_reports(
  story_id uuid not null references public.stories on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  created_at timestamptz default now(),
  primary key(story_id,user_id));

-- تُخفى القصة تلقائيًا عند 3 مبلِّغين مختلفين (يراجعها المشرف لاحقًا)
create or replace function public.story_hidden(sid uuid) returns boolean
language sql stable security definer set search_path=public as $$
  select (select count(*) from public.story_reports where story_id=sid)>=3 $$;
grant execute on function public.story_hidden(uuid) to authenticated;

create or replace function public.stories_guard() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  new.created_at:=now(); new.expires_at:=now()+interval '24 hours';
  if (select count(*) from public.stories where user_id=new.user_id and created_at>now()-interval '24 hours')>=10 then
    raise exception 'stories_limit'; end if;
  return new; end $$;
drop trigger if exists stories_guard_t on public.stories;
create trigger stories_guard_t before insert on public.stories for each row execute function public.stories_guard();

alter table public.stories enable row level security;
alter table public.story_reports enable row level security;
drop policy if exists "read" on public.stories;
create policy "read" on public.stories for select to authenticated
  using(user_id=auth.uid() or (expires_at>now() and not public.story_hidden(id)));
drop policy if exists "ins own" on public.stories;
create policy "ins own" on public.stories for insert to authenticated with check(user_id=auth.uid());
drop policy if exists "del own" on public.stories;
create policy "del own" on public.stories for delete to authenticated using(user_id=auth.uid());
drop policy if exists "admin del" on public.stories;
create policy "admin del" on public.stories for delete to authenticated
  using(exists(select 1 from public.profiles where id=auth.uid() and is_admin));
drop policy if exists "rep ins" on public.story_reports;
create policy "rep ins" on public.story_reports for insert to authenticated
  with check(user_id=auth.uid() and exists(select 1 from public.stories s where s.id=story_id and s.user_id<>auth.uid()));
drop policy if exists "rep admin read" on public.story_reports;
create policy "rep admin read" on public.story_reports for select to authenticated
  using(exists(select 1 from public.profiles where id=auth.uid() and is_admin));

-- تنظيف اختياري للصفوف المنتهية (الصور تُحذف من الدلو عند دخول صاحبها؛ للحذف الشامل استخدم cron/Edge Function)
create or replace function public.purge_expired_stories() returns int
language plpgsql security definer set search_path=public as $$
declare n int; begin
  if not exists(select 1 from public.profiles where id=auth.uid() and is_admin) then raise exception 'admin only'; end if;
  delete from public.stories where expires_at<now()-interval '1 hour' and file_path is null; get diagnostics n=row_count; return n; end $$;
