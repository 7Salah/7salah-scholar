-- شغّل بعد schema.sql وchat.sql: الحظر والإبلاغ
create table blocks(blocker uuid default auth.uid() references profiles on delete cascade, blocked uuid references profiles on delete cascade,
 primary key(blocker,blocked), check(blocker<>blocked));
alter table blocks enable row level security;
create policy "mine" on blocks for select to authenticated using(blocker=auth.uid());
create policy "ins" on blocks for insert to authenticated with check(blocker=auth.uid());
create policy "del" on blocks for delete to authenticated using(blocker=auth.uid());

alter table reports add column if not exists target_user uuid, add column if not exists message_id uuid, add column if not exists reason text check(length(reason)<=200);

-- لا إرسال في محادثة مباشرة بين طرفين بينهما حظر (في أي اتجاه)
create function can_send(cid uuid) returns boolean language sql security definer stable set search_path=public as $$
 select is_member(cid) and not exists(select 1 from conversations c join members m on m.conv_id=c.id
  join blocks b on (b.blocker=m.user_id and b.blocked=auth.uid()) or (b.blocker=auth.uid() and b.blocked=m.user_id)
  where c.id=cid and c.kind='dm' and m.user_id<>auth.uid()) $$;
drop policy "msg send" on messages;
create policy "msg send" on messages for insert to authenticated with check(user_id=auth.uid() and can_send(conv_id));

create or replace function start_dm(other uuid) returns uuid language plpgsql security definer set search_path=public as $$
declare c uuid; begin
 if auth.uid() is null or other=auth.uid() then raise exception 'not allowed'; end if;
 if exists(select 1 from blocks where (blocker=auth.uid() and blocked=other) or (blocker=other and blocked=auth.uid())) then raise exception 'blocked'; end if;
 select m1.conv_id into c from members m1 join members m2 on m1.conv_id=m2.conv_id join conversations v on v.id=m1.conv_id
  where v.kind='dm' and m1.user_id=auth.uid() and m2.user_id=other limit 1;
 if c is null then insert into conversations(kind) values('dm') returning id into c;
  insert into members(conv_id,user_id) values(c,auth.uid()),(c,other); end if; return c; end $$;
-- لمراجعة البلاغات: Table Editor ← reports
