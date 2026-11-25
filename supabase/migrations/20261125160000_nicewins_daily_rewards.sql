create table public.daily_scratch_rewards (
  telegram_id bigint not null references public.profiles (telegram_id) on delete cascade,
  reward_day date not null,
  points integer not null check (points in (50, 100, 200)),
  primary key (telegram_id, reward_day)
);

alter table public.daily_scratch_rewards enable row level security;
revoke all on public.daily_scratch_rewards from public, anon, authenticated;
grant select, insert on public.daily_scratch_rewards to service_role;

create function public.nicewins_daily_rewards(viewer_id bigint, claim_day date default null)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  today date := (statement_timestamp() at time zone 'Europe/Budapest')::date;
  rewards integer[] := array[50, 100, 200];
begin
  if claim_day = today then
    insert into public.daily_scratch_rewards (telegram_id, reward_day, points)
    values (viewer_id, today, rewards[1 + floor(random() * 3)::integer])
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

revoke all on function public.nicewins_daily_rewards(bigint, date) from public, anon, authenticated;
grant execute on function public.nicewins_daily_rewards(bigint, date) to service_role;
