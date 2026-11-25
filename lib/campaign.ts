export function campaignFromStartParam(value: string | null): string | null {
  return value && /^tg_[a-z0-9_-]{1,61}$/.test(value) ? value : null;
}

const offerCampaign = /^tg_(?:groupe_)?(winspirit|slotoro|coldbet)(?:_|$)/;

export function offerFromCampaign(campaign: string | null): string | null {
  return campaign?.match(offerCampaign)?.[1] ?? null;
}
