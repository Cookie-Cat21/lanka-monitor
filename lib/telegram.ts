/**
 * Telegram notification helper.
 * Requires TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID env vars.
 * Returns an honest error when not configured rather than failing silently.
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export function telegramConfigured(): boolean {
  return Boolean(BOT_TOKEN && CHAT_ID);
}

export interface TelegramResult {
  ok: boolean;
  error?: string;
}

/**
 * Send a plain-text or HTML message to the configured Telegram chat.
 * @param text Message body (Telegram HTML subset supported).
 * @param parseMode "HTML" | "Markdown" | "MarkdownV2" (default HTML)
 */
export async function sendTelegramMessage(
  text: string,
  parseMode: "HTML" | "Markdown" | "MarkdownV2" = "HTML"
): Promise<TelegramResult> {
  if (!BOT_TOKEN || !CHAT_ID) {
    return {
      ok: false,
      error:
        "Telegram not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID environment variables.",
    };
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text,
          parse_mode: parseMode,
          disable_web_page_preview: true,
        }),
      }
    );

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { description?: string };
      return {
        ok: false,
        error: body.description ?? `Telegram API error ${res.status}`,
      };
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}
