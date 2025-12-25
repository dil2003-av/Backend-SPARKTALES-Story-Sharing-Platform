import express from "express"
import { authenticate } from "../middleware/auth"
import {
  clearNotifications,
  deleteNotificationAdmin,
  getAllNotifications,
  getMyNotifications,
  markNotificationRead,
  markNotificationReadAdmin
} from "../controllers/notification.controller"
import { requireRole } from "../middleware/role"
import { Role } from "../models/user.model"

const router = express.Router()

// Admin endpoints
router.get("/admin", authenticate, requireRole([Role.ADMIN]), getAllNotifications)
router.patch("/admin/:id/read", authenticate, requireRole([Role.ADMIN]), markNotificationReadAdmin)
router.delete("/admin/:id", authenticate, requireRole([Role.ADMIN]), deleteNotificationAdmin)

// User endpoints
router.get("/", authenticate, getMyNotifications)
router.patch("/:id/read", authenticate, markNotificationRead)
router.delete("/", authenticate, clearNotifications)

export default router
