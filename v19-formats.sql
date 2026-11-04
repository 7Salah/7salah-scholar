-- 7Salah Scholar v19 — صيغ منشورات جديدة: مرفق 📎 / لوحة 🖼 / خريطة 🗺
-- شغّله مرة واحدة في Supabase → SQL Editor بعد الملفات السابقة.
alter table public.posts
  add column if not exists file_path text,
  add column if not exists file_name text,
  add column if not exists file_type text,
  add column if not exists file_size int,
  add column if not exists place text,
  add column if not exists lat double precision,
  add column if not exists lng double precision;

alter table public.posts drop constraint if exists posts_kind_check;
alter table public.posts add constraint posts_kind_check check(kind in('research','experience','video','lesson','attachment','board','map'));
alter table public.posts drop constraint if exists posts_fmt_check;
alter table public.posts add constraint posts_fmt_check check(
  length(coalesce(file_name,''))<=100 and length(coalesce(place,''))<=120
  and (lat is null or lat between -90 and 90) and (lng is null or lng between -180 and 180)
  and (kind not in('attachment','board') or file_path is not null)
  and (kind<>'map' or (lat is not null and lng is not null))
  and (file_path is null or file_path like user_id::text||'/%'));

-- مخزن عام للقراءة (المنشورات علنية)، الرفع فقط داخل مجلد المستخدم نفسه، حد 10MB
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('posts','posts',true,10485760,
 array['image/jpeg','image/png','image/webp','application/pdf','text/plain','text/csv',
 'application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
 on conflict (id) do update set file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types, public=true;
drop policy if exists "posts up" on storage.objects;
create policy "posts up" on storage.objects for insert to authenticated with check(bucket_id='posts' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "posts del" on storage.objects;
create policy "posts del" on storage.objects for delete to authenticated using(bucket_id='posts' and (storage.foldername(name))[1]=auth.uid()::text);
