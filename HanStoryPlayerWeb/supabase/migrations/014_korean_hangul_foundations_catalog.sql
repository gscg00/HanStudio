begin;

-- Mundo 0 de lectura de hangeul. La recompensa solo se concede a IDs publicados.
insert into public.lesson_catalog(
  language_id,course_id,lesson_id,lesson_type,xp_reward,active,metadata
)
values
  ('korean','korean-from-zero','korean-hangul-00-system','normal',20,true,'{"source":"guided-course","unitId":"hangul-foundations","level":"A0"}'::jsonb),
  ('korean','korean-from-zero','korean-hangul-00-vowels-vertical','normal',20,true,'{"source":"guided-course","unitId":"hangul-foundations","level":"A0"}'::jsonb),
  ('korean','korean-from-zero','korean-hangul-00-vowels-horizontal','normal',20,true,'{"source":"guided-course","unitId":"hangul-foundations","level":"A0"}'::jsonb),
  ('korean','korean-from-zero','korean-hangul-00-consonants-1','normal',20,true,'{"source":"guided-course","unitId":"hangul-foundations","level":"A0"}'::jsonb),
  ('korean','korean-from-zero','korean-hangul-00-consonants-2','normal',20,true,'{"source":"guided-course","unitId":"hangul-foundations","level":"A0"}'::jsonb),
  ('korean','korean-from-zero','korean-hangul-00-blocks','normal',20,true,'{"source":"guided-course","unitId":"hangul-foundations","level":"A0"}'::jsonb),
  ('korean','korean-from-zero','korean-hangul-00-review-01','review',5,true,'{"source":"guided-course","unitId":"hangul-foundations","level":"A0"}'::jsonb),
  ('korean','korean-from-zero','korean-hangul-00-batchim','normal',20,true,'{"source":"guided-course","unitId":"hangul-foundations","level":"A0"}'::jsonb),
  ('korean','korean-from-zero','korean-hangul-00-words','normal',20,true,'{"source":"guided-course","unitId":"hangul-foundations","level":"A0"}'::jsonb),
  ('korean','korean-from-zero','korean-hangul-00-test','test',30,true,'{"source":"guided-course","unitId":"hangul-foundations","level":"A0"}'::jsonb)
on conflict(language_id,course_id,lesson_id) do update
set lesson_type=excluded.lesson_type,
    xp_reward=excluded.xp_reward,
    active=true,
    metadata=excluded.metadata;

commit;
