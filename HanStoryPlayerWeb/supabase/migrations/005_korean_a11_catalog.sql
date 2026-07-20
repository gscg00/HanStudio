begin;

insert into public.lesson_catalog(
  language_id,course_id,lesson_id,lesson_type,xp_reward,active,metadata
)
values
  ('korean','korean-from-zero','korean-a11-introductions-01','normal',20,true,'{"source":"guided-course","unitId":"a1-1-introductions","level":"A1.1"}'::jsonb),
  ('korean','korean-from-zero','korean-a11-introductions-02','normal',20,true,'{"source":"guided-course","unitId":"a1-1-introductions","level":"A1.1"}'::jsonb),
  ('korean','korean-from-zero','korean-a11-introductions-review-01','review',5,true,'{"source":"guided-course","unitId":"a1-1-introductions","level":"A1.1"}'::jsonb),
  ('korean','korean-from-zero','korean-a11-introductions-03','normal',20,true,'{"source":"guided-course","unitId":"a1-1-introductions","level":"A1.1"}'::jsonb),
  ('korean','korean-from-zero','korean-a11-introductions-04','normal',20,true,'{"source":"guided-course","unitId":"a1-1-introductions","level":"A1.1"}'::jsonb),
  ('korean','korean-from-zero','korean-a11-introductions-review-02','review',5,true,'{"source":"guided-course","unitId":"a1-1-introductions","level":"A1.1"}'::jsonb),
  ('korean','korean-from-zero','korean-a11-introductions-test','test',30,true,'{"source":"guided-course","unitId":"a1-1-introductions","level":"A1.1"}'::jsonb)
on conflict(language_id,course_id,lesson_id) do update
set lesson_type=excluded.lesson_type,
    xp_reward=excluded.xp_reward,
    active=true,
    metadata=excluded.metadata;

alter table public.lesson_catalog enable row level security;
revoke all on public.lesson_catalog from anon,authenticated;

commit;
