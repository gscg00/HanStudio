begin;

-- HS-AC01 está disponible para la cuenta administradora mientras se revisa.
-- Sus lecciones también necesitan existir en el catálogo privado de XP.
with published_book(language_id,book_code,first_lesson,last_lesson) as (values
  ('korean','HS-AC01',1,20)
), catalog as (
  select language_id,book_code,lesson_number
  from published_book
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
