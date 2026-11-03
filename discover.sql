-- شغّل بعد الملفات السابقة: اقتراح باحثين
create function suggested_users() returns setof profiles language sql stable security definer set search_path=public as $$
 select p.* from profiles p where auth.uid() is not null and p.id<>auth.uid()
  and not exists(select 1 from follows f where f.follower=auth.uid() and f.followee=p.id)
  and not exists(select 1 from blocks b where (b.blocker=auth.uid() and b.blocked=p.id) or (b.blocker=p.id and b.blocked=auth.uid()))
 order by (p.field is not null and p.field=(select field from profiles where id=auth.uid())) desc,
  (select count(*) from follows f2 where f2.followee=p.id) desc, p.created_at desc limit 6 $$;
