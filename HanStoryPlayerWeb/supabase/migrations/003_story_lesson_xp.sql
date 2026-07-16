begin;

-- Lecciones publicadas de Historias. La recompensa es fija y la decide el servidor.
-- Los códigos y rangos provienen de library/library.json y sus manifests publicados.
with published_books(language_id,book_code,first_lesson,last_lesson) as (values
  ('english','HE-B1',1,50),
  ('english','HE-B2',1,50),
  ('english','HE-Bridge',1,44),
  ('french','HF-A1',1,24),
  ('french','HF-A2',1,24),
  ('german','HG-A1',1,24),
  ('japanese','JP_01',1,14),
  ('korean','L01',1,14),
  ('korean','HS-B02',15,28),
  ('korean','HS-B03',29,42),
  ('korean','HS-B04',43,56),
  ('korean','HS-VARIETY-S01E01',1,10)
), catalog as (
  select language_id,book_code,lesson_number
  from published_books
  cross join lateral generate_series(first_lesson,last_lesson) lesson_number
)
insert into public.lesson_catalog(language_id,course_id,lesson_id,lesson_type,xp_reward,active,metadata)
select language_id,'story:'||book_code,'lesson:'||lesson_number::text,'normal',20,true,
       jsonb_build_object('source','published-story','bookCode',book_code,'lesson',lesson_number)
from catalog
on conflict(language_id,course_id,lesson_id) do update
set lesson_type=excluded.lesson_type,
    xp_reward=excluded.xp_reward,
    active=true,
    metadata=excluded.metadata;

commit;
