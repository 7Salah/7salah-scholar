-- 7Salah Scholar v19c — مجموعات المواد + الإرشاد الأكاديمي
-- شغّله مرة واحدة في Supabase → SQL Editor بعد v19b-levels-files.sql.

-- ============ 1) مجموعات المواد: مجموعة دردشة لها مادة ومستوى وجامعة ============
alter table public.conversations add column if not exists subject text check(length(subject)<=80);
alter table public.conversations add column if not exists level text check(level in('l1','l2','l3','m1','m2','phd'));
alter table public.conversations add column if not exists university text check(length(university)<=80);
create index if not exists conv_subject_idx on public.conversations(lower(subject));

create or replace function public.create_study_group(ttl text, subj text default null, lvl text default null, univ text default null, pub boolean default true)
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

-- ============ 2) الإرشاد: مرشد موثّق (ماستر/دكتوراه) يستقبل طلبات من مستويات أدنى ============
alter table public.profiles add column if not exists mentor_open boolean not null default false;
alter table public.profiles add column if not exists mentor_topics text check(length(mentor_topics)<=120);

create table if not exists public.mentor_requests(id uuid primary key default gen_random_uuid(),
  mentee uuid not null references auth.users on delete cascade,
  mentor uuid not null references auth.users on delete cascade,
  msg text check(length(msg)<=300),
  status text not null default 'pending' check(status in('pending','accepted','declined')),
  created_at timestamptz not null default now(), decided_at timestamptz);
create unique index if not exists mentor_one_pending on public.mentor_requests(mentee,mentor) where status='pending';
alter table public.mentor_requests enable row level security;   -- بلا سياسات: الوصول عبر الدوال فقط

create or replace function public.lvl_idx(l text) returns int language sql immutable as
$$ select coalesce(array_position(array['l1','l2','l3','m1','m2','phd'],l),0) $$;

-- المرشد يفتح/يغلق استقبال الطلبات: يشترط مستوى ماستر/دكتوراه موثّقًا
create or replace function public.set_mentor(opn boolean, topics text default null) returns void language plpgsql security definer set search_path=public as $$
declare p record;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  select * into p from public.profiles where id=auth.uid();
  if opn and not (p.academic_level in('m1','m2','phd') and p.level_verified) then
    raise exception 'الإرشاد متاح لطلبة الماستر والدكتوراه الموثّقين فقط';
  end if;
  update public.profiles set mentor_open=opn, mentor_topics=nullif(left(trim(coalesce(topics,'')),120),'') where id=auth.uid();
end $$;
revoke all on function public.set_mentor(boolean,text) from public;
grant execute on function public.set_mentor(boolean,text) to authenticated;

create or replace function public.list_mentors(q text default null)
returns table(id uuid,username text,name text,avatar_url text,avatar_emoji text,academic_level text,university text,field text,mentor_topics text)
language sql stable security definer set search_path=public as $$
  select p.id,p.username,p.name,p.avatar_url,p.avatar_emoji,p.academic_level,p.university,p.field,p.mentor_topics
  from public.profiles p
  where p.mentor_open and p.level_verified and p.academic_level in('m1','m2','phd') and p.id<>coalesce(auth.uid(),'00000000-0000-0000-0000-000000000000'::uuid)
    and (coalesce(q,'')='' or p.mentor_topics ilike '%'||q||'%' or p.field ilike '%'||q||'%' or p.name ilike '%'||q||'%' or p.university ilike '%'||q||'%')
  order by p.points desc limit 30
$$;
revoke all on function public.list_mentors(text) from public;
grant execute on function public.list_mentors(text) to authenticated;

create or replace function public.request_mentor(mentor_id uuid, message text default null) returns void language plpgsql security definer set search_path=public as $$
declare me record; mt record;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  select * into me from public.profiles where id=auth.uid();
  select * into mt from public.profiles where id=mentor_id;
  if mt.id is null or not (mt.mentor_open and mt.level_verified and mt.academic_level in('m1','m2','phd')) then raise exception 'المرشد غير متاح'; end if;
  if public.lvl_idx(mt.academic_level)<=public.lvl_idx(me.academic_level) then raise exception 'اختر مرشدًا بمستوى أعلى من مستواك'; end if;
  if (select count(*) from public.mentor_requests where mentee=auth.uid() and status='pending')>=3 then raise exception 'لديك 3 طلبات معلّقة، انتظر الردّ عليها'; end if;
  insert into public.mentor_requests(mentee,mentor,msg) values(auth.uid(),mentor_id,left(message,300));
exception when unique_violation then raise exception 'أرسلت طلبًا لهذا المرشد بالفعل';
end $$;
revoke all on function public.request_mentor(uuid,text) from public;
grant execute on function public.request_mentor(uuid,text) to authenticated;

create or replace function public.my_mentor_requests() returns table(rid uuid,uid uuid,username text,name text,academic_level text,msg text,created_at timestamptz)
language sql stable security definer set search_path=public as $$
  select r.id,r.mentee,p.username,p.name,p.academic_level,r.msg,r.created_at
  from public.mentor_requests r join public.profiles p on p.id=r.mentee
  where r.mentor=auth.uid() and r.status='pending' order by r.created_at
$$;
revoke all on function public.my_mentor_requests() from public;
grant execute on function public.my_mentor_requests() to authenticated;

-- الردّ: القبول يفتح محادثة مباشرة بين المرشد والطالب ويعيد معرّفها
create or replace function public.answer_mentor(req uuid, accept boolean) returns uuid language plpgsql security definer set search_path=public as $$
declare r record; c uuid;
begin
  select * into r from public.mentor_requests where id=req and mentor=auth.uid() and status='pending';
  if not found then raise exception 'request not found'; end if;
  update public.mentor_requests set status=case when accept then 'accepted' else 'declined' end, decided_at=now() where id=req;
  if accept then c:=public.start_dm(r.mentee); end if;
  return c;
end $$;
revoke all on function public.answer_mentor(uuid,boolean) from public;
grant execute on function public.answer_mentor(uuid,boolean) to authenticated;
