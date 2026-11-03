-- شغّل بعد schema.sql: الدردشة المباشرة والمجموعات البحثية
create table conversations(id uuid primary key default gen_random_uuid(), kind text not null check(kind in('dm','group')),
 title text check(length(title)<=80), is_public boolean not null default false, created_by uuid default auth.uid(), created_at timestamptz default now(), last_at timestamptz default now());
create table members(conv_id uuid references conversations on delete cascade, user_id uuid references profiles on delete cascade,
 role text not null default 'member', primary key(conv_id,user_id));
create table messages(id uuid primary key default gen_random_uuid(), conv_id uuid not null references conversations on delete cascade,
 user_id uuid not null default auth.uid() references profiles on delete cascade, body text not null check(length(body) between 1 and 2000), created_at timestamptz default now());
create index on messages(conv_id,created_at);

create function is_member(cid uuid) returns boolean language sql security definer stable set search_path=public as
$$ select exists(select 1 from members where conv_id=cid and user_id=auth.uid()) $$;

alter table conversations enable row level security; alter table members enable row level security; alter table messages enable row level security;
create policy "conv read" on conversations for select using(is_member(id) or (kind='group' and is_public));
create policy "mem read" on members for select using(is_member(conv_id));
create policy "mem leave" on members for delete to authenticated using(user_id=auth.uid());
create policy "msg read" on messages for select using(is_member(conv_id));
create policy "msg send" on messages for insert to authenticated with check(user_id=auth.uid() and is_member(conv_id));
create policy "msg del" on messages for delete to authenticated using(user_id=auth.uid());

create function start_dm(other uuid) returns uuid language plpgsql security definer set search_path=public as $$
declare c uuid; begin
 if auth.uid() is null or other=auth.uid() then raise exception 'not allowed'; end if;
 select m1.conv_id into c from members m1 join members m2 on m1.conv_id=m2.conv_id join conversations v on v.id=m1.conv_id
  where v.kind='dm' and m1.user_id=auth.uid() and m2.user_id=other limit 1;
 if c is null then insert into conversations(kind) values('dm') returning id into c;
  insert into members(conv_id,user_id) values(c,auth.uid()),(c,other); end if; return c; end $$;
create function create_group(ttl text, pub boolean) returns uuid language plpgsql security definer set search_path=public as $$
declare c uuid; begin
 if auth.uid() is null or length(trim(coalesce(ttl,'')))=0 then raise exception 'not allowed'; end if;
 insert into conversations(kind,title,is_public) values('group',left(trim(ttl),80),pub) returning id into c;
 insert into members(conv_id,user_id,role) values(c,auth.uid(),'admin'); return c; end $$;
create function join_group(cid uuid) returns void language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null or not exists(select 1 from conversations where id=cid and kind='group' and is_public) then raise exception 'not allowed'; end if;
 insert into members(conv_id,user_id) values(cid,auth.uid()) on conflict do nothing; end $$;
create function add_member(cid uuid, uname text) returns void language plpgsql security definer set search_path=public as $$
declare u uuid; begin
 if not exists(select 1 from members where conv_id=cid and user_id=auth.uid() and role='admin') then raise exception 'admin only'; end if;
 select id into u from profiles where username=lower(trim(uname)); if u is null then raise exception 'user not found'; end if;
 insert into members(conv_id,user_id) values(cid,u) on conflict do nothing; end $$;
create function touch_conv() returns trigger language plpgsql security definer set search_path=public as $$
begin update conversations set last_at=now() where id=new.conv_id; return new; end $$;
create trigger msg_touch after insert on messages for each row execute function touch_conv();

alter publication supabase_realtime add table messages;
