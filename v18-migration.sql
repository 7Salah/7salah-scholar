-- 7Salah Scholar v18 migration — run once in Supabase SQL Editor after the existing setup files.
alter table public.profiles add column if not exists is_teacher boolean not null default false;
alter table public.profiles add column if not exists teacher_title text;
alter table public.profiles add column if not exists department text;
-- Prevent ordinary users from changing verification or teacher status.
revoke update on public.profiles from authenticated;
grant update(name,bio,field,university,avatar_url) on public.profiles to authenticated;
-- Add a dedicated kind for faculty learning materials.
alter table public.posts drop constraint if exists posts_kind_check;
alter table public.posts add constraint posts_kind_check check(kind in('research','experience','video','lesson'));
-- Extend the existing admin action function with controlled teacher assignment.
create or replace function public.admin_act(act text, tid uuid) returns void language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and is_admin) then raise exception 'admin only'; end if;
 if act='delete_post' then delete from public.posts where id=tid;
 elsif act='delete_message' then delete from public.messages where id=tid;
 elsif act='verify' then update public.profiles set verified=true where id=tid;
 elsif act='unverify' then update public.profiles set verified=false where id=tid;
 elsif act='set_teacher' then update public.profiles set is_teacher=true where id=tid;
 elsif act='unset_teacher' then update public.profiles set is_teacher=false where id=tid;
 elsif act='remove_user' then delete from auth.users where id=tid and id<>auth.uid();
 elsif act='resolve' then update public.reports set resolved=true where id=tid;
 else raise exception 'bad action'; end if;
end $$;
-- Existing verified=true is the premium/verified badge. Only administrators can toggle it via admin_act.
