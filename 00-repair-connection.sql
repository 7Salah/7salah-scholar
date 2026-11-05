-- 7Salah Scholar — إصلاح "Could not find the function ... in the schema cache"
-- شغّله كاملًا مرة واحدة في Supabase → SQL Editor. آمن لإعادة التشغيل، ولا يحذف بيانات ولا يعيد ضبط النقاط.
-- يُنشئ الدوال الناقصة: request_level(lvl,note,verify) · leaderboard(grp) · create_study_group(...) · report_acts(acts)
-- وما تعتمد عليه من أعمدة وجداول، ثم يطلب من PostgREST إعادة تحميل الـ schema cache.
-- شرط: schema.sql و chat.sql شُغّلا سابقًا (جدولا profiles و conversations موجودان).

begin;

-- ===== أعمدة profiles التي تحتاجها الدوال =====
alter table public.profiles add column if not exists academic_level  text    not null default 'l1';
alter table public.profiles add column if not exists points          int     not null default 0;
alter table public.profiles add column if not exists avatar_emoji    text;
alter table public.profiles add column if not exists researcher_uid  bigint;
alter table public.profiles add column if not exists level_verified  boolean not null default false;
alter table public.profiles add column if not exists level_set       boolean not null default false;
alter table public.profiles add column if not exists hide_rank       boolean not null default false;
alter table public.profiles add column if not exists verified        boolean not null default false;

-- ===== أعمدة conversations للمجموعات =====
alter table public.conversations add column if not exists subject    text;
alter table public.conversations add column if not exists level      text;
alter table public.conversations add column if not exists university text;
alter table public.conversations add column if not exists is_public  boolean not null default true;

-- ===== جداول المستوى =====
create table if not exists public.allowed_domains(domain text primary key check(domain=lower(domain)));
alter table public.allowed_domains enable row level security;

create table if not exists public.level_requests(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  level text not null check(level in('l1','l2','l3','m1','m2','phd')),
  note text check(length(note)<=300),
  status text not null default 'pending' check(status in('pending','approved','rejected')),
  created_at timestamptz not null default now(), decided_at timestamptz);
create unique index if not exists level_one_pending on public.level_requests(user_id) where status='pending';
alter table public.level_requests enable row level security;
drop policy if exists "lvreq own read" on public.level_requests;
create policy "lvreq own read" on public.level_requests for select to authenticated using(user_id=auth.uid());

-- ===== 1) request_level(lvl, note, verify) =====
drop function if exists public.request_level(text,text);
drop function if exists public.request_level(text,text,boolean);
create function public.request_level(lvl text, note text default null, verify boolean default false) returns text
language plpgsql security definer set search_path=public as $$
declare em text; dom text; dom_ok boolean; ver boolean;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  if lvl not in('l1','l2','l3','m1','m2','phd') then raise exception 'bad level'; end if;
  select lower(email) into em from auth.users where id=auth.uid();
  dom:=split_part(coalesce(em,''),'@',2);
  dom_ok:=dom<>'' and exists(select 1 from public.allowed_domains d where dom=d.domain or dom like '%.'||d.domain);
  ver:=dom_ok and lvl in('l1','l2','l3');
  update public.profiles set academic_level=lvl, level_set=true, level_verified=ver where id=auth.uid();
  delete from public.level_requests where user_id=auth.uid() and status='pending';
  if ver then return 'verified'; end if;
  if verify then
    insert into public.level_requests(user_id,level,note) values(auth.uid(),lvl,left(note,300));
    return 'pending';
  end if;
  return 'declared';
end $$;
revoke all on function public.request_level(text,text,boolean) from public;
grant execute on function public.request_level(text,text,boolean) to authenticated;

-- ===== 2) leaderboard(grp) =====
drop function if exists public.leaderboard(text);
create function public.leaderboard(grp text) returns table(id uuid,username text,name text,avatar_url text,avatar_emoji text,academic_level text,level_verified boolean,points int,researcher_uid bigint,verified boolean,rank bigint,total bigint)
language sql stable security definer set search_path=public as $$
  with g as (
    select * from public.profiles
    where not hide_rank and case grp when 'l' then academic_level in('l1','l2','l3')
                                     when 'm' then academic_level in('m1','m2')
                                     else academic_level='phd' end
  )
  select id,username,name,avatar_url,avatar_emoji,academic_level,level_verified,points,researcher_uid,verified,
         rank() over(order by points desc), count(*) over()
  from g order by points desc, created_at limit 100
$$;
grant execute on function public.leaderboard(text) to anon, authenticated;

-- ===== 3) create_study_group(ttl, subj, lvl, univ, pub) =====
drop function if exists public.create_study_group(text,text,text,text,boolean);
create function public.create_study_group(ttl text, subj text default null, lvl text default null, univ text default null, pub boolean default true)
returns uuid language plpgsql security definer set search_path=public as $$
declare c uuid;
begin
  if auth.uid() is null or length(trim(coalesce(ttl,'')))=0 then raise exception 'not allowed'; end if;
  if (select count(*) from public.members m join public.conversations v on v.id=m.conv_id
      where m.user_id=auth.uid() and m.role='admin' and v.kind='group' and v.created_at>now()-interval '1 day')>=3 then
    raise exception 'الحد اليومي لإنشاء المجموعات 3';
  end if;
  insert into public.conversations(kind,title,is_public,subject,level,university)
    values('group',left(trim(ttl),80),pub,nullif(left(trim(coalesce(subj,'')),80),''),nullif(lvl,''),nullif(left(trim(coalesce(univ,'')),80),'')) returning id into c;
  insert into public.members(conv_id,user_id,role) values(c,auth.uid(),'admin');
  return c;
end $$;
revoke all on function public.create_study_group(text,text,text,text,boolean) from public;
grant execute on function public.create_study_group(text,text,text,text,boolean) to authenticated;

commit;

-- أعد تحميل الـ schema cache (ضروري ليراها PostgREST فورًا)
notify pgrst, 'reload schema';
