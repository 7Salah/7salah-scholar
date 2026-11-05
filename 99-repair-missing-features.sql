-- 7Salah Scholar: repair missing teacher/group/storage objects safely
-- Run once in Supabase SQL Editor. Does not delete user data or reset points.

begin;

-- Teacher profile fields used by the dedicated faculty page.
alter table public.profiles add column if not exists is_teacher boolean not null default false;
alter table public.profiles add column if not exists teacher_title text;
alter table public.profiles add column if not exists department text;

-- Study-group metadata and RPC. Keep parameter names aligned with groups.js.
alter table public.conversations add column if not exists subject text;
alter table public.conversations add column if not exists level text;
alter table public.conversations add column if not exists university text;
alter table public.conversations add column if not exists is_public boolean not null default true;

create or replace function public.create_study_group(
  ttl text, subj text default null, lvl text default null,
  univ text default null, pub boolean default true
) returns uuid
language plpgsql security definer set search_path=public as $$
declare c uuid;
begin
  if auth.uid() is null or length(trim(coalesce(ttl,'')))=0 then
    raise exception 'not allowed';
  end if;
  if (select count(*) from public.members m
      join public.conversations v on v.id=m.conv_id
      where m.user_id=auth.uid() and m.role='admin' and v.kind='group'
        and v.created_at>now()-interval '1 day')>=3 then
    raise exception 'الحد اليومي لإنشاء المجموعات 3';
  end if;
  insert into public.conversations(kind,title,is_public,subject,level,university)
  values('group',left(trim(ttl),80),pub,
    nullif(left(trim(coalesce(subj,'')),80),''),nullif(lvl,''),
    nullif(left(trim(coalesce(univ,'')),80),'')) returning id into c;
  insert into public.members(conv_id,user_id,role) values(c,auth.uid(),'admin');
  return c;
end $$;
revoke all on function public.create_study_group(text,text,text,text,boolean) from public;
grant execute on function public.create_study_group(text,text,text,text,boolean) to authenticated;

-- Storage buckets referenced by the upload code.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('avatars','avatars',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('posts','posts',true,52428800,array[
 'image/jpeg','image/png','image/webp','application/pdf','text/plain','text/csv',
 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
 'video/mp4','video/webm'])
on conflict (id) do update set public=true,file_size_limit=52428800,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "avatar read" on storage.objects;
create policy "avatar read" on storage.objects for select using(bucket_id='avatars');
drop policy if exists "avatar up" on storage.objects;
create policy "avatar up" on storage.objects for insert to authenticated
with check(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "posts up" on storage.objects;
create policy "posts up" on storage.objects for insert to authenticated
with check(bucket_id='posts' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "posts del" on storage.objects;
create policy "posts del" on storage.objects for delete to authenticated
using(bucket_id='posts' and (storage.foldername(name))[1]=auth.uid()::text);

commit;
notify pgrst, 'reload schema';
