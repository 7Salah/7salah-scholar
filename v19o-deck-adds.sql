-- 7Salah Scholar v19o — عدّاد إضافة الحزم 🔥 والحزم الرائجة
-- شغّله مرة واحدة في Supabase → SQL Editor (بعد v19n-decks.sql). آمن لإعادة التشغيل.
-- كل مستخدم يُحتسب مرة واحدة لكل حزمة (المفتاح الأساسي)، ولا تُحتسب إضافة صاحب الحزمة لحزمته.
create table if not exists public.deck_adds(
  post_id uuid not null references public.posts on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  created_at timestamptz default now(),
  primary key(post_id,user_id));
create index if not exists deck_adds_recent_idx on public.deck_adds(created_at desc);
alter table public.deck_adds enable row level security;
drop policy if exists "read" on public.deck_adds;
create policy "read" on public.deck_adds for select using(true);
drop policy if exists "ins own" on public.deck_adds;
create policy "ins own" on public.deck_adds for insert to authenticated
  with check(user_id=auth.uid() and exists(select 1 from public.posts p where p.id=post_id and p.kind='deck' and p.user_id<>auth.uid()));
