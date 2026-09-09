import { prisma } from "@/lib/prisma";
import type { EmailTemplateKey } from "@prisma/client";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "HRMS <noreply@yourdomain.com>";

export type EmailVariable = string | number | null | undefined;

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  template: EmailTemplateKey;
  companyId?: string | null;
  actorId?: string | null;
};

const DEFAULT_TEMPLATES: Record<EmailTemplateKey, { subject: string; html: string; variables: string[] }> = {
  PAYSLIP_READY: {
    subject: "Your payslip for {{month}} {{year}} is ready",
    html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="color:#0f172a;margin:0 0 16px">Hi {{name}},</h2>
      <p style="color:#475569;line-height:1.6">Your payslip for <strong>{{month}} {{year}}</strong> has been generated.</p>
      <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin:24px 0">
        <table style="width:100%;font-size:14px;color:#0f172a">
          <tr><td>Gross</td><td style="text-align:right">{{gross}}</td></tr>
          <tr><td>Deductions</td><td style="text-align:right">- {{deductions}}</td></tr>
          <tr style="font-weight:bold;border-top:1px solid #cbd5e1"><td style="padding-top:8px">Net Pay</td><td style="text-align:right;padding-top:8px">{{net}}</td></tr>
        </table>
      </div>
      <p style="color:#475569;line-height:1.6">Log in to view the full payslip or download the PDF.</p>
      <a href="{{link}}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-weight:600">View Payslip</a>
      <p style="color:#94a3b8;font-size:12px;margin-top:24px">Sent by {{company}}</p>
    </div>`,
    variables: ["name", "month", "year", "gross", "deductions", "net", "link", "company"],
  },
  LEAVE_APPROVED: {
    subject: "Your leave request has been approved",
    html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="color:#0f172a;margin:0 0 16px">Hi {{name}},</h2>
      <p style="color:#475569;line-height:1.6">Your <strong>{{leaveType}}</strong> leave from <strong>{{startDate}}</strong> to <strong>{{endDate}}</strong> has been <strong style="color:#10b981">approved</strong> by {{reviewer}}.</p>
      <p style="color:#475569;line-height:1.6">{{days}} day(s) will be deducted from your balance.</p>
      <p style="color:#94a3b8;font-size:12px;margin-top:24px">Sent by {{company}}</p>
    </div>`,
    variables: ["name", "leaveType", "startDate", "endDate", "days", "reviewer", "company"],
  },
  LEAVE_REJECTED: {
    subject: "Your leave request was rejected",
    html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="color:#0f172a;margin:0 0 16px">Hi {{name}},</h2>
      <p style="color:#475569;line-height:1.6">Your <strong>{{leaveType}}</strong> leave from <strong>{{startDate}}</strong> to <strong>{{endDate}}</strong> has been <strong style="color:#ef4444">rejected</strong> by {{reviewer}}.</p>
      {{#if note}}<p style="color:#475569;line-height:1.6"><em>Reason: {{note}}</em></p>{{/if}}
      <p style="color:#94a3b8;font-size:12px;margin-top:24px">Sent by {{company}}</p>
    </div>`,
    variables: ["name", "leaveType", "startDate", "endDate", "reviewer", "note", "company"],
  },
  LEAVE_SUBMITTED: {
    subject: "New leave request from {{employeeName}}",
    html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="color:#0f172a;margin:0 0 16px">New Leave Request</h2>
      <p style="color:#475569;line-height:1.6"><strong>{{employeeName}}</strong> has submitted a leave request:</p>
      <ul style="color:#475569;line-height:1.8">
        <li>Type: {{leaveType}}</li>
        <li>From: {{startDate}}</li>
        <li>To: {{endDate}}</li>
        <li>Days: {{days}}</li>
      </ul>
      <a href="{{link}}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-weight:600">Review Request</a>
      <p style="color:#94a3b8;font-size:12px;margin-top:24px">Sent by {{company}}</p>
    </div>`,
    variables: ["employeeName", "leaveType", "startDate", "endDate", "days", "link", "company"],
  },
  PASSWORD_RESET: {
    subject: "Reset your HRMS password",
    html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="color:#0f172a;margin:0 0 16px">Password Reset</h2>
      <p style="color:#475569;line-height:1.6">Click the button below to reset your password. This link expires in 1 hour.</p>
      <a href="{{link}}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-weight:600">Reset Password</a>
      <p style="color:#94a3b8;font-size:12px;margin-top:24px">If you didn't request this, you can ignore this email.</p>
    </div>`,
    variables: ["link"],
  },
  MONTHLY_PAYROLL_SUMMARY: {
    subject: "Payroll for {{month}} {{year}} finalized",
    html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="color:#0f172a;margin:0 0 16px">Payroll Finalized</h2>
      <p style="color:#475569;line-height:1.6">The payroll for <strong>{{month}} {{year}}</strong> has been finalized.</p>
      <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin:24px 0">
        <table style="width:100%;font-size:14px;color:#0f172a">
          <tr><td>Employees</td><td style="text-align:right">{{count}}</td></tr>
          <tr><td>Total Gross</td><td style="text-align:right">{{gross}}</td></tr>
          <tr><td>Total Deductions</td><td style="text-align:right">{{deductions}}</td></tr>
          <tr style="font-weight:bold;border-top:1px solid #cbd5e1"><td style="padding-top:8px">Net Payout</td><td style="text-align:right;padding-top:8px">{{net}}</td></tr>
        </table>
      </div>
      <a href="{{link}}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-weight:600">View Report</a>
      <p style="color:#94a3b8;font-size:12px;margin-top:24px">Sent by {{company}}</p>
    </div>`,
    variables: ["month", "year", "count", "gross", "deductions", "net", "link", "company"],
  },
  WELCOME: {
    subject: "Welcome to {{company}}",
    html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="color:#0f172a;margin:0 0 16px">Hi {{name}},</h2>
      <p style="color:#475569;line-height:1.6">Welcome to <strong>{{company}}</strong>! Your account is now active.</p>
      <a href="{{link}}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-weight:600">Sign in</a>
    </div>`,
    variables: ["name", "company", "link"],
  },
  PUNCH_REMINDER: {
    subject: "Don't forget to punch in",
    html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <p style="color:#475569;line-height:1.6">Hi {{name}}, this is a reminder to punch in for today.</p>
    </div>`,
    variables: ["name"],
  },
  PROFILE_APPROVED: {
    subject: "Your profile changes have been approved",
    html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="color:#0f172a;margin:0 0 16px">Hi {{name}},</h2>
      <p style="color:#475569;line-height:1.6">Your recent profile changes have been <strong style="color:#10b981">approved</strong> by HR.</p>
    </div>`,
    variables: ["name"],
  },
  PROFILE_REJECTED: {
    subject: "Your profile changes were rejected",
    html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="color:#0f172a;margin:0 0 16px">Hi {{name}},</h2>
      <p style="color:#475569;line-height:1.6">Your recent profile changes were <strong style="color:#ef4444">rejected</strong> by HR.</p>
      {{#if reason}}<p style="color:#475569;line-height:1.6"><em>Reason: {{reason}}</em></p>{{/if}}
    </div>`,
    variables: ["name", "reason"],
  },
  ANNOUNCEMENT: {
    subject: "{{title}}",
    html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="color:#0f172a;margin:0 0 16px">{{title}}</h2>
      <div style="color:#475569;line-height:1.6;white-space:pre-wrap">{{body}}</div>
      <p style="color:#94a3b8;font-size:12px;margin-top:24px">Sent by {{company}}</p>
    </div>`,
    variables: ["title", "body", "company"],
  },
};

function renderTemplate(tpl: string, vars: Record<string, EmailVariable>): string {
  return tpl.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    const trimmed = key.trim();
    if (trimmed.startsWith("#if ")) return "";
    return vars[trimmed] !== undefined && vars[trimmed] !== null ? String(vars[trimmed]) : "";
  });
}

function stripConditionals(tpl: string, vars: Record<string, EmailVariable>): string {
  return tpl.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, inner) => {
    const v = vars[key];
    return v !== undefined && v !== null && v !== "" ? inner : "";
  });
}

async function sendViaResend(payload: { to: string; subject: string; html: string }): Promise<{ ok: boolean; providerId?: string; error?: string }> {
  if (!RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set, skipping send");
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Resend ${res.status}: ${text}` };
    }
    const data = (await res.json()) as { id?: string };
    return { ok: true, providerId: data.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function getTemplate(key: EmailTemplateKey) {
  const tpl = await prisma.emailTemplate.findUnique({ where: { key } });
  if (tpl) return tpl;
  const def = DEFAULT_TEMPLATES[key];
  return prisma.emailTemplate.create({
    data: {
      key,
      name: key,
      subject: def.subject,
      bodyHtml: def.html,
      variables: JSON.stringify(def.variables),
    },
  });
}

export async function sendEmail(args: {
  template: EmailTemplateKey;
  to: string;
  variables: Record<string, EmailVariable>;
  companyId?: string | null;
  actorId?: string | null;
  subjectOverride?: string;
}): Promise<{ ok: boolean; logId: string; providerId?: string; error?: string }> {
  const tpl = await getTemplate(args.template);
  const baseHtml = stripConditionals(tpl.bodyHtml, args.variables);
  const html = renderTemplate(baseHtml, args.variables);
  const subject = renderTemplate(args.subjectOverride ?? tpl.subject, args.variables);

  const log = await prisma.emailLog.create({
    data: {
      companyId: args.companyId ?? null,
      to: args.to,
      subject,
      template: args.template,
      status: "QUEUED",
    },
  });

  const result = await sendViaResend({ to: args.to, subject, html });

  await prisma.emailLog.update({
    where: { id: log.id },
    data: {
      status: result.ok ? "SENT" : "FAILED",
      providerId: result.providerId ?? null,
      error: result.error ?? null,
      sentAt: result.ok ? new Date() : null,
    },
  });

  return { ok: result.ok, logId: log.id, providerId: result.providerId, error: result.error };
}

export async function retryFailedEmail(logId: string): Promise<{ ok: boolean }> {
  const log = await prisma.emailLog.findUnique({ where: { id: logId } });
  if (!log || log.status === "SENT") return { ok: false };

  const tpl = await prisma.emailTemplate.findUnique({ where: { key: log.template } });
  const html = tpl ? renderTemplate(tpl.bodyHtml, {}) : "<p>" + log.subject + "</p>";

  const result = await sendViaResend({ to: log.to, subject: log.subject, html });
  await prisma.emailLog.update({
    where: { id: logId },
    data: {
      status: result.ok ? "SENT" : "FAILED",
      providerId: result.providerId ?? null,
      error: result.error ?? null,
      sentAt: result.ok ? new Date() : null,
    },
  });
  return { ok: result.ok };
}

export async function listEmailLogs(companyId: string, opts?: { take?: number; status?: string }) {
  return prisma.emailLog.findMany({
    where: {
      companyId,
      ...(opts?.status ? { status: opts.status as never } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: opts?.take ?? 100,
  });
}
