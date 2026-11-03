-- شغّل هذا الملف كاملًا في Supabase → SQL Editor
create table profiles(id uuid primary key references auth.users on delete cascade,
 username text unique not null check(username ~ '^[a-z0-9_]{3,20}$'), name text, bio text check(length(bio)<=300),
 field text, university text, avatar_url text, verified boolean not null default false, created_at timestamptz default now());
create table posts(id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references profiles on delete cascade,
 kind text not null check(kind in('research','experience','video')), title text not null check(length(title) between 1 and 150),
 body text check(length(body)<=3000), doi text check(doi ~ '^10\.\d{4,9}/\S+$'), video_url text check(video_url ~ '^https://'), created_at timestamptz default now());
create table likes(post_id uuid references posts on delete cascade, user_id uuid default auth.uid() references profiles on delete cascade, primary key(post_id,user_id));
create table comments(id uuid primary key default gen_random_uuid(), post_id uuid not null references posts on delete cascade,
 user_id uuid not null default auth.uid() references profiles on delete cascade, body text not null check(length(body) between 1 and 500), created_at timestamptz default now());
create table follows(follower uuid default auth.uid() references profiles on delete cascade, followee uuid references profiles on delete cascade,
 primary key(follower,followee), check(follower<>followee));
create table reports(id uuid primary key default gen_random_uuid(), post_id uuid references posts on delete cascade, user_id uuid default auth.uid(), created_at timestamptz default now());

alter table profiles enable row level security; alter table posts enable row level security; alter table likes enable row level security;
alter table comments enable row level security; alter table follows enable row level security; alter table reports enable row level security;
create policy "read" on profiles for select using(true);
create policy "upd own" on profiles for update to authenticated using(id=auth.uid());
revoke update on profiles from authenticated; grant update(name,bio,field,university,avatar_url) on profiles to authenticated; -- لا يستطيع أحد توثيق نفسه
create policy "read" on posts for select using(true);
create policy "ins own" on posts for insert to authenticated with check(user_id=auth.uid());
create policy "del own" on posts for delete to authenticated using(user_id=auth.uid());
create policy "read" on likes for select using(true);
create policy "ins own" on likes for insert to authenticated with check(user_id=auth.uid());
create policy "del own" on likes for delete to authenticated using(user_id=auth.uid());
create policy "read" on comments for select using(true);
create policy "ins own" on comments for insert to authenticated with check(user_id=auth.uid());
create policy "del own" on comments for delete to authenticated using(user_id=auth.uid());
create policy "read" on follows for select using(true);
create policy "ins own" on follows for insert to authenticated with check(follower=auth.uid());
create policy "del own" on follows for delete to authenticated using(follower=auth.uid());
create policy "ins own" on reports for insert to authenticated with check(user_id=auth.uid());

create function handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
declare u text:=lower(coalesce(new.raw_user_meta_data->>'username','user'));
begin
 if u !~ '^[a-z0-9_]{3,20}$' or exists(select 1 from profiles where username=u) then u:='user_'||substr(replace(new.id::text,'-',''),1,8); end if;
 insert into profiles(id,username,name) values(new.id,u,left(coalesce(new.raw_user_meta_data->>'name',u),60));
 return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

insert into storage.buckets(id,name,public) values('avatars','avatars',true) on conflict do nothing;
create policy "avatar read" on storage.objects for select using(bucket_id='avatars');
create policy "avatar up" on storage.objects for insert to authenticated with check(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
