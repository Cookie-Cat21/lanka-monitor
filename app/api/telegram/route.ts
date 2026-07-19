import { NextResponse, type NextRequest } from "next/server";
import { sendTelegramMessage, telegramConfigured } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  if (!telegramConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Telegram not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to enable this endpoint.",
      },
      { status: 503 }
    );
  }

  let body: { text?: unknown; parse_mode?: unknown };
  try {
    body = (await request.json()) as { text?: unknown; parse_mode?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.text || typeof body.text !== "string" || body.text.trim() === "") {
    return NextResponse.json(
      { ok: false, error: "Missing required field: text (non-empty string)." },
      { status: 400 }
    );
  }

  const parseMode =
    body.parse_mode === "Markdown" || body.parse_mode === "MarkdownV2"
      ? (body.parse_mode as "Markdown" | "MarkdownV2")
      : "HTML";

  const result = await sendTelegramMessage(body.text, parseMode);

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
