import { NextRequest, NextResponse } from "next/server";
import { db, ADMIN_ID } from "@/lib/server";
import { verifyTelegram } from "@/lib/telegram";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
try {
const { initData } = await req.json();
const user = verifyTelegram(initData);


JavaScript
const telegramId = String(user.id);

let { data: profile } = await db
  .from("profiles")
  .select("*")
  .eq("telegram_id", telegramId)
  .maybeSingle();

if (!profile) {
  const referralCode = randomBytes(6).toString("hex");

  const { data, error } = await db
    .from("profiles")
    .insert({
      telegram_id: telegramId,
      username: user.username ?? null,
      first_name: user.first_name ?? null,
      referral_code: referralCode
    })
    .select()
    .single();

  if (error) throw error;
  profile = data;
} else {
  await db.from("profiles")
    .update({
      username: user.username ?? null,
      first_name: user.first_name ?? null
    })
    .eq("telegram_id", telegramId);
}

const { data: offers, error } = await db
  .from("offers")
  .select("id,name,active,sort_order")
  .eq("active", true)
  .order("sort_order");

if (error) throw error;

const { count } = await db
  .from("clicks")
  .select("*", { count: "exact", head: true })
  .eq("partner_telegram_id", telegramId);

return NextResponse.json({
  profile: {
    name: profile.first_name,
    referralCode: profile.referral_code,
    clicks: count ?? 0
  },
  offers,
  isAdmin: telegramId === ADMIN_ID
});
} catch {
return NextResponse.json(
{ error: "Authentication failed" },
{ status: 401 }
);
}
}
