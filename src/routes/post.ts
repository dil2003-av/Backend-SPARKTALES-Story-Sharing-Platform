import express from "express";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import { Role } from "../models/user.model";
import { upload } from "../middleware/upload";
import {
  createPost,
  approvePost,
  declinePost,
  getApprovedPosts,
  getMyPosts,
  toggleLikePost,
  updatePost
} from "../controllers/post.controller";

const router = express.Router();

router.post("/", authenticate, upload.single("image"), createPost);
router.get("/approved", getApprovedPosts);
router.get("/my-posts", authenticate, getMyPosts);
router.put("/:id/like", authenticate, toggleLikePost);
router.put("/:id", authenticate, upload.single("image"), updatePost);

router.put("/approve/:id", authenticate, requireRole([Role.ADMIN as Role]), approvePost);
router.put("/decline/:id", authenticate, requireRole([Role.ADMIN as Role]), declinePost);

export default router;
