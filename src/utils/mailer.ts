import nodemailer from "nodemailer"

const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS
const EMAIL_FROM = process.env.EMAIL_FROM || SMTP_USER
const SMTP_SECURE = process.env.SMTP_SECURE === 'true' || (process.env.SMTP_PORT === '465')
const SMTP_TLS_REJECT_UNAUTHORIZED = process.env.SMTP_TLS_REJECT_UNAUTHORIZED === 'false' ? false : true

let transporter: nodemailer.Transporter | null = null

if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    tls: { rejectUnauthorized: SMTP_TLS_REJECT_UNAUTHORIZED }
  })
}

// Log transporter status at startup
if (transporter) {
  transporter.verify().then(() => {
    console.log("SMTP transporter is configured and ready to send emails")
  }).catch((err) => {
    console.warn("SMTP transporter configured but verification failed:", err.message || err)
  })
} else {
  console.warn("SMTP not configured. Emails will be logged but not sent.")
}

export function isSmtpConfigured() {
  return Boolean(transporter)
}

export async function sendMail(to: string, subject: string, html: string) {
  if (!transporter) {
    console.warn("SMTP not configured. Skipping email send. Mail content:\n", { to, subject, html })
    return { ok: false, logged: true }
  }

  try {
    const info = await transporter.sendMail({ from: EMAIL_FROM, to, subject, html })
    console.log('Email sent:', info && (info.messageId || info.response))
    return { ok: true, info }
  } catch (err: any) {
    console.error('Error sending email:', err && (err.message || err))
    return { ok: false, error: err && (err.message || err) }
  }
}

export default sendMail
