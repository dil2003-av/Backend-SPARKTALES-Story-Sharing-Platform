import express from "express";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import { Role } from "../models/user.model";
import {
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getAllPostsAdmin,
  getPostStats,
  getAnalytics,
} from "../controllers/admin.controller";

const router = express.Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(requireRole([Role.ADMIN]));

// ==================== DASHBOARD ====================
router.get("/dashboard/stats", getDashboardStats);
router.get("/analytics", getAnalytics);

// ==================== USER MANAGEMENT ====================
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.put("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

// ==================== POST MANAGEMENT ====================
router.get("/posts", getAllPostsAdmin);
router.get("/posts/:id/stats", getPostStats);

export default router;
