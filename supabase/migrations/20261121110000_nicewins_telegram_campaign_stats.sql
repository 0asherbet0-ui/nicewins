create table public.campaign_opens (
  launch_id text primary key,
  campaign text not null,
  opened_at timestamptz not null default now()
);
alter table public.campaign_opens enable row level security;
revoke all on public.campaign_opens from public, anon, authenticated;
grant select, insert on public.campaign_opens to service_role;
alter table public.clicks add column campaign text;
create index clicks_campaign_offer_idx on public.clicks (campaign, offer_id) where campaign is not null;

create function public.nicewins_campaign_stats() returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'opens', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.campaign)
      from (select campaign, count(*) as count from public.campaign_opens group by campaign) t
    ), '[]'::jsonb),
    'clicks', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.campaign, t.offer_id)
      from (
        select c.campaign, c.offer_id, o.name, count(*) as count
        from public.clicks c join public.offers o on o.id = c.offer_id
        where c.campaign is not null group by c.campaign, c.offer_id, o.name
      ) t
    ), '[]'::jsonb)
  );
$$;
revoke all on function public.nicewins_campaign_stats() from public, anon, authenticated;
grant execute on function public.nicewins_campaign_stats() to service_role;
