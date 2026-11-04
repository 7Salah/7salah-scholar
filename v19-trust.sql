-- 7Salah Scholar v19 — الثقة: نقاط على الخادم + توثيق المستوى الأكاديمي + إخفاء الترتيب + حماية المحتوى
-- شغّله مرة واحدة في Supabase → SQL Editor بعد v19-ranking.sql و v19-formats.sql.

-- ============ 1) النقاط تُحسب على الخادم ============
-- العميل لا يرسل «نقاطًا» بل «أنشطة»، والخادم يطبّق قيمة النقطة والحد اليومي لكل نشاط.
create table if not exists public.act_rules(kind text primary key, pts int not null check(pts>0), daily_cap int not null check(daily_cap>0));
insert into public.act_rules(kind,pts,daily_cap) values
 ('search',2,5),('save',5,6),('cite',3,5),('rem',5,2),('cal',5,2),
 ('review',1,100),('quiz',15,6),('deck',8,3),('chal',20,3),('perfect',25,2)
on conflict (kind) do update set pts=excluded.pts, daily_cap=excluded.daily_cap;
alter table public.act_rules enable row level security;   -- بلا سياسات: لا وصول مباشر

create table if not exists public.daily_acts(user_id uuid not null references auth.users on delete cascade,
  day date not null default ((now() at time zone 'utc')::date), kind text not null, n int not null default 0,
  primary key(user_id,day,kind));
alter table public.daily_acts enable row level security;  -- بلا سياسات: لا وصول مباشر

create or replace function public.report_acts(acts jsonb) returns int language plpgsql security definer set search_path=public as $$
declare e record; r record; used int; ok int; gain int:=0; today date:=(now() at time zone 'utc')::date; total int;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  if jsonb_typeof(acts)<>'object' then raise exception 'bad payload'; end if;
  for e in select key as k, value as v from jsonb_each_text(acts) loop
    select * into r from public.act_rules where kind=e.k;
    if not found then continue; end if;
    used:=coalesce((select n from public.daily_acts where user_id=auth.uid() and day=today and kind=e.k),0);
    ok:=least(least(greatest(e.v::int,0),500), greatest(r.daily_cap-used,0));
    if ok>0 then
      insert into public.daily_acts(user_id,day,kind,n) values(auth.uid(),today,e.k,ok)
        on conflict (user_id,day,kind) do update set n=public.daily_acts.n+ok;
      gain:=gain+ok*r.pts;
    end if;
  end loop;
  update public.profiles set points=points+gain where id=auth.uid() returning points into total;
  return coalesce(total,0);
end $$;
revoke all on function public.report_acts(jsonb) from public;
grant execute on function public.report_acts(jsonb) to authenticated;

-- الدالة القديمة كانت تقبل نقاطًا ومستوى من العميل: تُحذف
drop function if exists public.sync_progress(int,text,text);
create or replace function public.sync_emoji(emo text) returns void language sql security definer set search_path=public as $$
  update public.profiles set avatar_emoji=left(emo,8) where id=auth.uid()
$$;
revoke all on function public.sync_emoji(text) from public;
grant execute on function public.sync_emoji(text) to authenticated;

-- ============ 2) توثيق المستوى الأكاديمي ============
alter table public.profiles add column if not exists level_verified boolean not null default false;
alter table public.profiles add column if not exists hide_rank boolean not null default false;
grant update(hide_rank) on public.profiles to authenticated;   -- فقط هذا العمود يعدّله المستخدم بنفسه

-- إعادة ضبط لمرة واحدة: المستويات والنقاط السابقة كانت بلا تحقق
update public.profiles set academic_level='l1', level_verified=false, points=0;

create or replace function public.profiles_before_insert() returns trigger language plpgsql as $$
begin
  new.researcher_uid:=public.next_researcher_uid();
  new.points:=0; new.academic_level:='l1'; new.level_verified:=false; new.hide_rank:=false;
  return new;
end $$;

-- نطاقات بريد الجامعات المعتمدة: تُضاف يدويًا من SQL Editor، مثال:
--   insert into public.allowed_domains(domain) values ('univ-constantine2.dz'),('umc.edu.dz');
create table if not exists public.allowed_domains(domain text primary key check(domain=lower(domain)));
alter table public.allowed_domains enable row level security;

create table if not exists public.level_requests(id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  level text not null check(level in('l1','l2','l3','m1','m2','phd')),
  note text check(length(note)<=300),
  status text not null default 'pending' check(status in('pending','approved','rejected')),
  created_at timestamptz not null default now(), decided_at timestamptz);
create unique index if not exists level_one_pending on public.level_requests(user_id) where status='pending';
alter table public.level_requests enable row level security;
drop policy if exists "lvreq own read" on public.level_requests;
create policy "lvreq own read" on public.level_requests for select to authenticated using(user_id=auth.uid());

-- طلب مستوى: ليسانس 1 مباشر. ليسانس 2/3 يُعتمد تلقائيًا إن كان بريدك من نطاق جامعي معتمد. الباقي (ماستر/دكتوراه) بموافقة المشرف.
create or replace function public.request_level(lvl text, note text default null) returns text language plpgsql security definer set search_path=public as $$
declare em text; dom text; dom_ok boolean;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  if lvl not in('l1','l2','l3','m1','m2','phd') then raise exception 'bad level'; end if;
  select lower(email) into em from auth.users where id=auth.uid();
  dom:=split_part(coalesce(em,''),'@',2);
  dom_ok:=dom<>'' and exists(select 1 from public.allowed_domains d where dom=d.domain or dom like '%.'||d.domain);
  if lvl='l1' then
    update public.profiles set academic_level='l1', level_verified=dom_ok where id=auth.uid();
    delete from public.level_requests where user_id=auth.uid() and status='pending';
    return 'approved';
  end if;
  if dom_ok and lvl in('l2','l3') then
    update public.profiles set academic_level=lvl, level_verified=true where id=auth.uid();
    delete from public.level_requests where user_id=auth.uid() and status='pending';
    insert into public.level_requests(user_id,level,note,status,decided_at) values(auth.uid(),lvl,left(note,300),'approved',now());
    return 'approved';
  end if;
  delete from public.level_requests where user_id=auth.uid() and status='pending';
  insert into public.level_requests(user_id,level,note) values(auth.uid(),lvl,left(note,300));
  return 'pending';
end $$;
revoke all on function public.request_level(text,text) from public;
grant execute on function public.request_level(text,text) to authenticated;

create or replace function public.admin_level_requests() returns table(rid uuid,uid uuid,username text,name text,level text,note text,created_at timestamptz,dom text)
language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and is_admin) then raise exception 'admin only'; end if;
  return query select r.id,r.user_id,p.username,p.name,r.level,r.note,r.created_at,split_part(lower(u.email),'@',2)
    from public.level_requests r join public.profiles p on p.id=r.user_id join auth.users u on u.id=r.user_id
    where r.status='pending' order by r.created_at;
end $$;
revoke all on function public.admin_level_requests() from public;
grant execute on function public.admin_level_requests() to authenticated;

create or replace function public.admin_level(req uuid, approve boolean) returns void language plpgsql security definer set search_path=public as $$
declare r record;
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and is_admin) then raise exception 'admin only'; end if;
  select * into r from public.level_requests where id=req and status='pending';
  if not found then raise exception 'request not found'; end if;
  if approve then update public.profiles set academic_level=r.level, level_verified=true where id=r.user_id; end if;
  update public.level_requests set status=case when approve then 'approved' else 'rejected' end, decided_at=now() where id=req;
end $$;
revoke all on function public.admin_level(uuid,boolean) from public;
grant execute on function public.admin_level(uuid,boolean) to authenticated;

-- ============ 3) التصنيف اختياري ============
drop function if exists public.leaderboard(text);
create or replace function public.leaderboard(grp text) returns table(id uuid,username text,name text,avatar_url text,avatar_emoji text,academic_level text,level_verified boolean,points int,researcher_uid bigint,verified boolean,rank bigint,total bigint)
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

-- ============ 4) حماية المحتوى والمخزن ============
update storage.buckets set file_size_limit=5242880 where id='posts';   -- 5MB لحماية حصة التخزين

create or replace function public.posts_rate() returns trigger language plpgsql as $$
begin
  if (select count(*) from public.posts where user_id=new.user_id and created_at>now()-interval '1 day')>=20 then
    raise exception 'تجاوزت الحد اليومي للنشر (20 منشورًا)';
  end if;
  return new;
end $$;
drop trigger if exists posts_rate on public.posts;
create trigger posts_rate before insert on public.posts for each row execute function public.posts_rate();
