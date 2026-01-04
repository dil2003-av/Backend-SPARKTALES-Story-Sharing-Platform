"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mailer_1 = __importDefault(require("../utils/mailer"));
const router = (0, express_1.Router)();
router.post("/send-test-email", async (req, res) => {
    try {
        const { to } = req.body;
        if (!to)
            return res.status(400).json({ message: "Email 'to' is required in body" });
        const html = `<p>This is a test email from SparkTales.</p>`;
        try {
            await (0, mailer_1.default)(to, "SparkTales test email", html);
            return res.status(200).json({ message: "Test email sent (or logged)." });
        }
        catch (err) {
            console.error("Error sending test email:", err);
            return res.status(500).json({ message: "Failed to send test email", error: err?.message || err });
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.default = router;
