import { Router } from "express"
import sendMail from "../utils/mailer"

const router = Router()

router.post("/send-test-email", async (req, res) => {
  try {
    const { to } = req.body
    if (!to) return res.status(400).json({ message: "Email 'to' is required in body" })

    const html = `<p>This is a test email from SparkTales.</p>`

    try {
      await sendMail(to, "SparkTales test email", html)
      return res.status(200).json({ message: "Test email sent (or logged)." })
    } catch (err: any) {
      console.error("Error sending test email:", err)
      return res.status(500).json({ message: "Failed to send test email", error: err?.message || err })
    }
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Internal server error" })
  }
})

export default router
