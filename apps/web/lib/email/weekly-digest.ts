/**
 * Weekly digest email — HTML template.
 * Uses inline styles for email client compatibility.
 */
export function buildWeeklyDigestHtml(data: {
  orgName: string;
  totalImpressions: number;
  totalClicks: number;
  totalSpend: number;
  campaignCount: number;
  topPerformer?: string;
  ctr?: number;
  dashboardUrl?: string;
}): string {
  const fmt = (n: number) => n.toLocaleString("sv-SE");
  const ctr = data.totalImpressions > 0
    ? ((data.totalClicks / data.totalImpressions) * 100).toFixed(1)
    : "0";

  return `
<!DOCTYPE html>
<html lang="sv">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f7f7f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="padding:32px 32px 16px;">
          <img src="https://doost.ai/logo.svg" alt="Doost AI" height="24" style="display:block;" />
        </td></tr>

        <!-- Greeting -->
        <tr><td style="padding:0 32px 24px;">
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#1a1a1a;">Veckorapport</h1>
          <p style="margin:8px 0 0;font-size:14px;color:#6b6b6b;">Hej ${data.orgName} — här är veckans resultat.</p>
        </td></tr>

        <!-- KPIs -->
        <tr><td style="padding:0 32px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#f7f7f5;border-radius:8px;padding:16px;text-align:center;width:33%;">
                <div style="font-size:24px;font-weight:700;color:#1a1a1a;">${fmt(data.totalImpressions)}</div>
                <div style="font-size:12px;color:#9b9b9b;margin-top:4px;">Visningar</div>
              </td>
              <td width="8"></td>
              <td style="background:#f7f7f5;border-radius:8px;padding:16px;text-align:center;width:33%;">
                <div style="font-size:24px;font-weight:700;color:#1a1a1a;">${fmt(data.totalClicks)}</div>
                <div style="font-size:12px;color:#9b9b9b;margin-top:4px;">Klick</div>
              </td>
              <td width="8"></td>
              <td style="background:#f7f7f5;border-radius:8px;padding:16px;text-align:center;width:33%;">
                <div style="font-size:24px;font-weight:700;color:#1a1a1a;">${fmt(Math.round(data.totalSpend))} kr</div>
                <div style="font-size:12px;color:#9b9b9b;margin-top:4px;">Spenderat</div>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Summary -->
        <tr><td style="padding:0 32px 24px;">
          <p style="margin:0;font-size:14px;color:#6b6b6b;line-height:1.6;">
            ${data.campaignCount} aktiva kampanjer med ${ctr}% CTR denna vecka.
            ${data.topPerformer ? `Bäst: <strong style="color:#1a1a1a;">${data.topPerformer}</strong>.` : ""}
          </p>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:0 32px 32px;" align="center">
          <a href="${data.dashboardUrl ?? "https://doost.ai/dashboard"}" style="display:inline-block;background:#1a1a1a;color:#ffffff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:999px;text-decoration:none;">
            Se full rapport →
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:16px 32px;border-top:1px solid #e5e5e3;">
          <p style="margin:0;font-size:11px;color:#9b9b9b;text-align:center;">
            Du får detta mejl varje måndag. <a href="${data.dashboardUrl ?? "https://doost.ai"}/dashboard/settings" style="color:#9b9b9b;">Hantera inställningar</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}
