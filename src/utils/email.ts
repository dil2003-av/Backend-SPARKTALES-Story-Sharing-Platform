import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const host = process.env.SMTP_HOST || "";
const port = Number(process.env.SMTP_PORT || 587);
const user = process.env.SMTP_USER || "";
const pass = process.env.SMTP_PASS || "";
const from = process.env.FROM_EMAIL || process.env.SMTP_USER || "no-reply@sparktales.com";

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: user ? { user, pass } : undefined,
});

export async function sendEmail(to: string, subject: string, html: string, text?: string) {
  try {
    await transporter.sendMail({ from, to, subject, html, text: text || html.replace(/<[^>]+>/g, "") });
    return true;
  } catch (err) {
    console.error("sendEmail error", err);
    return false;
  }
}

export function buildStatusEmail(
  name: string,
  title: string,
  status: "APPROVED" | "DECLINED"
) {
  const niceName = name || "there";

  const statusText =
    status === "APPROVED" ? "Approved" : "Declined";

  const accent =
    status === "APPROVED" ? "#22c55e" : "#ef4444";

  const badgeBg =
    status === "APPROVED" ? "#dcfce7" : "#fee2e2";

  const html = `
  <div style="background:#f9fafb; padding:40px 0; font-family:Arial, sans-serif;">
    <div style="
      max-width:550px;
      margin:auto;
      background:#ffffff;
      border-radius:12px;
      padding:30px;
      box-shadow:0 8px 20px rgba(0,0,0,0.06);
      border:1px solid #e5e7eb;
    ">

      <!-- Header -->
      <div style="text-align:center; margin-bottom:25px;">
        <h1 style="
          margin:0;
          font-size:26px;
          font-weight:700;
          color:#4f46e5;
        ">
          ✨ SparkTales
        </h1>
        <p style="margin-top:8px; color:#6b7280; font-size:14px;">
          Creativity. Expression. Stories that shine.
        </p>
      </div>

      <!-- Status Badge -->
      <div style="text-align:center; margin-bottom:20px;">
        <span style="
          display:inline-block;
          padding:8px 18px;
          background:${badgeBg};
          color:${accent};
          font-size:14px;
          font-weight:600;
          border-radius:20px;
          text-transform:uppercase;
          letter-spacing:0.5px;
        ">
          ${statusText}
        </span>
      </div>

      <!-- Body -->
      <p style="font-size:16px; color:#111827; margin-bottom:16px;">
        Hi <strong>${niceName}</strong>,
      </p>

      <p style="font-size:15px; color:#374151; margin-bottom:16px;">
        Your post titled <strong>${title}</strong> has been
        <span style="color:${accent}; font-weight:600;">${statusText}</span>
        by the SparkTales admin team.
      </p>

      <p style="font-size:15px; color:#374151; margin-bottom:20px;">
        If you have any questions or wish to submit revisions, feel free to reply to this email anytime.
      </p>

      <!-- Divider -->
      <hr style="border:none; border-top:1px solid #e5e7eb; margin:25px 0;" />

      <!-- Footer -->
      <div style="text-align:center; font-size:13px; color:#6b7280;">
        <p>Thank you for contributing to SparkTales 💜</p>
        <p>— The SparkTales Team</p>
      </div>

    </div>
  </div>
  `;

  const text = `Hi ${niceName}, your post "${title}" has been ${statusText} by the SparkTales admin team.`;

  return { html, text };
}

