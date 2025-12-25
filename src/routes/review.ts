import express, { Router } from "express";
import {
  createReview,
  getAllReviews,
  getReviewsByPostId,
  getReviewById,
  updateReview,
  deleteReview,
  getMyReviews,
  approveReview,
  declineReview,
} from "../controllers/review.controller";

import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import { Role } from "../models/user.model";
import { checkApprovedPost } from "../middleware/checkApprovedPost";

const router = Router();

router.get("/", getAllReviews);
router.get("/post/:postId", getReviewsByPostId);
router.get("/my-reviews", authenticate, getMyReviews);
router.get("/:id", getReviewById);

// Review only if post APPROVED
router.post("/", authenticate, checkApprovedPost, createReview);

router.put("/:id", authenticate, updateReview);
router.delete("/:id", authenticate, deleteReview);

// Admin moderation endpoints
router.patch("/:id/approve", authenticate, requireRole([Role.ADMIN]), approveReview);
router.patch("/:id/decline", authenticate, requireRole([Role.ADMIN]), declineReview);

export default router;
