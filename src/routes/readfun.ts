import express from "express";
import {
  getReadFunPosts,
  getSingleReadFunPost,
  incrementReadFunViews,
  getTrendingReadFun,
  getCategoryReadFun,
  searchReadFun,
  createTestReadFunPosts
} from "../controllers/ReadFunController";

const router = express.Router();

router.get("/", getReadFunPosts);
router.get("/post/:id", getSingleReadFunPost);
router.post("/post/:id/view", incrementReadFunViews);
router.get("/trending", getTrendingReadFun);
router.get("/category/:category", getCategoryReadFun);
router.get("/search", searchReadFun);
router.post("/test-data/create", createTestReadFunPosts);

export default router;
