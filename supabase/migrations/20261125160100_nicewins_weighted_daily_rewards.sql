create or replace function public.nicewins_daily_rewards(viewer_id bigint, claim_day date default null)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  today date := (statement_timestamp() at time zone 'Europe/Budapest')::date;
  draw double precision;
begin
  if claim_day = today then
    draw := random();
    insert into public.daily_scratch_rewards (telegram_id, reward_day, points)
    values (viewer_id, today, case
      when draw < 0.65 then 50
      when draw < 0.90 then 100
      else 200
    end)
    on conflict (telegram_id, reward_day) do nothing;
  end if;

  return (
    select jsonb_build_object(
      'balance', coalesce(sum(points), 0),
      'reward', max(points) filter (where reward_day = today),
      'day', today,
      'nextAt', (today + 1)::timestamp at time zone 'Europe/Budapest'
    )
    from public.daily_scratch_rewards where telegram_id = viewer_id
  );
end;
$$;
