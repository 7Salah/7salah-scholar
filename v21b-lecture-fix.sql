-- إصلاح v21b: شغّله مرة واحدة في SQL Editor (آمن لإعادة التشغيل).
-- 1) سياسة UPDATE على مخزن المحاضرات (مطلوبة لـ upsert عند إعادة رفع القطعة نفسها)
-- 2) توسيع أنواع MIME المسموحة لأنواع تُرسلها هواتف أندرويد
begin;
drop policy if exists "lectures upd" on storage.objects;
create policy "lectures upd" on storage.objects for update to authenticated
 using(bucket_id='lectures' and (storage.foldername(name))[1]=auth.uid()::text)
 with check(bucket_id='lectures' and (storage.foldername(name))[1]=auth.uid()::text);
update storage.buckets set allowed_mime_types=array['audio/webm','audio/mp4','audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/wave','audio/vnd.wave','audio/ogg','audio/x-m4a','audio/m4a','audio/mp4a-latm','audio/aac','audio/x-aac','audio/flac','audio/x-flac','video/webm','video/mp4'] where id='lectures';
commit;
