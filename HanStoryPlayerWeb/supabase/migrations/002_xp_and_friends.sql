begin;

create extension if not exists pgcrypto;
alter table public.profiles add column if not exists friend_code text;

-- Registro permanente: incluso si se elimina una cuenta, su código no vuelve a usarse.
create table if not exists public.friend_code_registry (
  code text primary key check (code ~ '^HS-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$'),
  reserved_at timestamptz not null default now()
);
alter table public.friend_code_registry enable row level security;
revoke all on public.friend_code_registry from anon,authenticated;
insert into public.friend_code_registry(code)
select friend_code from public.profiles where friend_code is not null
on conflict(code) do nothing;

-- Códigos de amigo generados por PostgreSQL, no por el navegador.
create or replace function public.generate_friend_code()
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  candidate text;
  bytes bytea;
  i integer;
  reserved integer;
begin
  loop
    bytes := uuid_send(gen_random_uuid());
    candidate := 'HS-';
    for i in 0..5 loop
      candidate := candidate || substr(alphabet, (get_byte(bytes, i) % length(alphabet)) + 1, 1);
    end loop;
    perform pg_advisory_xact_lock(hashtextextended(candidate, 0));
    insert into public.friend_code_registry(code) values(candidate) on conflict(code) do nothing;
    get diagnostics reserved = row_count;
    exit when reserved=1;
  end loop;
  return candidate;
end;
$$;

drop trigger if exists profiles_protect_friend_code on public.profiles;
update public.profiles set friend_code = public.generate_friend_code() where friend_code is null;
alter table public.profiles alter column friend_code set default public.generate_friend_code();
alter table public.profiles alter column friend_code set not null;
create unique index if not exists profiles_friend_code_uidx on public.profiles(friend_code);
alter table public.profiles drop constraint if exists profiles_friend_code_format;
alter table public.profiles add constraint profiles_friend_code_format check (friend_code ~ '^HS-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$');

create or replace function public.protect_friend_code()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.friend_code is distinct from new.friend_code then
    raise exception 'El código de amigo es inmutable';
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_protect_friend_code on public.profiles;
create trigger profiles_protect_friend_code before update of friend_code on public.profiles
for each row execute function public.protect_friend_code();

-- Catálogo confiable: el cliente nunca decide cuánto XP concede una lección.
create table if not exists public.lesson_catalog (
  language_id text not null,
  course_id text not null,
  lesson_id text not null,
  lesson_type text not null check (lesson_type in ('normal','short','test','unitFinal','review')),
  xp_reward integer not null check (xp_reward between 0 and 100),
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  primary key (language_id, course_id, lesson_id)
);

create table if not exists public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_key text not null check (length(event_key) between 1 and 240),
  event_type text not null check (event_type in ('lesson_completed','migration')),
  language_id text not null,
  course_id text,
  lesson_id text,
  xp integer not null check (xp >= 0 and xp <= 1000000),
  metadata jsonb not null default '{}'::jsonb,
  earned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(user_id,event_key)
);
create index if not exists xp_events_user_idx on public.xp_events(user_id);
create index if not exists xp_events_user_language_idx on public.xp_events(user_id,language_id);
create index if not exists xp_events_earned_idx on public.xp_events(user_id,earned_at desc);

-- Cursos de entrada actuales. Si se añade una lección, se agrega al catálogo en una migración posterior.
with languages(language_id) as (values ('english'),('korean'),('french'),('german'),('italian'),('russian'),('chinese'),('portuguese'),('arabic')),
stages(lesson_id,lesson_type,xp_reward) as (values
 ('sounds','normal',20),('combinations','normal',20),('dangerous','normal',20),('words','normal',20),
 ('survival','normal',20),('structure','normal',20),('repeat','short',10),('communication','normal',20),('quiz','test',30))
insert into public.lesson_catalog(language_id,course_id,lesson_id,lesson_type,xp_reward)
select language_id,'zero-'||language_id,lesson_id,lesson_type,xp_reward from languages cross join stages
on conflict(language_id,course_id,lesson_id) do update set lesson_type=excluded.lesson_type,xp_reward=excluded.xp_reward,active=true;

insert into public.lesson_catalog(language_id,course_id,lesson_id,lesson_type,xp_reward)
select 'japanese','japanese-from-zero',lesson_id,'normal',20 from unnest(array[
 'jp-hira-01-family-1','jp-hira-02-family-2','jp-hira-03-family-3','jp-hira-04-family-4','jp-hira-05-family-5','jp-hira-06-family-6','jp-hira-07-family-7','jp-hira-08-family-8','jp-hira-09-family-9','jp-hira-10-family-10','jp-hira-11-family-11','jp-hira-12-family-12','jp-hira-13-family-13','jp-hira-14-family-14','jp-kata-01-family-1','jp-kata-02-family-2','jp-kata-03-family-3','jp-kata-04-family-4','jp-kata-05-family-5','jp-kata-06-family-6','jp-kata-07-family-7','jp-kata-08-family-8','jp-kata-09-family-9','jp-kata-10-family-10','jp-kata-11-family-11','jp-kata-12-family-12','jp-kata-13-family-13','jp-rhythm-mora','jp-rhythm-long','jp-rhythm-small-tsu','jp-rhythm-n','jp-rhythm-particles','jp-book1-words-01','jp-book1-words-02','jp-book1-words-03','jp-book1-words-04','jp-book1-words-05','jp-book1-words-06','jp-book1-words-07','jp-book1-words-08','jp-book1-words-09','jp-book1-words-10','jp-book1-sentence-01','jp-book1-sentence-02','jp-book1-sentence-03','jp-book1-sentence-04','jp-book1-sentence-05','jp-book1-sentence-06','jp-book1-sentence-07','jp-book1-sentence-08','jp-book1-sentence-09','jp-book1-sentence-10','jp-book1-sentence-11','jp-book1-verbs-01','jp-book1-verbs-02','jp-book1-verbs-03','jp-book1-verbs-04','jp-book1-verb-form-01','jp-book1-verb-form-02','jp-book1-verb-form-03','jp-book1-verb-form-04','jp-book1-verb-form-05','jp-book1-verb-form-06','jp-book1-verb-form-07','jp-book1-verb-form-08','jp-book1-adj-01','jp-book1-adj-02','jp-book1-adj-pattern-01','jp-book1-adj-pattern-02','jp-book1-adj-pattern-03','jp-book1-adj-pattern-04','jp-book1-functional-01','jp-book1-functional-02','jp-book1-functional-03','jp-book1-functional-04','jp-book1-functional-05','jp-book1-functional-06','jp-book1-functional-07','jp-book1-kanji-01','jp-book1-kanji-02','jp-book1-kanji-03','jp-book1-kanji-04','jp-book1-kanji-05','jp-book1-kanji-06','jp-book1-kanji-07','jp-book1-kanji-08','jp-book1-kanji-09','jp-book1-bridge-01','jp-book1-bridge-02','jp-book1-bridge-03','jp-book1-bridge-04','jp-book1-bridge-05','jp-book1-bridge-06'
]::text[]) lesson_id
on conflict(language_id,course_id,lesson_id) do update set lesson_type=excluded.lesson_type,xp_reward=excluded.xp_reward,active=true;

insert into public.lesson_catalog(language_id,course_id,lesson_id,lesson_type,xp_reward)
select 'japanese','japanese-from-zero',lesson_id,'review',5 from unnest(array[
 'jp-hira-review-01','jp-hira-review-02','jp-hira-review-03','jp-hira-review-04','jp-hira-review-05','jp-hira-review-06','jp-hira-review-07','jp-hira-review-08','jp-hira-review-09','jp-hira-review-10','jp-hira-review-11','jp-hira-review-12','jp-hira-review-13','jp-hira-review-14','jp-kata-review-01','jp-kata-review-02','jp-kata-review-03','jp-kata-review-04','jp-kata-review-05','jp-kata-review-06','jp-kata-review-07','jp-kata-review-08','jp-kata-review-09','jp-kata-review-10','jp-kata-review-11','jp-kata-review-12','jp-kata-review-13','jp-book1-words-review-01','jp-book1-words-review-02','jp-book1-words-review-03','jp-book1-words-review-04','jp-book1-words-review-05','jp-book1-sentence-review-01','jp-book1-sentence-review-02','jp-book1-sentence-review-03','jp-book1-sentence-review-04','jp-book1-sentence-review-05','jp-book1-sentence-review-06','jp-book1-verbs-review-01','jp-book1-verbs-review-02','jp-book1-verbs-review-03','jp-book1-verbs-review-04','jp-book1-verbs-review-05','jp-book1-verbs-review-06','jp-book1-adjectives-review-01','jp-book1-adjectives-review-02','jp-book1-adjectives-review-03','jp-book1-functional-review-01','jp-book1-functional-review-02','jp-book1-functional-review-03','jp-book1-functional-review-04','jp-book1-kanji-review-01','jp-book1-kanji-review-02','jp-book1-kanji-review-03','jp-book1-kanji-review-04','jp-book1-kanji-review-05','jp-book1-kanji-review-06','jp-book1-kanji-review-07','jp-book1-kanji-review-08','jp-book1-kanji-review-09','jp-book1-bridge-review-01','jp-book1-bridge-review-02','jp-book1-bridge-review-03'
]::text[]) lesson_id
on conflict(language_id,course_id,lesson_id) do update set lesson_type=excluded.lesson_type,xp_reward=excluded.xp_reward,active=true;

insert into public.lesson_catalog(language_id,course_id,lesson_id,lesson_type,xp_reward)
select 'japanese','japanese-from-zero',lesson_id,'test',30 from unnest(array[
 'jp-hira-15-checkpoint','jp-kata-14-checkpoint','jp-book1-words-checkpoint','jp-book1-sentence-checkpoint','jp-book1-verbs-checkpoint','jp-book1-adjectives-checkpoint','jp-book1-functional-checkpoint','jp-book1-kanji-checkpoint','jp-book1-bridge-checkpoint'
]::text[]) lesson_id
on conflict(language_id,course_id,lesson_id) do update set lesson_type=excluded.lesson_type,xp_reward=excluded.xp_reward,active=true;

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','rejected','cancelled')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (sender_id <> receiver_id)
);
create unique index if not exists friend_requests_pending_pair_uidx on public.friend_requests
  (least(sender_id,receiver_id),greatest(sender_id,receiver_id)) where status='pending';
create index if not exists friend_requests_sender_idx on public.friend_requests(sender_id,status);
create index if not exists friend_requests_receiver_idx on public.friend_requests(receiver_id,status);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_low_id uuid not null references auth.users(id) on delete cascade,
  user_high_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (user_low_id < user_high_id),
  unique(user_low_id,user_high_id)
);
create index if not exists friendships_low_idx on public.friendships(user_low_id);
create index if not exists friendships_high_idx on public.friendships(user_high_id);

alter table public.lesson_catalog enable row level security;
alter table public.xp_events enable row level security;
alter table public.friend_requests enable row level security;
alter table public.friendships enable row level security;

drop policy if exists "xp_events_select_own" on public.xp_events;
create policy "xp_events_select_own" on public.xp_events for select to authenticated
using ((select auth.uid()) = user_id);
drop policy if exists "friend_requests_participant_select" on public.friend_requests;
create policy "friend_requests_participant_select" on public.friend_requests for select to authenticated
using ((select auth.uid()) in (sender_id,receiver_id));
drop policy if exists "friendships_participant_select" on public.friendships;
create policy "friendships_participant_select" on public.friendships for select to authenticated
using ((select auth.uid()) in (user_low_id,user_high_id));

revoke all on public.lesson_catalog,public.xp_events,public.friend_requests,public.friendships from anon,authenticated;
grant select on public.xp_events,public.friend_requests,public.friendships to authenticated;
revoke insert,delete,update on public.profiles from authenticated;
grant update(display_name,avatar_url) on public.profiles to authenticated;

create or replace function public.private_xp_summary(p_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'totalXp',coalesce(sum(xp),0),
    'todayXp',coalesce(sum(xp) filter(where earned_at >= date_trunc('day',now())),0),
    'completedLessons',count(*) filter(where event_key like 'lesson-completed:%'),
    'lastActivity',max(earned_at),
    'byLanguage',coalesce((select jsonb_object_agg(language_id,total) from (select language_id,sum(xp) total from public.xp_events where user_id=p_user_id group by language_id) s),'{}'::jsonb)
  ) from public.xp_events where user_id=p_user_id;
$$;
revoke all on function public.private_xp_summary(uuid) from public,anon,authenticated;

create or replace function public.get_my_xp_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Autenticación requerida'; end if;
  return public.private_xp_summary(uid);
end;
$$;

create or replace function public.complete_lesson(
  p_language_id text,
  p_course_id text,
  p_lesson_id text,
  p_completed_at timestamptz default now(),
  p_client_event_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  lang text := lower(trim(p_language_id));
  lesson public.lesson_catalog%rowtype;
  inserted integer;
  key text;
begin
  if uid is null then raise exception 'Autenticación requerida'; end if;
  select * into lesson from public.lesson_catalog
    where language_id=lang and course_id=trim(p_course_id) and lesson_id=trim(p_lesson_id) and active;
  if not found then raise exception 'La lección no existe en el catálogo de XP'; end if;
  key := 'lesson-completed:'||lang||':'||lesson.course_id||':'||lesson.lesson_id;
  insert into public.xp_events(user_id,event_key,event_type,language_id,course_id,lesson_id,xp,metadata,earned_at)
  values(uid,key,'lesson_completed',lang,lesson.course_id,lesson.lesson_id,lesson.xp_reward,
    jsonb_build_object('lessonType',lesson.lesson_type,'clientEventId',p_client_event_id),least(coalesce(p_completed_at,now()),now()))
  on conflict(user_id,event_key) do nothing;
  get diagnostics inserted = row_count;
  return jsonb_build_object('awarded',inserted=1,'xp',case when inserted=1 then lesson.xp_reward else 0 end,'summary',public.private_xp_summary(uid));
end;
$$;

create or replace function public.migrate_my_legacy_xp()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  legacy_xp integer := 0;
  legacy_progress jsonb := '{}'::jsonb;
begin
  if uid is null then raise exception 'Autenticación requerida'; end if;
  select progress_data into legacy_progress from public.user_progress
    where user_id=uid and progress_key='course:japanese'
    order by server_updated_at desc limit 1;
  legacy_progress := coalesce(legacy_progress,'{}'::jsonb);
  if coalesce(legacy_progress#>>'{value,xp}',legacy_progress->>'xp','') ~ '^\d+$' then
    legacy_xp := least(coalesce(legacy_progress#>>'{value,xp}',legacy_progress->>'xp')::integer,1000000);
  end if;
  -- Registra las lecciones antiguas con 0 XP para que repetirlas no vuelva a
  -- conceder puntos; el saldo histórico se conserva en un único ajuste.
  insert into public.xp_events(user_id,event_key,event_type,language_id,course_id,lesson_id,xp,metadata)
  select uid,'lesson-completed:japanese:japanese-from-zero:'||completed_id,'migration','japanese',
    'japanese-from-zero',completed_id,0,jsonb_build_object('source','legacy-completed-lessons','version',1)
  from jsonb_array_elements_text(case
    when jsonb_typeof(coalesce(legacy_progress#>'{value,completedLessons}',legacy_progress->'completedLessons'))='array'
      then coalesce(legacy_progress#>'{value,completedLessons}',legacy_progress->'completedLessons')
    else '[]'::jsonb end) completed_id
  where exists(select 1 from public.lesson_catalog c where c.language_id='japanese' and c.course_id='japanese-from-zero' and c.lesson_id=completed_id)
  on conflict(user_id,event_key) do nothing;
  if legacy_xp>0 then
    insert into public.xp_events(user_id,event_key,event_type,language_id,course_id,lesson_id,xp,metadata)
    values(uid,'migration:japanese-legacy-v1','migration','japanese','japanese-from-zero','legacy',legacy_xp,jsonb_build_object('source','user_progress','version',1))
    on conflict(user_id,event_key) do nothing;
  end if;
  return public.private_xp_summary(uid);
end;
$$;

create or replace function public.get_my_public_profile()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare uid uuid := auth.uid(); result jsonb;
begin
  if uid is null then raise exception 'Autenticación requerida'; end if;
  select jsonb_build_object('display_name',display_name,'avatar_url',avatar_url,'friend_code',friend_code) into result from public.profiles where id=uid;
  return result;
end;
$$;

create or replace function public.lookup_friend_code(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare uid uuid := auth.uid(); code text := upper(regexp_replace(coalesce(p_code,''),'[^A-Z2-9]','','g')); result jsonb;
begin
  if uid is null then raise exception 'Autenticación requerida'; end if;
  if left(code,2)='HS' then code := substr(code,3); end if;
  select jsonb_build_object('display_name',display_name,'avatar_url',avatar_url,'friend_code',friend_code) into result
    from public.profiles where friend_code='HS-'||code and id<>uid;
  if result is null then raise exception 'No encontramos una cuenta con ese código'; end if;
  return result;
end;
$$;

create or replace function public.send_friend_request(p_friend_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare uid uuid := auth.uid(); receiver uuid; request_id uuid;
begin
  if uid is null then raise exception 'Autenticación requerida'; end if;
  select id into receiver from public.profiles where friend_code=upper(trim(p_friend_code));
  if receiver is null then raise exception 'Código de amigo no encontrado'; end if;
  if receiver=uid then raise exception 'No puedes enviarte una solicitud a ti mismo'; end if;
  if exists(select 1 from public.friendships where user_low_id=least(uid,receiver) and user_high_id=greatest(uid,receiver)) then raise exception 'Ya son amigos'; end if;
  if exists(select 1 from public.friend_requests where status='pending' and least(sender_id,receiver_id)=least(uid,receiver) and greatest(sender_id,receiver_id)=greatest(uid,receiver)) then raise exception 'Ya existe una solicitud pendiente'; end if;
  insert into public.friend_requests(sender_id,receiver_id) values(uid,receiver) returning id into request_id;
  return jsonb_build_object('request_id',request_id,'status','pending');
end;
$$;

create or replace function public.list_friend_requests()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare uid uuid := auth.uid(); received jsonb; sent jsonb;
begin
  if uid is null then raise exception 'Autenticación requerida'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('request_id',r.id,'display_name',p.display_name,'avatar_url',p.avatar_url,'friend_code',p.friend_code,'created_at',r.created_at) order by r.created_at desc),'[]'::jsonb)
    into received from public.friend_requests r join public.profiles p on p.id=r.sender_id where r.receiver_id=uid and r.status='pending';
  select coalesce(jsonb_agg(jsonb_build_object('request_id',r.id,'display_name',p.display_name,'avatar_url',p.avatar_url,'friend_code',p.friend_code,'created_at',r.created_at) order by r.created_at desc),'[]'::jsonb)
    into sent from public.friend_requests r join public.profiles p on p.id=r.receiver_id where r.sender_id=uid and r.status='pending';
  return jsonb_build_object('received',received,'sent',sent);
end;
$$;

create or replace function public.respond_friend_request(p_request_id uuid,p_action text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare uid uuid := auth.uid(); request public.friend_requests%rowtype;
begin
  if uid is null then raise exception 'Autenticación requerida'; end if;
  if p_action not in ('accepted','rejected') then raise exception 'Respuesta no válida'; end if;
  select * into request from public.friend_requests where id=p_request_id and receiver_id=uid and status='pending' for update;
  if not found then raise exception 'La solicitud no existe o no te pertenece'; end if;
  update public.friend_requests set status=p_action,responded_at=now() where id=request.id;
  if p_action='accepted' then
    insert into public.friendships(user_low_id,user_high_id) values(least(request.sender_id,request.receiver_id),greatest(request.sender_id,request.receiver_id)) on conflict do nothing;
  end if;
  return jsonb_build_object('status',p_action);
end;
$$;

create or replace function public.cancel_friend_request(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare uid uuid := auth.uid(); changed integer;
begin
  if uid is null then raise exception 'Autenticación requerida'; end if;
  update public.friend_requests set status='cancelled',responded_at=now() where id=p_request_id and sender_id=uid and status='pending';
  get diagnostics changed=row_count;
  if changed=0 then raise exception 'La solicitud no existe o no te pertenece'; end if;
  return jsonb_build_object('status','cancelled');
end;
$$;

create or replace function public.list_friends_with_xp()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare uid uuid := auth.uid(); result jsonb;
begin
  if uid is null then raise exception 'Autenticación requerida'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'display_name',p.display_name,'avatar_url',p.avatar_url,'friend_code',p.friend_code,
    'total_xp',(xp.summary->>'totalXp')::integer,'by_language',xp.summary->'byLanguage',
    'last_activity',case
      when xp.summary->>'lastActivity' is null then 'Sin actividad'
      when (xp.summary->>'lastActivity')::timestamptz >= current_date then 'Hoy'
      when (xp.summary->>'lastActivity')::timestamptz >= current_date-7 then 'Últimos 7 días'
      else 'Hace más de una semana' end
  ) order by (xp.summary->>'totalXp')::integer desc),'[]'::jsonb)
  into result from (select case when f.user_low_id=uid then f.user_high_id else f.user_low_id end friend_id from public.friendships f where uid in(f.user_low_id,f.user_high_id)) x
  join public.profiles p on p.id=x.friend_id cross join lateral (select public.private_xp_summary(x.friend_id) summary) xp;
  return result;
end;
$$;

create or replace function public.remove_friend(p_friend_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare uid uuid := auth.uid(); friend uuid; changed integer;
begin
  if uid is null then raise exception 'Autenticación requerida'; end if;
  select id into friend from public.profiles where friend_code=upper(trim(p_friend_code));
  delete from public.friendships where user_low_id=least(uid,friend) and user_high_id=greatest(uid,friend);
  get diagnostics changed=row_count;
  if changed=0 then raise exception 'La amistad no existe'; end if;
  return jsonb_build_object('removed',true);
end;
$$;

revoke all on function public.generate_friend_code() from public,anon,authenticated;
revoke all on function public.get_my_xp_summary() from public,anon;
revoke all on function public.complete_lesson(text,text,text,timestamptz,text) from public,anon;
revoke all on function public.migrate_my_legacy_xp() from public,anon;
revoke all on function public.get_my_public_profile() from public,anon;
revoke all on function public.lookup_friend_code(text) from public,anon;
revoke all on function public.send_friend_request(text) from public,anon;
revoke all on function public.list_friend_requests() from public,anon;
revoke all on function public.respond_friend_request(uuid,text) from public,anon;
revoke all on function public.cancel_friend_request(uuid) from public,anon;
revoke all on function public.list_friends_with_xp() from public,anon;
revoke all on function public.remove_friend(text) from public,anon;

grant execute on function public.get_my_xp_summary() to authenticated;
grant execute on function public.complete_lesson(text,text,text,timestamptz,text) to authenticated;
grant execute on function public.migrate_my_legacy_xp() to authenticated;
grant execute on function public.get_my_public_profile() to authenticated;
grant execute on function public.lookup_friend_code(text) to authenticated;
grant execute on function public.send_friend_request(text) to authenticated;
grant execute on function public.list_friend_requests() to authenticated;
grant execute on function public.respond_friend_request(uuid,text) to authenticated;
grant execute on function public.cancel_friend_request(uuid) to authenticated;
grant execute on function public.list_friends_with_xp() to authenticated;
grant execute on function public.remove_friend(text) to authenticated;

commit;
