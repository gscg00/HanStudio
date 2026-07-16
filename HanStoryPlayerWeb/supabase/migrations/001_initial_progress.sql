begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  progress_key text not null check (length(progress_key) between 1 and 180),
  schema_version integer not null default 1 check (schema_version > 0),
  progress_data jsonb not null default '{}'::jsonb,
  client_updated_at timestamptz,
  server_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, progress_key)
);

create table if not exists public.sync_events (
  event_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null check (length(device_id) between 1 and 200),
  entity_key text not null check (length(entity_key) between 1 and 180),
  event_type text not null check (event_type in ('snapshot', 'delete')),
  payload jsonb not null default '{}'::jsonb,
  client_created_at timestamptz,
  server_created_at timestamptz not null default now()
);

create index if not exists user_progress_user_id_idx on public.user_progress(user_id);
create index if not exists user_progress_key_idx on public.user_progress(progress_key);
create index if not exists sync_events_user_id_idx on public.sync_events(user_id);
create index if not exists sync_events_entity_key_idx on public.sync_events(entity_key);
create index if not exists sync_events_user_entity_idx on public.sync_events(user_id, entity_key);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_progress_server_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.server_updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists user_progress_set_server_updated_at on public.user_progress;
create trigger user_progress_set_server_updated_at before update on public.user_progress
for each row execute function public.set_progress_server_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do update set
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = now();
  return new;
exception when others then
  raise warning 'No se pudo crear el perfil para el usuario %', new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of raw_user_meta_data on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_progress enable row level security;
alter table public.sync_events enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated
using ((select auth.uid()) = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated
using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles for delete to authenticated
using ((select auth.uid()) = id);

drop policy if exists "progress_select_own" on public.user_progress;
create policy "progress_select_own" on public.user_progress for select to authenticated
using ((select auth.uid()) = user_id);
drop policy if exists "progress_insert_own" on public.user_progress;
create policy "progress_insert_own" on public.user_progress for insert to authenticated
with check ((select auth.uid()) = user_id);
drop policy if exists "progress_update_own" on public.user_progress;
create policy "progress_update_own" on public.user_progress for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "progress_delete_own" on public.user_progress;
create policy "progress_delete_own" on public.user_progress for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "events_select_own" on public.sync_events;
create policy "events_select_own" on public.sync_events for select to authenticated
using ((select auth.uid()) = user_id);
drop policy if exists "events_insert_own" on public.sync_events;
create policy "events_insert_own" on public.sync_events for insert to authenticated
with check ((select auth.uid()) = user_id);
drop policy if exists "events_update_own" on public.sync_events;
create policy "events_update_own" on public.sync_events for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "events_delete_own" on public.sync_events;
create policy "events_delete_own" on public.sync_events for delete to authenticated
using ((select auth.uid()) = user_id);

revoke all on public.profiles, public.user_progress, public.sync_events from anon;
grant select, insert, update, delete on public.profiles, public.user_progress, public.sync_events to authenticated;

commit;
