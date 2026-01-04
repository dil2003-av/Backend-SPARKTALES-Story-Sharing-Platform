"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controler_1 = require("../controllers/auth.controler");
const auth_1 = require("../middleware/auth");
const role_1 = require("../middleware/role");
const user_model_1 = require("../models/user.model");
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
// register (only USER) - public
router.post("/register", auth_controler_1.registerUser);
router.post("/refresh", auth_controler_1.refreshToken);
// forgot / reset password
router.post("/forgot", auth_controler_1.forgotPassword);
router.post("/reset", auth_controler_1.resetPassword);
// otp flow
router.post("/forgot-otp", auth_controler_1.forgotOtp);
router.post("/verify-otp", auth_controler_1.verifyOtp);
router.post("/reset-otp", auth_controler_1.resetWithOtp);
// login - public
router.post("/login", auth_controler_1.login);
// register (ADMIN) - Admin only
router.post("/admin/register", auth_1.authenticate, (0, role_1.requireRole)([user_model_1.Role.ADMIN]), auth_controler_1.registerAdmin);
// me - Admin or User both
router.get("/me", auth_1.authenticate, auth_controler_1.getMyProfile);
// update my profile
router.put("/profile", auth_1.authenticate, upload_1.upload.single("avatar"), auth_controler_1.updateMyProfile);
// router.get("/test", authenticate, () => {})
exports.default = router;
