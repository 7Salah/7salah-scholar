-- 7Salah Scholar v20 — التفاعل الأكاديمي المتكامل
--   1) الرد على رسالة محددة في المحادثات (اقتباس مثل WhatsApp)
--   2) إعادة النشر Repost  3) الاقتباس Quote Post  4) سلاسل المنشورات Threads  5) الردود المتفرعة Threaded Replies
--
-- شغّله مرة واحدة في Supabase → SQL Editor بعد v19o-deck-adds.sql (وبعد v19p-stories.sql إن استعملت القصص).
-- آمن لإعادة التشغيل (idempotent). إضافي فقط: لا DROP TABLE ولا DROP COLUMN ولا DELETE ولا UPDATE لبيانات موجودة.
-- كله داخل معاملة واحدة: إن فشل أي سطر يُلغى كل شيء ويبقى مشروعك كما كان.
-- قبل تشغيله يعمل التطبيق كما هو؛ الميزات الجديدة تُخفى تلقائيًا ويظهر تنبيه يطلب تشغيل هذا الملف.

begin;

-- ============ 0) فحص المتطلبات (رسالة واضحة بدل خطأ غامض) ============
do $$ begin
  if to_regclass('public.posts') is null or to_regclass('public.comments') is null or to_regclass('public.messages') is null
     or to_regclass('public.blocks') is null then
    raise exception 'شغّل schema.sql وchat.sql وmoderation.sql أولًا';
  end if;
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='posts' and column_name='topic') then
    raise exception 'شغّل v19m-topic.sql ثم v19n-decks.sql أولًا (ترتيب SETUP.md)';
  end if;
end $$;

-- دالة مساعدة: هل بين المستخدمين حظر في أي اتجاه؟ (تتجاوز RLS لأن blocks خاصة بصاحبها)
create or replace function public.x_blocked(a uuid, b uuid) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.blocks where (blocker=a and blocked=b) or (blocker=b and blocked=a)) $$;

-- ============ 1) الرد على رسالة (المحادثات الخاصة والمجموعات) ============
-- عمود عادي بلا مفتاح أجنبي عمدًا: لو حُذفت الرسالة الأصلية تبقى العلاقة محفوظة ويعرض التطبيق «رسالة محذوفة»
-- (مفتاح أجنبي ON DELETE SET NULL كان سيمحو العلاقة، وتحديث الأبناء في BEFORE DELETE يفشل عند حذف محادثة كاملة).
alter table public.messages add column if not exists reply_to uuid;
create index if not exists messages_reply_to_idx on public.messages(reply_to) where reply_to is not null;

create or replace function public.messages_reply_guard() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  if new.reply_to is not null then
    if new.reply_to = new.id or not exists(select 1 from public.messages m where m.id=new.reply_to and m.conv_id=new.conv_id) then
      raise exception 'reply target must be a message in the same conversation';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists messages_reply_guard on public.messages;
create trigger messages_reply_guard before insert on public.messages for each row execute function public.messages_reply_guard();

-- ============ 2) المنشورات: إعادة نشر / اقتباس / سلاسل ============
alter table public.posts
  add column if not exists repost_of   uuid references public.posts(id) on delete cascade,   -- حذف الأصل يحذف إعادات نشره
  add column if not exists quote_of    uuid references public.posts(id) on delete set null,  -- حذف الأصل يُبقي الاقتباس («المنشور الأصلي غير متاح»)
  add column if not exists repost_count int not null default 0,
  add column if not exists quote_count  int not null default 0,
  add column if not exists thread_root uuid references public.posts(id) on delete cascade,  -- = id الخاص بالمنشور في أول السلسلة
  add column if not exists thread_pos  int,                                                  -- يعيّنه الخادم (1 للأول)
  add column if not exists thread_len  int;                                                  -- عدد منشورات السلسلة (على الأول فقط)

alter table public.posts drop constraint if exists posts_kind_check;
alter table public.posts add constraint posts_kind_check check(kind in(
  'research','experience','video','lesson','attachment','board','map','post','question','deck','repost','quote'));

alter table public.posts drop constraint if exists posts_x_check;
alter table public.posts add constraint posts_x_check check(
  repost_count>=0 and quote_count>=0
  and ((kind='repost') = (repost_of is not null))
  and (quote_of is null or kind='quote')
  and (thread_root is null or (kind in('post','question') and thread_pos between 1 and 20)));

create unique index if not exists posts_one_repost_per_user on public.posts(user_id, repost_of) where repost_of is not null;
create index if not exists posts_repost_of_idx  on public.posts(repost_of) where repost_of is not null;
create index if not exists posts_quote_of_idx   on public.posts(quote_of, created_at desc) where quote_of is not null;
create unique index if not exists posts_thread_pos_idx on public.posts(thread_root, thread_pos) where thread_root is not null;

-- التحقق قبل الإدراج (security definer: يقرأ الأصل وجدول الحظر)
create or replace function public.posts_x_before() returns trigger
language plpgsql security definer set search_path=public as $$
declare o record;
begin
  if new.kind='repost' then
    select id,user_id,kind,title into o from public.posts where id=new.repost_of;
    if not found then raise exception 'original post not found'; end if;
    if o.kind='repost' then raise exception 'cannot repost a repost'; end if;
    if public.x_blocked(o.user_id,new.user_id) then raise exception 'blocked'; end if;
    -- إعادة النشر مرجع فقط: لا يحمل محتوى خاصًا به
    new.title:=left(coalesce(o.title,'repost'),150);
    new.body:=null; new.doi:=null; new.video_url:=null; new.topic:=null;
    new.file_path:=null; new.file_name:=null; new.file_type:=null; new.file_size:=null;
    new.place:=null; new.lat:=null; new.lng:=null; new.quote_of:=null; new.thread_root:=null; new.thread_pos:=null;
  elsif new.kind='quote' then
    if new.quote_of is null then raise exception 'quote needs an original post'; end if;
    if length(btrim(coalesce(new.body,'')))=0 then raise exception 'quote needs your own text'; end if;
    select id,user_id,kind into o from public.posts where id=new.quote_of;
    if not found then raise exception 'original post not found'; end if;
    if o.kind='repost' then raise exception 'quote the original post, not the repost'; end if;
    if public.x_blocked(o.user_id,new.user_id) then raise exception 'blocked'; end if;
    new.thread_root:=null; new.thread_pos:=null;
  else
    new.quote_of:=null;
  end if;

  if new.thread_root is not null then
    if new.thread_root = new.id then
      new.thread_pos:=1;
    else
      select id,user_id,thread_root into o from public.posts where id=new.thread_root;
      if not found or o.user_id<>new.user_id or o.thread_root is distinct from o.id then
        raise exception 'invalid thread: must continue your own thread';
      end if;
      perform pg_advisory_xact_lock(hashtextextended(new.thread_root::text,0));   -- يمنع تصادم الترتيب عند الإدراج المتزامن
      select coalesce(max(thread_pos),1)+1 into new.thread_pos from public.posts where thread_root=new.thread_root;
      if new.thread_pos>20 then raise exception 'thread is limited to 20 posts'; end if;
    end if;
  else
    new.thread_pos:=null;
  end if;
  new.repost_count:=0; new.quote_count:=0; new.thread_len:=null;   -- العدّادات لا يضبطها العميل أبدًا
  return new;
end $$;
drop trigger if exists posts_x_before on public.posts;
create trigger posts_x_before before insert on public.posts for each row execute function public.posts_x_before();

-- العدّادات تُحسب من الصفوف نفسها (لا زيادة عمياء): أي تكرار/حذف لا يفسدها
create or replace function public.posts_x_after() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  if tg_op='INSERT' then
    if new.kind='repost' then
      update public.posts set repost_count=(select count(*) from public.posts r where r.repost_of=new.repost_of) where id=new.repost_of;
    elsif new.kind='quote' and new.quote_of is not null then
      update public.posts set quote_count=(select count(*) from public.posts q where q.quote_of=new.quote_of) where id=new.quote_of;
    end if;
    if new.thread_root is not null then
      update public.posts set thread_len=(select count(*) from public.posts t where t.thread_root=new.thread_root) where id=new.thread_root;
    end if;
  else
    if old.kind='repost' and old.repost_of is not null then
      update public.posts set repost_count=(select count(*) from public.posts r where r.repost_of=old.repost_of) where id=old.repost_of;
    elsif old.kind='quote' and old.quote_of is not null then
      update public.posts set quote_count=(select count(*) from public.posts q where q.quote_of=old.quote_of) where id=old.quote_of;
    end if;
    if old.thread_root is not null and old.thread_root<>old.id then
      update public.posts set thread_len=(select count(*) from public.posts t where t.thread_root=old.thread_root) where id=old.thread_root;
    end if;
  end if;
  return null;
end $$;
drop trigger if exists posts_x_after_ins on public.posts;
create trigger posts_x_after_ins after insert on public.posts for each row execute function public.posts_x_after();
drop trigger if exists posts_x_after_del on public.posts;
create trigger posts_x_after_del after delete on public.posts for each row execute function public.posts_x_after();

-- حدّ النشر اليومي: 20 منشورًا (يشمل الاقتباسات ومنشورات السلاسل) و60 إعادة نشر، كلٌّ على حدة
create or replace function public.posts_rate() returns trigger language plpgsql as $$
begin
  if new.kind='repost' then
    if (select count(*) from public.posts where user_id=new.user_id and kind='repost' and created_at>now()-interval '1 day')>=60 then
      raise exception 'تجاوزت الحد اليومي لإعادة النشر (60)';
    end if;
  elsif (select count(*) from public.posts where user_id=new.user_id and kind<>'repost' and created_at>now()-interval '1 day')>=20 then
    raise exception 'تجاوزت الحد اليومي للنشر (20 منشورًا)';
  end if;
  return new;
end $$;
drop trigger if exists posts_rate on public.posts;
create trigger posts_rate before insert on public.posts for each row execute function public.posts_rate();

-- إنشاء سلسلة كاملة بعملية واحدة (إما تُنشر كلها أو لا شيء). security invoker: تسري RLS وحدود النشر.
create or replace function public.create_thread(items text[], tpc text default null) returns uuid
language plpgsql set search_path=public as $$
declare rid uuid:=gen_random_uuid(); i int; b text; tp text:=nullif(btrim(coalesce(tpc,'')),'');
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  if items is null or coalesce(array_length(items,1),0) not between 2 and 20 then raise exception 'a thread needs 2 to 20 posts'; end if;
  if tp is not null and length(tp) not between 2 and 60 then tp:=null; end if;
  for i in 1..array_length(items,1) loop
    b:=btrim(coalesce(items[i],''));
    if length(b)=0 or length(b)>1500 then raise exception 'thread post % must be 1-1500 characters', i; end if;
    insert into public.posts(id,user_id,kind,title,body,topic,thread_root)
      values(case when i=1 then rid else gen_random_uuid() end, auth.uid(),'post',
             left(regexp_replace(b,'\s+',' ','g'),80), b, tp, rid);
  end loop;
  return rid;
end $$;
revoke all on function public.create_thread(text[],text) from public;
grant execute on function public.create_thread(text[],text) to authenticated;

-- ============ 3) الردود المتفرعة على التعليقات ============
-- حذف تعليق يحذف الردود عليه (لا تبقى ردود يتيمة بلا سياق).
alter table public.comments add column if not exists parent_id uuid references public.comments(id) on delete cascade;
create index if not exists comments_parent_idx on public.comments(parent_id) where parent_id is not null;
create index if not exists comments_post_idx   on public.comments(post_id, created_at);

create or replace function public.comments_parent_guard() returns trigger
language plpgsql security definer set search_path=public as $$
declare p record; dep int;
begin
  if new.parent_id is not null then
    select id,post_id,user_id into p from public.comments where id=new.parent_id;
    if not found or p.post_id<>new.post_id then raise exception 'reply must target a comment on the same post'; end if;
    if public.x_blocked(p.user_id,new.user_id) then raise exception 'blocked'; end if;
    with recursive up as (select id,parent_id,1 as d from public.comments where id=new.parent_id
                          union all select c.id,c.parent_id,up.d+1 from public.comments c join up on c.id=up.parent_id where up.d<12)
    select max(up.d) into dep from up;
    if dep>=10 then raise exception 'reply nesting is limited to 10 levels'; end if;
  end if;
  return new;
end $$;
drop trigger if exists comments_parent_guard on public.comments;
create trigger comments_parent_guard before insert on public.comments for each row execute function public.comments_parent_guard();

-- ============ 4) إصلاح العدّادات (للمشرف فقط) ============
create or replace function public.admin_recount_counters() returns int
language plpgsql security definer set search_path=public as $$
declare n int:=0; k int;
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and is_admin) then raise exception 'admin only'; end if;
  update public.posts p set repost_count=x.c from (select p2.id, (select count(*) from public.posts r where r.repost_of=p2.id)::int c from public.posts p2) x
    where x.id=p.id and p.repost_count<>x.c;  get diagnostics k=row_count; n:=n+k;
  update public.posts p set quote_count=x.c from (select p2.id, (select count(*) from public.posts q where q.quote_of=p2.id)::int c from public.posts p2) x
    where x.id=p.id and p.quote_count<>x.c;   get diagnostics k=row_count; n:=n+k;
  update public.posts p set thread_len=x.c from (select p2.id, (select count(*) from public.posts t where t.thread_root=p2.id)::int c from public.posts p2 where p2.thread_root=p2.id) x
    where x.id=p.id and p.thread_len is distinct from x.c; get diagnostics k=row_count; n:=n+k;
  return n;
end $$;
revoke all on function public.admin_recount_counters() from public;
grant execute on function public.admin_recount_counters() to authenticated;

commit;

-- ============ فحوص بعد التشغيل (اختيارية؛ شغّلها وحدها) ============
-- 1) يجب ألا تُرجع أي صف (عدّاد غير مطابق):
--    select id from public.posts p where repost_count <> (select count(*) from public.posts r where r.repost_of=p.id)
--                                      or quote_count  <> (select count(*) from public.posts q where q.quote_of=p.id);
-- 2) إصلاح تلقائي من حساب المشرف إن ظهرت فروقات:  select public.admin_recount_counters();
-- 3) أمان: المستخدم لا يعدّل عدّاداتك ولا منشوراتك (لا توجد سياسة UPDATE على posts/comments/messages).
