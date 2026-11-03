-- شغّل بعد الملفات السابقة: لوحة الإدارة وحذف الحساب
alter table profiles add column if not exists is_admin boolean not null default false;
alter table reports add column if not exists resolved boolean not null default false;

create function admin_reports() returns table(rid uuid, rcreated timestamptz, rreason text, reporter text, tuser uuid, tname text, pid uuid, ptitle text, mid uuid, mbody text)
language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from profiles where id=auth.uid() and is_admin) then raise exception 'admin only'; end if;
 return query select r.id,r.created_at,r.reason,pr.username,r.target_user,pt.username,r.post_id,p.title,r.message_id,m.body
  from reports r left join profiles pr on pr.id=r.user_id left join profiles pt on pt.id=r.target_user
  left join posts p on p.id=r.post_id left join messages m on m.id=r.message_id where not r.resolved order by r.created_at desc limit 100;
end $$;

create function admin_act(act text, tid uuid) returns void language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from profiles where id=auth.uid() and is_admin) then raise exception 'admin only'; end if;
 if act='delete_post' then delete from posts where id=tid;
 elsif act='delete_message' then delete from messages where id=tid;
 elsif act='verify' then update profiles set verified=true where id=tid;
 elsif act='unverify' then update profiles set verified=false where id=tid;
 elsif act='remove_user' then delete from auth.users where id=tid and id<>auth.uid();
 elsif act='resolve' then update reports set resolved=true where id=tid;
 else raise exception 'bad action'; end if;
end $$;

create function delete_my_account() returns void language plpgsql security definer set search_path=public as $$
begin if auth.uid() is null then raise exception 'not allowed'; end if; delete from auth.users where id=auth.uid(); end $$;

-- اجعل نفسك مشرفًا (غيّر اسم المستخدم ثم شغّل هذا السطر وحده):
-- update profiles set is_admin=true where username='7salah_bro';
