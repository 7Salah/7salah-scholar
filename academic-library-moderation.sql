-- 7Salah Scholar — Shared Academic Library + Moderator Review
-- Apply this migration manually in Supabase SQL Editor after the existing schema.sql and admin.sql.
-- It does not alter or delete existing tables, posts, messages, or user files.

begin;

-- Existing admin panel uses this flag; add it safely if admin.sql has not been applied yet.
alter table public.profiles add column if not exists is_admin boolean not null default false;

create table if not exists public.academic_resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 180),
  description text check (description is null or length(description) <= 1000),
  university text,
  faculty text,
  department text,
  level text,
  semester text,
  course text,
  content_type text not null default 'other' check (content_type in ('lecture','td','summary','reference','other')),
  file_path text not null unique,
  file_name text not null check (length(file_name) <= 255),
  file_size bigint not null check (file_size > 0 and file_size <= 26214400),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  review_note text check (review_note is null or length(review_note) <= 500),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint academic_resource_path_owner check (file_path like user_id::text || '/%')
);

create index if not exists academic_resources_status_created_idx
  on public.academic_resources(status, created_at desc);
create index if not exists academic_resources_course_idx
  on public.academic_resources(university, department, level, semester, course);

alter table public.academic_resources enable row level security;
revoke all on public.academic_resources from anon, authenticated;
grant select, insert on public.academic_resources to authenticated;

drop policy if exists "academic resources visible" on public.academic_resources;
create policy "academic resources visible" on public.academic_resources
  for select to authenticated
  using (status = 'approved' or user_id = auth.uid() or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.is_admin
  ));

drop policy if exists "academic resources submit own" on public.academic_resources;
create policy "academic resources submit own" on public.academic_resources
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
    and file_path like auth.uid()::text || '/%'
  );

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('academic-library','academic-library',false,26214400,array['application/pdf'])
on conflict (id) do update set public=false, file_size_limit=26214400, allowed_mime_types=array['application/pdf'];

drop policy if exists "academic library upload own" on storage.objects;
create policy "academic library upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'academic-library' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "academic library read permitted" on storage.objects;
create policy "academic library read permitted" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'academic-library' and exists (
      select 1 from public.academic_resources r
      where r.file_path = name
        and (r.status = 'approved' or r.user_id = auth.uid()
          or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
    )
  );

drop policy if exists "academic library delete own pending" on storage.objects;
create policy "academic library delete own pending" on storage.objects
  for delete to authenticated
  using (bucket_id = 'academic-library' and (storage.foldername(name))[1] = auth.uid()::text
    and not exists (select 1 from public.academic_resources r where r.file_path = name and r.status = 'approved'));

create or replace function public.admin_academic_resources()
returns table (
  id uuid, user_id uuid, title text, description text, university text, faculty text,
  department text, level text, semester text, course text, content_type text,
  file_path text, file_name text, file_size bigint, created_at timestamptz
)
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin) then
    raise exception 'admin only';
  end if;
  return query
    select r.id, r.user_id, r.title, r.description, r.university, r.faculty,
      r.department, r.level, r.semester, r.course, r.content_type,
      r.file_path, r.file_name, r.file_size, r.created_at
    from public.academic_resources r
    where r.status = 'pending'
    order by r.created_at asc limit 100;
end $$;
revoke all on function public.admin_academic_resources() from public;
grant execute on function public.admin_academic_resources() to authenticated;

create or replace function public.review_academic_resource(resource_id uuid, decision text, review_note text default null)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin) then
    raise exception 'admin only';
  end if;
  if decision not in ('approved','rejected') then raise exception 'invalid decision'; end if;
  update public.academic_resources
    set status = decision,
        review_note = case when decision = 'rejected' then left(review_note,500) else null end,
        reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
    where id = resource_id and status = 'pending';
  if not found then raise exception 'resource not found or already reviewed'; end if;
end $$;
revoke all on function public.review_academic_resource(uuid,text,text) from public;
grant execute on function public.review_academic_resource(uuid,text,text) to authenticated;

notify pgrst, 'reload schema';
commit;
