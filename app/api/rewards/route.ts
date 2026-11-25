import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../lib/server";
import { verifyTelegram } from "../../../lib/telegram";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let telegramId: string;
  let day: unknown;
  try {
    const body = await request.json();
    telegramId = String(verifyTelegram(body.initData).id);
    day = body.day;
  } catch {
    return NextResponse.json({ error: "Open NiceWins again in Telegram." }, { status: 401 });
  }

  if (day != null && (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day))) {
    return NextResponse.json({ error: "Invalid reward day." }, { status: 400 });
  }

  try {
    const { data, error } = await getDb().rpc("nicewins_daily_rewards", {
      viewer_id: telegramId,
      claim_day: day ?? null,
    });
    if (error) throw error;
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Couldn't load NiceWins points." }, { status: 500 });
  }
}
