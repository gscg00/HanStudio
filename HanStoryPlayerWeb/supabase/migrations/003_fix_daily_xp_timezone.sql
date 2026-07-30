-- Calcula el XP de hoy según la zona horaria del usuario, no según UTC.
-- La versión sin parámetros se conserva para compatibilidad con clientes ya
-- publicados; el cliente actualizado llama a la versión con p_timezone.

create or replace function public.private_xp_summary_for_timezone(
  p_user_id uuid,
  p_timezone text
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with bounds as (
    select (date_trunc('day', now() at time zone coalesce(nullif(trim(p_timezone), ''), 'UTC'))
      at time zone coalesce(nullif(trim(p_timezone), ''), 'UTC')) as today_start
  )
  select jsonb_build_object(
    'totalXp', coalesce(sum(xp), 0),
    'todayXp', coalesce(sum(xp) filter(where earned_at >= (select today_start from bounds)), 0),
    'completedLessons', count(*) filter(where event_key like 'lesson-completed:%'),
    'lastActivity', max(earned_at),
    'byLanguage', coalesce((
      select jsonb_object_agg(language_id, total)
      from (
        select language_id, sum(xp) total
        from public.xp_events
        where user_id = p_user_id
        group by language_id
      ) grouped
    ), '{}'::jsonb)
  )
  from public.xp_events
  where user_id = p_user_id;
$$;

revoke all on function public.private_xp_summary_for_timezone(uuid, text) from public, anon, authenticated;

create or replace function public.get_my_xp_summary(p_timezone text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Autenticación requerida'; end if;
  return public.private_xp_summary_for_timezone(uid, p_timezone);
end;
$$;

revoke all on function public.get_my_xp_summary(text) from public, anon;
grant execute on function public.get_my_xp_summary(text) to authenticated;
