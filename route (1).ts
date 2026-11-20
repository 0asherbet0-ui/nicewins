import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { ADMIN_ID, getDb } from "../../../lib/server";
import { verifyTelegram } from "../../../lib/telegram";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let user;
  try {
    user = verifyTelegram((await req.json()).initData);
  } catch {
    return NextResponse.json({ error: "Telegram authentication failed" }, { status: 401 });
  }

  try {
    const db = getDb();
    const telegramId = String(user.id);
    const profileQuery = db.from("profiles").select("first_name, referral_code");
    const existing = await profileQuery.eq("telegram_id", telegramId).maybeSingle();
    if (existing.error) throw existing.error;
    let profile = existing.data;

    if (!profile) {
      let referrer = null;
      if (user.startParam && /^[a-zA-Z0-9_-]{1,64}$/.test(user.startParam)) {
        const lookup = await db.from("profiles").select("telegram_id")
          .eq("referral_code", user.startParam).maybeSingle();
        if (lookup.error) throw lookup.error;
        referrer = lookup.data?.telegram_id ?? null;
      }

      const insert = await db.from("profiles").upsert({
        telegram_id: telegramId,
        username: user.username ?? null,
        first_name: user.first_name ?? null,
        referral_code: randomBytes(12).toString("hex"),
        referred_by: referrer,
      }, { onConflict: "telegram_id", ignoreDuplicates: true });
      if (insert.error) throw insert.error;

      const saved = await db.from("profiles").select("first_name, referral_code")
        .eq("telegram_id", telegramId).single();
      if (saved.error) throw saved.error;
      profile = saved.data;
    }

    const [offers, clicks] = await Promise.all([
      db.from("offers").select("id, name").eq("active", true).order("sort_order"),
      db.from("clicks").select("id", { count: "exact", head: true })
        .eq("partner_telegram_id", telegramId),
    ]);
    if (offers.error) throw offers.error;
    if (clicks.error) throw clicks.error;

    const miniAppUrl = process.env.TELEGRAM_MINI_APP_URL;
    const referralUrl = miniAppUrl
      ? `${miniAppUrl.replace(/\/$/, "")}?startapp=${encodeURIComponent(profile.referral_code)}`
      : null;

    return NextResponse.json({
      profile: { name: profile.first_name, referralCode: profile.referral_code, clicks: clicks.count ?? 0 },
      offers: offers.data,
      referralUrl,
      isAdmin: telegramId === ADMIN_ID,
    });
  } catch {
    return NextResponse.json({ error: "Could not load NiceWins" }, { status: 500 });
  }
}
