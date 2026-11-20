import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../lib/server";
import { verifyTelegram } from "../../../lib/telegram";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let user;
  let offerId: unknown;
  try {
    const body = await req.json();
    user = verifyTelegram(body.initData);
    offerId = body.offerId;
  } catch {
    return NextResponse.json({ error: "Telegram authentication failed" }, { status: 401 });
  }
  if (typeof offerId !== "string" || !offerId) {
    return NextResponse.json({ error: "Missing offer" }, { status: 400 });
  }

  try {
    const db = getDb();
    const telegramId = String(user.id);
    const [offer, profile] = await Promise.all([
      db.from("offers").select("affiliate_url").eq("id", offerId).eq("active", true).maybeSingle(),
      db.from("profiles").select("referred_by").eq("telegram_id", telegramId).maybeSingle(),
    ]);
    if (offer.error) throw offer.error;
    if (profile.error) throw profile.error;
    if (!offer.data || !profile.data) {
      return NextResponse.json({ error: "Offer or profile unavailable" }, { status: 404 });
    }

    const url = new URL(offer.data.affiliate_url);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return NextResponse.json({ error: "Invalid offer URL" }, { status: 500 });
    }

    const click = await db.from("clicks").insert({
      offer_id: offerId,
      partner_telegram_id: profile.data.referred_by ?? telegramId,
    });
    if (click.error) throw click.error;

    return NextResponse.json({ url: url.href, creditedToViewer: profile.data.referred_by == null });
  } catch {
    return NextResponse.json({ error: "Could not record click" }, { status: 500 });
  }
}
