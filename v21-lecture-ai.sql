-- 7Salah Lecture AI (v21) — شغّله مرة واحدة بعد v20-interactive.sql. إضافي بالكامل ولا يمسّ الجداول القائمة.
-- الكتابة على النصوص والمخرجات تتم من الدالة الخلفية lecture-ai فقط (service role)؛ العميل يقرأ ويعدّل نصوصه فقط.
begin;

create table if not exists public.lectures(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 title text not null check(length(title) between 1 and 160),
 subject text check(length(subject)<=80),
 course text check(length(course)<=80),
 lecture_lang text not null default 'ar' check(lecture_lang in('ar','en','fr')),
 output_lang text not null default 'ar' check(output_lang in('ar','en','fr')),
 status text not null default 'new' check(status in('new','uploading','transcribing','ready','failed')),
 error text,
 duration_sec int not null default 0 check(duration_sec>=0),
 chunks jsonb not null default '[]'::jsonb,   -- [{path, offset, dur, done}]
 consent boolean not null check(consent),     -- إقرار المستخدم بأخذ الموافقات اللازمة قبل التسجيل
 lecture_date date not null default current_date,
 created_at timestamptz not null default now()
);
create index if not exists lectures_user_idx on public.lectures(user_id, created_at desc);

create table if not exists public.lecture_segments(
 id bigint generated always as identity primary key,
 lecture_id uuid not null references public.lectures(id) on delete cascade,
 chunk smallint not null default 0,
 idx int not null,
 start_sec numeric not null,
 end_sec numeric not null,
 text text not null,
 unclear boolean not null default false,
 edited boolean not null default false,
 unique(lecture_id, chunk, idx)
);
create index if not exists lecture_segments_idx on public.lecture_segments(lecture_id, start_sec);

create table if not exists public.lecture_outputs(
 lecture_id uuid not null references public.lectures(id) on delete cascade,
 kind text not null check(kind in('outline','summary1','summary2','summary3','terms','flashcards','quiz','mindmap')),
 lang text not null check(lang in('ar','en','fr')),
 content jsonb not null,
 edited boolean not null default false,
 created_at timestamptz not null default now(),
 primary key(lecture_id, kind)
);

-- يعلّم المخرج/المقطع بأنه معدَّل يدويًا، ويزيل وسم «غير واضح» بعد تصحيح الطالب
create or replace function public.lec_mark_edited() returns trigger language plpgsql as $$
begin
 if coalesce(auth.role(),'')='service_role' then return new; end if; -- كتابة الدالة الخلفية ليست تعديلًا يدويًا
 if tg_table_name='lecture_segments' then
  if new.text is distinct from old.text then new.edited:=true; new.unclear:=false; end if;
 else
  if new.content is distinct from old.content then new.edited:=true; end if;
 end if;
 return new;
end $$;
drop trigger if exists lec_seg_edit on public.lecture_segments;
create trigger lec_seg_edit before update on public.lecture_segments for each row execute function public.lec_mark_edited();
drop trigger if exists lec_out_edit on public.lecture_outputs;
create trigger lec_out_edit before update on public.lecture_outputs for each row execute function public.lec_mark_edited();

-- الأمان: RLS مفعّل، وصلاحيات الأعمدة تمنع العميل من تزوير الحالة أو النتائج
alter table public.lectures enable row level security;
alter table public.lecture_segments enable row level security;
alter table public.lecture_outputs enable row level security;
revoke all on public.lectures, public.lecture_segments, public.lecture_outputs from anon, authenticated;
grant select on public.lectures, public.lecture_segments, public.lecture_outputs to authenticated;
grant insert(user_id,title,subject,course,lecture_lang,output_lang,consent,lecture_date,status) on public.lectures to authenticated;
grant update(title,subject,course,lecture_lang,output_lang,lecture_date,chunks) on public.lectures to authenticated;
grant delete on public.lectures to authenticated;
grant update(text) on public.lecture_segments to authenticated;
grant update(content) on public.lecture_outputs to authenticated;

drop policy if exists lec_sel on public.lectures; drop policy if exists lec_ins on public.lectures;
drop policy if exists lec_upd on public.lectures; drop policy if exists lec_del on public.lectures;
create policy lec_sel on public.lectures for select to authenticated using(user_id=auth.uid());
create policy lec_ins on public.lectures for insert to authenticated with check(user_id=auth.uid() and consent and status in('new','uploading'));
create policy lec_upd on public.lectures for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy lec_del on public.lectures for delete to authenticated using(user_id=auth.uid());

drop policy if exists lseg_sel on public.lecture_segments; drop policy if exists lseg_upd on public.lecture_segments;
create policy lseg_sel on public.lecture_segments for select to authenticated using(exists(select 1 from public.lectures l where l.id=lecture_id and l.user_id=auth.uid()));
create policy lseg_upd on public.lecture_segments for update to authenticated using(exists(select 1 from public.lectures l where l.id=lecture_id and l.user_id=auth.uid()))
 with check(exists(select 1 from public.lectures l where l.id=lecture_id and l.user_id=auth.uid()) and length(text) between 1 and 4000);

drop policy if exists lout_sel on public.lecture_outputs; drop policy if exists lout_upd on public.lecture_outputs;
create policy lout_sel on public.lecture_outputs for select to authenticated using(exists(select 1 from public.lectures l where l.id=lecture_id and l.user_id=auth.uid()));
create policy lout_upd on public.lecture_outputs for update to authenticated using(exists(select 1 from public.lectures l where l.id=lecture_id and l.user_id=auth.uid()))
 with check(exists(select 1 from public.lectures l where l.id=lecture_id and l.user_id=auth.uid()));

-- مخزن الصوت الخاص: مجلد لكل مستخدم (uid/lectureId/ملف). 25MB هو حد خدمة التفريغ لكل ملف.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('lectures','lectures',false,26214400,
 array['audio/webm','audio/mp4','audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/wave','audio/ogg','audio/x-m4a','audio/m4a','audio/aac','audio/flac','audio/x-flac','video/webm','video/mp4'])
 on conflict(id) do update set file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types, public=false;
drop policy if exists "lectures read" on storage.objects; drop policy if exists "lectures up" on storage.objects; drop policy if exists "lectures del" on storage.objects;
create policy "lectures read" on storage.objects for select to authenticated using(bucket_id='lectures' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "lectures up" on storage.objects for insert to authenticated with check(bucket_id='lectures' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "lectures del" on storage.objects for delete to authenticated using(bucket_id='lectures' and (storage.foldername(name))[1]=auth.uid()::text);

commit;
