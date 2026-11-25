create function public.nicewins_admin_points()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with balances as (
    select telegram_id, sum(points) as points
    from public.daily_scratch_rewards
    group by telegram_id
  ), users as (
    select profiles.telegram_id, profiles.first_name, profiles.username,
      coalesce(balances.points, 0) as points
    from public.profiles
    left join balances using (telegram_id)
  )
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'telegramId', telegram_id::text,
      'name', first_name,
      'username', username,
      'points', points
    ) order by points desc, telegram_id
  ), '[]'::jsonb)
  from users;
$$;

revoke all on function public.nicewins_admin_points() from public, anon, authenticated;
grant execute on function public.nicewins_admin_points() to service_role;
