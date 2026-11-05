-- 7Salah Scholar v19m — التخصص حر الاختيار + منشور عام 💬 + سؤال ❓
-- شغّله مرة واحدة في Supabase → SQL Editor (بعد v19c). آمن لإعادة التشغيل.
-- التخصص نص حر (2–60 حرفًا) تقترح الواجهة عليه قائمة لكنها لا تفرضها.
alter table public.posts add column if not exists topic text;
alter table public.posts drop constraint if exists posts_topic_check;
alter table public.posts add constraint posts_topic_check check(topic is null or length(topic) between 2 and 60);
create index if not exists posts_topic_idx on public.posts(lower(topic));

-- أنواع المنشور: أضفنا «post» (منشور عام بلا DOI ولا عنوان إجباري) و«question» (سؤال).
alter table public.posts drop constraint if exists posts_kind_check;
alter table public.posts add constraint posts_kind_check
  check(kind in('research','experience','video','lesson','attachment','board','map','post','question'));
