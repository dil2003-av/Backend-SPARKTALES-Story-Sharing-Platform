"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const notification_controller_1 = require("../controllers/notification.controller");
const role_1 = require("../middleware/role");
const user_model_1 = require("../models/user.model");
const router = express_1.default.Router();
// Admin endpoints
router.get("/admin", auth_1.authenticate, (0, role_1.requireRole)([user_model_1.Role.ADMIN]), notification_controller_1.getAllNotifications);
router.patch("/admin/:id/read", auth_1.authenticate, (0, role_1.requireRole)([user_model_1.Role.ADMIN]), notification_controller_1.markNotificationReadAdmin);
router.delete("/admin/:id", auth_1.authenticate, (0, role_1.requireRole)([user_model_1.Role.ADMIN]), notification_controller_1.deleteNotificationAdmin);
// User endpoints
router.get("/", auth_1.authenticate, notification_controller_1.getMyNotifications);
router.patch("/:id/read", auth_1.authenticate, notification_controller_1.markNotificationRead);
router.delete("/", auth_1.authenticate, notification_controller_1.clearNotifications);
exports.default = router;
