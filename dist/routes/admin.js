"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const role_1 = require("../middleware/role");
const user_model_1 = require("../models/user.model");
const admin_controller_1 = require("../controllers/admin.controller");
const router = express_1.default.Router();
// All admin routes require authentication and ADMIN role
router.use(auth_1.authenticate);
router.use((0, role_1.requireRole)([user_model_1.Role.ADMIN]));
// ==================== DASHBOARD ====================
router.get("/dashboard/stats", admin_controller_1.getDashboardStats);
router.get("/analytics", admin_controller_1.getAnalytics);
// ==================== USER MANAGEMENT ====================
router.get("/users", admin_controller_1.getAllUsers);
router.get("/users/:id", admin_controller_1.getUserById);
router.put("/users/:id/role", admin_controller_1.updateUserRole);
router.delete("/users/:id", admin_controller_1.deleteUser);
// ==================== POST MANAGEMENT ====================
router.get("/posts", admin_controller_1.getAllPostsAdmin);
router.get("/posts/:id/stats", admin_controller_1.getPostStats);
exports.default = router;
