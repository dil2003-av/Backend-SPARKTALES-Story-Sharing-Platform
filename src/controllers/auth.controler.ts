import { Request, Response } from "express";
import type { Express } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import { IUSER, Role, User } from "../models/user.model";
import { createNotificationForAdmins } from "./notification.controller";
import { signAccessToken, signRefreshToken } from "../utils/tokens";
import { AUthRequest } from "../middleware/auth";
import sendMail from "../utils/mailer"
import cloudinary from "../config/clodinaryconfig";

dotenv.config();

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;
const JWT_RESET_SECRET = process.env.JWT_RESET_SECRET || process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

const uploadBufferToCloudinary = async (file?: Express.Multer.File): Promise<string | null> => {
  if (!file) return null;

  return await new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ resource_type: "image" }, (error, result) => {
      if (error || !result) return reject(error || new Error("Upload failed"));
      resolve(result.secure_url);
    });

    stream.end(file.buffer);
  });
};

// -------------------- REGISTER USER --------------------
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email, password, firstname, lastname } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email exists" });

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      firstname,
      lastname,
      password: hash,
      roles: [Role.USER],
    });

    res.status(201).json({
      message: "User registered",
      data: { email: user.email, roles: user.roles },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// -------------------- LOGIN --------------------
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const existingUser = (await User.findOne({ email })) as IUSER | null;
    if (!existingUser) return res.status(401).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, existingUser.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = signAccessToken(existingUser);
    const refreshToken = signRefreshToken(existingUser);

    // Notify admins of user login activity
    try {
      await createNotificationForAdmins({
        title: "User Login",
        message: `${existingUser.email} logged in`,
        type: "info",
      });
    } catch (err) {
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// -------------------- REGISTER ADMIN --------------------
export const registerAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email exists" });

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hash,
      roles: [Role.ADMIN],
    });

    res.status(201).json({
      message: "Admin registered",
      data: { email: user.email, roles: user.roles },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// -------------------- GET MY PROFILE --------------------
export const getMyProfile = async (req: AUthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(req.user.sub).select("-password -otp -otpExpires");
    if (!user) return res.status(404).json({ message: "User not found" });

    const { email, roles, _id, firstname, lastname, phone, address, avatarUrl, createdAt, approved } = user as IUSER & { createdAt?: Date };
    res.status(200).json({
      message: "ok",
      data: { id: _id, email, roles, firstname, lastname, phone, address, avatarUrl, createdAt, approved }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// -------------------- UPDATE MY PROFILE --------------------
export const updateMyProfile = async (req: AUthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(req.user.sub).select("-password -otp -otpExpires");
    if (!user) return res.status(404).json({ message: "User not found" });

    const { firstname, lastname, phone, address } = req.body as Partial<IUSER>;

    if (typeof firstname === "string") user.firstname = firstname;
    if (typeof lastname === "string") user.lastname = lastname;
    if (typeof phone === "string") user.phone = phone;
    if (typeof address === "string") user.address = address;

    const avatarUrl = await uploadBufferToCloudinary(req.file as Express.Multer.File | undefined);
    if (avatarUrl) user.avatarUrl = avatarUrl;

    await user.save();

    const { email, roles, _id, createdAt, approved } = user as IUSER & { createdAt?: Date };
    res.status(200).json({
      message: "Profile updated",
      data: { id: _id, email, roles, firstname: user.firstname, lastname: user.lastname, phone: user.phone, address: user.address, avatarUrl: user.avatarUrl, createdAt, approved }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// -------------------- REFRESH TOKEN --------------------
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Token required" });

    if (!JWT_REFRESH_SECRET) throw new Error("JWT_REFRESH_SECRET missing");

    const payload = jwt.verify(token, JWT_REFRESH_SECRET) as { sub: string };

    const user = await User.findById(payload.sub);
    if (!user) return res.status(403).json({ message: "Invalid refresh token" });

    const accessToken = signAccessToken(user);

    res.status(200).json({ accessToken });
  } catch (err) {
    console.error(err);
    res.status(403).json({ message: "Invalid or expired token" });
  }
};

// -------------------- FORGOT / RESET PASSWORD --------------------
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: "Email required" })

    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ message: "User not found" })

    const token = jwt.sign({ sub: user._id.toString() }, JWT_RESET_SECRET as string, { expiresIn: '15m' })

    // In production you'd email the token. For now, return the token for dev/testing.
    return res.status(200).json({ message: 'Password reset token generated', resetToken: token })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body
    if (!token || !password) return res.status(400).json({ message: 'Token and new password required' })

    const payload: any = jwt.verify(token, JWT_RESET_SECRET as string)
    const user = await User.findById(payload.sub)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const hash = await bcrypt.hash(password, 10)
    user.password = hash
    await user.save()

    return res.status(200).json({ message: 'Password reset successful' })
  } catch (err) {
    console.error(err)
    return res.status(400).json({ message: 'Invalid or expired token' })
  }
}

// -------------------- OTP (email) password reset --------------------
export const forgotOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: 'Email required' })

    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ message: 'User not found' })

    // generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = new Date(Date.now() + 1000 * 60 * 10) // 10 minutes

    user.otp = otp
    user.otpExpires = expires
    await user.save()

    // send email (if configured)
    const html = `<p>Your SparkTales password reset code: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`
    try {
      await sendMail(user.email, 'SparkTales password reset code', html)
    } catch (mailErr) {
      console.warn('Mail send failed', mailErr)
    }

    // For dev convenience, return OTP in response if SMTP not configured
    return res.status(200).json({ message: 'OTP sent if email configured', otpSent: true, otp })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' })

    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ message: 'User not found' })

    if (!user.otp || !user.otpExpires) return res.status(400).json({ message: 'No OTP requested' })
    if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' })
    if (user.otpExpires < new Date()) return res.status(400).json({ message: 'OTP expired' })

    // optionally clear otp after verify
    user.otp = undefined as any
    user.otpExpires = undefined as any
    await user.save()

    return res.status(200).json({ message: 'OTP verified' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export const resetWithOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp, password } = req.body
    if (!email || !otp || !password) return res.status(400).json({ message: 'Email, OTP and new password required' })

    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ message: 'User not found' })

    if (!user.otp || !user.otpExpires) return res.status(400).json({ message: 'No OTP requested' })
    if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' })
    if (user.otpExpires < new Date()) return res.status(400).json({ message: 'OTP expired' })

    const hash = await bcrypt.hash(password, 10)
    user.password = hash
    user.otp = undefined as any
    user.otpExpires = undefined as any
    await user.save()

    return res.status(200).json({ message: 'Password reset successful' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
