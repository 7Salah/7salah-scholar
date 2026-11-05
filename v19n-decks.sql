-- 7Salah Scholar v19n — مشاركة حزم بطاقات الدراسة 🃏 داخل المنشورات
-- شغّله مرة واحدة في Supabase → SQL Editor (بعد v19m-topic.sql). آمن لإعادة التشغيل.
-- نخزّن الحزمة المضغوطة في جدول منفصل حتى لا تتضخم الخلاصة (تُحمَّل عند عرض المنشور فقط).

alter table public.posts drop constraint if exists posts_kind_check;
alter table public.posts add constraint posts_kind_check
  check(kind in('research','experience','video','lesson','attachment','board','map','post','question','deck'));

create table if not exists public.post_decks(
  post_id uuid primary key references public.posts on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  data text not null check(length(data) between 20 and 120000),
  n int not null check(n between 1 and 60),
  created_at timestamptz default now());
alter table public.post_decks enable row level security;
drop policy if exists "read" on public.post_decks;
create policy "read" on public.post_decks for select using(true);
drop policy if exists "ins own" on public.post_decks;
-- لا يُدرج الحزمة إلا صاحب المنشور، ولمنشور من نوع deck فقط
create policy "ins own" on public.post_decks for insert to authenticated
  with check(user_id=auth.uid() and exists(select 1 from public.posts p where p.id=post_id and p.user_id=auth.uid() and p.kind='deck'));
