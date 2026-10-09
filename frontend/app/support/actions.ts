"use server";

import { revalidatePath } from "next/cache";

export async function sendSupportEmail(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const subject = (formData.get("subject") as string)?.trim();
  const message = (formData.get("message") as string)?.trim();

  if (!name || !email || !subject || !message) {
    return { ok: false as const, error: "All fields are required." };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "HRMS <noreply@yourdomain.com>";
  const supportTo = "support@hrms-suite.com";

  if (!apiKey) {
    return { ok: false as const, error: "Email service is not configured." };
  }

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, sans-serif; color: #0f172a; max-width: 640px; margin: 0 auto;">
      <h2 style="font-size: 18px; font-weight: 700; margin-bottom: 12px;">New Support Request</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <tr><td style="padding: 6px 0; font-weight: 600; width: 140px;">Name</td><td style="padding: 6px 0;">${escapeHtml(name)}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: 600;">Email</td><td style="padding: 6px 0;">${escapeHtml(email)}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: 600;">Subject</td><td style="padding: 6px 0;">${escapeHtml(subject)}</td></tr>
      </table>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 12px;">
        <p style="font-weight: 600; margin-bottom: 6px;">Message</p>
        <p style="white-space: pre-wrap; line-height: 1.6;">${escapeHtml(message)}</p>
      </div>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: fromEmail,
      to: supportTo,
      replyTo: email,
      subject: `[HRMS Support] ${subject}`,
      html,
    }),
  });

  if (!res.ok) {
    return { ok: false as const, error: `Failed to send email: ${res.status}` };
  }

  revalidatePath("/support");
  return { ok: true as const };
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
