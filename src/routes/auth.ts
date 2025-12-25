import { Router } from "express"
import {
  getMyProfile,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  forgotOtp,
  verifyOtp,
  resetWithOtp,
  registerAdmin,
  registerUser
} from "../controllers/auth.controler"
import { authenticate } from "../middleware/auth"
import { requireRole } from "../middleware/role"
import { Role } from "../models/user.model"

const router = Router()

// register (only USER) - public
router.post("/register", registerUser)

router.post("/refresh",refreshToken)

// forgot / reset password
router.post("/forgot", forgotPassword)
router.post("/reset", resetPassword)

// otp flow
router.post("/forgot-otp", forgotOtp)
router.post("/verify-otp", verifyOtp)
router.post("/reset-otp", resetWithOtp)

// login - public
router.post("/login", login)

// register (ADMIN) - Admin only
router.post(
  "/admin/register",
  authenticate,
  requireRole([Role.ADMIN]),
  registerAdmin
)

// me - Admin or User both
router.get("/me", authenticate, getMyProfile)

// router.get("/test", authenticate, () => {})

export default router
