import { Resend } from "resend";

let _resend: Resend | null = null;

export function getResendClient(): Resend | null {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY not set — emails will be skipped");
    return null;
  }
  _resend = new Resend(key);
  return _resend;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}): Promise<boolean> {
  const client = getResendClient();
  if (!client) return false;

  try {
    await client.emails.send({
      from: opts.from ?? "Doost AI <rapport@doost.ai>",
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    return true;
  } catch (err) {
    console.error("[email] Failed to send:", err instanceof Error ? err.message : err);
    return false;
  }
}
