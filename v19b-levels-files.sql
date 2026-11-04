-- 7Salah Scholar v19b — المستوى بالاختيار الحر (موثّق/غير موثّق) + رفع ملفات حتى 1GB
-- شغّله مرة واحدة في Supabase → SQL Editor بعد v19-trust.sql.

-- ============ 1) المستوى: يختاره المستخدم بنفسه، والتوثيق شيء منفصل ============
alter table public.profiles add column if not exists level_set boolean not null default false;
-- من غيّر مستواه سابقًا (غير l1) أو وُثّق يُعدّ مختارًا
update public.profiles set level_set=true where academic_level<>'l1' or level_verified;

drop function if exists public.request_level(text,text);
create or replace function public.request_level(lvl text, note text default null, verify boolean default false) returns text
language plpgsql security definer set search_path=public as $$
declare em text; dom text; dom_ok boolean; ver boolean;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  if lvl not in('l1','l2','l3','m1','m2','phd') then raise exception 'bad level'; end if;
  select lower(email) into em from auth.users where id=auth.uid();
  dom:=split_part(coalesce(em,''),'@',2);
  dom_ok:=dom<>'' and exists(select 1 from public.allowed_domains d where dom=d.domain or dom like '%.'||d.domain);
  -- البريد الجامعي المعتمد يوثّق ليسانس 1-3 تلقائيًا؛ غير ذلك يبقى «غير موثّق» حتى يعتمده المشرف
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

-- ============ 2) حدّ الملف 50MB (سقف الخطة المجانية) + السماح بفيديو MP4/WebM ============
update storage.buckets set file_size_limit=52428800,
 allowed_mime_types=array['image/jpeg','image/png','image/webp','application/pdf','text/plain','text/csv',
 'application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
 'video/mp4','video/webm'] where id='posts';
