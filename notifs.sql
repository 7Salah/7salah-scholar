-- شغّل بعد الملفات السابقة: عدّاد الرسائل غير المقروءة
alter table members add column if not exists last_read timestamptz not null default now();
create function mark_read(cid uuid) returns void language sql security definer set search_path=public as
$$ update members set last_read=now() where conv_id=cid and user_id=auth.uid() $$;
create function unread_counts() returns table(conv_id uuid, n bigint) language sql stable security definer set search_path=public as
$$ select m.conv_id, count(g.id) from members m join messages g on g.conv_id=m.conv_id and g.created_at>m.last_read and g.user_id<>m.user_id
   where m.user_id=auth.uid() group by m.conv_id $$;
