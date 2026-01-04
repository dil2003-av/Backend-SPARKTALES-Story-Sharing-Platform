"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetWithOtp = exports.verifyOtp = exports.forgotOtp = exports.resetPassword = exports.forgotPassword = exports.refreshToken = exports.updateMyProfile = exports.getMyProfile = exports.registerAdmin = exports.login = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const user_model_1 = require("../models/user.model");
const notification_controller_1 = require("./notification.controller");
const tokens_1 = require("../utils/tokens");
const mailer_1 = __importDefault(require("../utils/mailer"));
const clodinaryconfig_1 = __importDefault(require("../config/clodinaryconfig"));
dotenv_1.default.config();
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_RESET_SECRET = process.env.JWT_RESET_SECRET || process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
const uploadBufferToCloudinary = async (file) => {
    if (!file)
        return null;
    return await new Promise((resolve, reject) => {
        const stream = clodinaryconfig_1.default.uploader.upload_stream({ resource_type: "image" }, (error, result) => {
            if (error || !result)
                return reject(error || new Error("Upload failed"));
            resolve(result.secure_url);
        });
        stream.end(file.buffer);
    });
};
// -------------------- REGISTER USER --------------------
const registerUser = async (req, res) => {
    try {
        const { email, password, firstname, lastname } = req.body;
        const existingUser = await user_model_1.User.findOne({ email });
        if (existingUser)
            return res.status(400).json({ message: "Email exists" });
        const hash = await bcryptjs_1.default.hash(password, 10);
        const user = await user_model_1.User.create({
            email,
            firstname,
            lastname,
            password: hash,
            roles: [user_model_1.Role.USER],
        });
        res.status(201).json({
            message: "User registered",
            data: { email: user.email, roles: user.roles },
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.registerUser = registerUser;
// -------------------- LOGIN --------------------
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const existingUser = (await user_model_1.User.findOne({ email }));
        if (!existingUser)
            return res.status(401).json({ message: "Invalid credentials" });
        const valid = await bcryptjs_1.default.compare(password, existingUser.password);
        if (!valid)
            return res.status(401).json({ message: "Invalid credentials" });
        const accessToken = (0, tokens_1.signAccessToken)(existingUser);
        const refreshToken = (0, tokens_1.signRefreshToken)(existingUser);
        // Notify admins of user login activity
        try {
            await (0, notification_controller_1.createNotificationForAdmins)({
                title: "User Login",
                message: `${existingUser.email} logged in`,
                type: "info",
            });
        }
        catch (err) {
            console.warn("notify admins login failed", err);
        }
        res.status(200).json({
            message: "success",
            data: {
                email: existingUser.email,
                roles: existingUser.roles,
                accessToken,
                refreshToken,
            },
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.login = login;
// -------------------- REGISTER ADMIN --------------------
const registerAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const existingUser = await user_model_1.User.findOne({ email });
        if (existingUser)
            return res.status(400).json({ message: "Email exists" });
        const hash = await bcryptjs_1.default.hash(password, 10);
        const user = await user_model_1.User.create({
            email,
            password: hash,
            roles: [user_model_1.Role.ADMIN],
        });
        res.status(201).json({
            message: "Admin registered",
            data: { email: user.email, roles: user.roles },
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.registerAdmin = registerAdmin;
// -------------------- GET MY PROFILE --------------------
const getMyProfile = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        const user = await user_model_1.User.findById(req.user.sub).select("-password -otp -otpExpires");
        if (!user)
            return res.status(404).json({ message: "User not found" });
        const { email, roles, _id, firstname, lastname, phone, address, avatarUrl, createdAt, approved } = user;
        res.status(200).json({
            message: "ok",
            data: { id: _id, email, roles, firstname, lastname, phone, address, avatarUrl, createdAt, approved }
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.getMyProfile = getMyProfile;
// -------------------- UPDATE MY PROFILE --------------------
const updateMyProfile = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        const user = await user_model_1.User.findById(req.user.sub).select("-password -otp -otpExpires");
        if (!user)
            return res.status(404).json({ message: "User not found" });
        const { firstname, lastname, phone, address } = req.body;
        if (typeof firstname === "string")
            user.firstname = firstname;
        if (typeof lastname === "string")
            user.lastname = lastname;
        if (typeof phone === "string")
            user.phone = phone;
        if (typeof address === "string")
            user.address = address;
        const avatarUrl = await uploadBufferToCloudinary(req.file);
        if (avatarUrl)
            user.avatarUrl = avatarUrl;
        await user.save();
        const { email, roles, _id, createdAt, approved } = user;
        res.status(200).json({
            message: "Profile updated",
            data: { id: _id, email, roles, firstname: user.firstname, lastname: user.lastname, phone: user.phone, address: user.address, avatarUrl: user.avatarUrl, createdAt, approved }
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.updateMyProfile = updateMyProfile;
// -------------------- REFRESH TOKEN --------------------
const refreshToken = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token)
            return res.status(400).json({ message: "Token required" });
        if (!JWT_REFRESH_SECRET)
            throw new Error("JWT_REFRESH_SECRET missing");
        const payload = jsonwebtoken_1.default.verify(token, JWT_REFRESH_SECRET);
        const user = await user_model_1.User.findById(payload.sub);
        if (!user)
            return res.status(403).json({ message: "Invalid refresh token" });
        const accessToken = (0, tokens_1.signAccessToken)(user);
        res.status(200).json({ accessToken });
    }
    catch (err) {
        console.error(err);
        res.status(403).json({ message: "Invalid or expired token" });
    }
};
exports.refreshToken = refreshToken;
// -------------------- FORGOT / RESET PASSWORD --------------------
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email)
            return res.status(400).json({ message: "Email required" });
        const user = await user_model_1.User.findOne({ email });
        if (!user)
            return res.status(404).json({ message: "User not found" });
        const token = jsonwebtoken_1.default.sign({ sub: user._id.toString() }, JWT_RESET_SECRET, { expiresIn: '15m' });
        // In production you'd email the token. For now, return the token for dev/testing.
        return res.status(200).json({ message: 'Password reset token generated', resetToken: token });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password)
            return res.status(400).json({ message: 'Token and new password required' });
        const payload = jsonwebtoken_1.default.verify(token, JWT_RESET_SECRET);
        const user = await user_model_1.User.findById(payload.sub);
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const hash = await bcryptjs_1.default.hash(password, 10);
        user.password = hash;
        await user.save();
        return res.status(200).json({ message: 'Password reset successful' });
    }
    catch (err) {
        console.error(err);
        return res.status(400).json({ message: 'Invalid or expired token' });
    }
};
exports.resetPassword = resetPassword;
// -------------------- OTP (email) password reset --------------------
const forgotOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email)
            return res.status(400).json({ message: 'Email required' });
        const user = await user_model_1.User.findOne({ email });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        // generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 1000 * 60 * 10); // 10 minutes
        user.otp = otp;
        user.otpExpires = expires;
        await user.save();
        // send email (if configured)
        const html = `<p>Your SparkTales password reset code: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`;
        try {
            await (0, mailer_1.default)(user.email, 'SparkTales password reset code', html);
        }
        catch (mailErr) {
            console.warn('Mail send failed', mailErr);
        }
        // For dev convenience, return OTP in response if SMTP not configured
        return res.status(200).json({ message: 'OTP sent if email configured', otpSent: true, otp });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.forgotOtp = forgotOtp;
const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp)
            return res.status(400).json({ message: 'Email and OTP required' });
        const user = await user_model_1.User.findOne({ email });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        if (!user.otp || !user.otpExpires)
            return res.status(400).json({ message: 'No OTP requested' });
        if (user.otp !== otp)
            return res.status(400).json({ message: 'Invalid OTP' });
        if (user.otpExpires < new Date())
            return res.status(400).json({ message: 'OTP expired' });
        // optionally clear otp after verify
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();
        return res.status(200).json({ message: 'OTP verified' });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.verifyOtp = verifyOtp;
const resetWithOtp = async (req, res) => {
    try {
        const { email, otp, password } = req.body;
        if (!email || !otp || !password)
            return res.status(400).json({ message: 'Email, OTP and new password required' });
        const user = await user_model_1.User.findOne({ email });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        if (!user.otp || !user.otpExpires)
            return res.status(400).json({ message: 'No OTP requested' });
        if (user.otp !== otp)
            return res.status(400).json({ message: 'Invalid OTP' });
        if (user.otpExpires < new Date())
            return res.status(400).json({ message: 'OTP expired' });
        const hash = await bcryptjs_1.default.hash(password, 10);
        user.password = hash;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();
        return res.status(200).json({ message: 'Password reset successful' });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.resetWithOtp = resetWithOtp;
