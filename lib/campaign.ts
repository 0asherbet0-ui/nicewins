export function campaignFromStartParam(value: string | null): string | null {
  return value && /^tg_[a-z0-9_-]{1,61}$/.test(value) ? value : null;
}
