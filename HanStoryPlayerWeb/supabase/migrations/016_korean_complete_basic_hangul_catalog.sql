begin;

-- El Mundo 1 ahora conserva símbolos distintos aunque compartan el mismo
-- ejemplo hablado (por ejemplo ㅇ y ㅏ pueden usar 아). Sincroniza el catálogo
-- con los IDs de la unidad ampliada y desactiva la prueba sustituida.
update public.lesson_catalog
set active=false
where language_id='korean'
  and course_id='korean-from-zero'
  and lesson_id='korean-reading-test-07';

insert into public.lesson_catalog(
  language_id,course_id,lesson_id,lesson_type,xp_reward,active,metadata
)
values
  ('korean','korean-from-zero','korean-reading-01','normal',20,true,'{"source":"guided-course","unitId":"reading","level":"A0"}'::jsonb),
  ('korean','korean-from-zero','korean-reading-02','normal',20,true,'{"source":"guided-course","unitId":"reading","level":"A0"}'::jsonb),
  ('korean','korean-from-zero','korean-reading-03','normal',20,true,'{"source":"guided-course","unitId":"reading","level":"A0"}'::jsonb),
  ('korean','korean-from-zero','korean-reading-review-03','review',5,true,'{"source":"guided-course","unitId":"reading","level":"A0"}'::jsonb),
  ('korean','korean-from-zero','korean-reading-04','normal',20,true,'{"source":"guided-course","unitId":"reading","level":"A0"}'::jsonb),
  ('korean','korean-from-zero','korean-reading-05','normal',20,true,'{"source":"guided-course","unitId":"reading","level":"A0"}'::jsonb),
  ('korean','korean-from-zero','korean-reading-06','normal',20,true,'{"source":"guided-course","unitId":"reading","level":"A0"}'::jsonb),
  ('korean','korean-from-zero','korean-reading-review-06','review',5,true,'{"source":"guided-course","unitId":"reading","level":"A0"}'::jsonb),
  ('korean','korean-from-zero','korean-reading-07','normal',20,true,'{"source":"guided-course","unitId":"reading","level":"A0"}'::jsonb),
  ('korean','korean-from-zero','korean-reading-test-10','test',30,true,'{"source":"guided-course","unitId":"reading","level":"A0","requiresMastery":true}'::jsonb)
on conflict(language_id,course_id,lesson_id) do update
set lesson_type=excluded.lesson_type,
    xp_reward=excluded.xp_reward,
    active=true,
    metadata=excluded.metadata;

commit;
