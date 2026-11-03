-- شغّل بعد الملفات السابقة: صور وملفات في الدردشة (مخزن خاص بحد 10MB)
alter table messages add column if not exists file_path text, add column if not exists file_name text check(length(file_name)<=100),
 add column if not exists file_type text, add column if not exists file_size int;
alter table messages alter column body drop not null;
alter table messages drop constraint if exists messages_body_check;
alter table messages add constraint msg_body_len check(length(body)<=2000), add constraint msg_has_content check(body is not null or file_path is not null),
 add constraint msg_file_in_conv check(file_path is null or file_path like conv_id::text||'/%');

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('chat','chat',false,10485760,
 array['image/jpeg','image/png','image/webp','application/pdf','text/plain','text/csv',
 'application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
 on conflict (id) do update set file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types, public=false;
create policy "chat read" on storage.objects for select to authenticated using(bucket_id='chat' and
 case when (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$' then is_member(((storage.foldername(name))[1])::uuid) else false end);
create policy "chat up" on storage.objects for insert to authenticated with check(bucket_id='chat' and
 case when (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$' then can_send(((storage.foldername(name))[1])::uuid) else false end);
