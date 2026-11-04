-- 7Salah Scholar v19 — معرّف الباحث ID + المستوى الأكاديمي + تصنيف المنافسة
-- شغّله مرة واحدة في Supabase → SQL Editor بعد ملفات الإعداد السابقة (بعد v18-migration.sql).

alter table public.profiles add column if not exists academic_level text not null default 'l1';
alter table public.profiles drop constraint if exists profiles_academic_level_check;
alter table public.profiles add constraint profiles_academic_level_check check(academic_level in('l1','l2','l3','m1','m2','phd'));
alter table public.profiles add column if not exists points int not null default 0;
alter table public.profiles drop constraint if exists profiles_points_check;
alter table public.profiles add constraint profiles_points_check check(points>=0);
alter table public.profiles add column if not exists avatar_emoji text;
alter table public.profiles drop constraint if exists profiles_avatar_emoji_check;
alter table public.profiles add constraint profiles_avatar_emoji_check check(avatar_emoji is null or length(avatar_emoji)<=8);
alter table public.profiles add column if not exists researcher_uid bigint;

-- مولّد ID فريد من 9 خانات
create or replace function public.next_researcher_uid() returns bigint language plpgsql as $$
declare n bigint;
begin
  loop
    n:=100000000+floor(random()*900000000)::bigint;
    exit when not exists(select 1 from public.profiles where researcher_uid=n);
  end loop;
  return n;
end $$;

-- إعطاء ID للحسابات الحالية
update public.profiles set researcher_uid=public.next_researcher_uid() where researcher_uid is null;
create unique index if not exists profiles_researcher_uid_key on public.profiles(researcher_uid);

-- الحسابات الجديدة: يُفرض ID جديد ونقاط صفرية دائمًا، فلا يستطيع أحد اختيار ID أو نقاط عند التسجيل
create or replace function public.profiles_before_insert() returns trigger language plpgsql as $$
begin
  new.researcher_uid:=public.next_researcher_uid();
  new.points:=0;
  new.academic_level:='l1';
  return new;
end $$;
drop trigger if exists profiles_before_insert on public.profiles;
create trigger profiles_before_insert before insert on public.profiles for each row execute function public.profiles_before_insert();

-- لا تُمنح صلاحية update المباشر على الأعمدة الجديدة (ID, points, academic_level, avatar_emoji)؛ التحديث فقط عبر الدالة التالية.
create or replace function public.sync_progress(p int, lvl text, emo text) returns void language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  if lvl not in('l1','l2','l3','m1','m2','phd') then raise exception 'bad level'; end if;
  update public.profiles
     set academic_level=lvl,
         avatar_emoji=left(emo,8),
         points=greatest(points,least(greatest(coalesce(p,0),0),points+5000))
   where id=auth.uid();
end $$;
revoke all on function public.sync_progress(int,text,text) from public;
grant execute on function public.sync_progress(int,text,text) to authenticated;

-- لوحة الصدارة: grp = 'l' ليسانس | 'm' ماستر | 'd' دكتوراه (أعلى 100 في كل فئة)
create or replace function public.leaderboard(grp text) returns table(id uuid,username text,name text,avatar_url text,avatar_emoji text,academic_level text,points int,researcher_uid bigint,verified boolean,rank bigint,total bigint)
language sql stable security definer set search_path=public as $$
  with g as (
    select * from public.profiles
    where case grp when 'l' then academic_level in('l1','l2','l3')
                   when 'm' then academic_level in('m1','m2')
                   else academic_level='phd' end
  )
  select id,username,name,avatar_url,avatar_emoji,academic_level,points,researcher_uid,verified,
         rank() over(order by points desc), count(*) over()
  from g order by points desc, created_at limit 100
$$;
grant execute on function public.leaderboard(text) to anon, authenticated;
