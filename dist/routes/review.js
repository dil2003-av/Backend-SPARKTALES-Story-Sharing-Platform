"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const review_controller_1 = require("../controllers/review.controller");
const auth_1 = require("../middleware/auth");
const role_1 = require("../middleware/role");
const user_model_1 = require("../models/user.model");
const checkApprovedPost_1 = require("../middleware/checkApprovedPost");
const router = (0, express_1.Router)();
router.get("/", review_controller_1.getAllReviews);
router.get("/post/:postId", review_controller_1.getReviewsByPostId);
router.get("/my-reviews", auth_1.authenticate, review_controller_1.getMyReviews);
router.get("/:id", review_controller_1.getReviewById);
// Review only if post APPROVED
router.post("/", auth_1.authenticate, checkApprovedPost_1.checkApprovedPost, review_controller_1.createReview);
router.put("/:id", auth_1.authenticate, review_controller_1.updateReview);
router.delete("/:id", auth_1.authenticate, review_controller_1.deleteReview);
// Admin moderation endpoints
router.patch("/:id/approve", auth_1.authenticate, (0, role_1.requireRole)([user_model_1.Role.ADMIN]), review_controller_1.approveReview);
router.patch("/:id/decline", auth_1.authenticate, (0, role_1.requireRole)([user_model_1.Role.ADMIN]), review_controller_1.declineReview);
exports.default = router;
