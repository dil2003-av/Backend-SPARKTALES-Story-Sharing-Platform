import { Request, Response, NextFunction } from "express";
import Post from "../models/post.model";

export const checkApprovedPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { post } = req.body || {}; // must match Review model

    if (!post) {
      return res.status(400).json({ message: "Post ID is required in request body" });
    }

    const postData = await Post.findById(post);

    if (!postData) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (postData.status !== "APPROVED") {
      return res.status(400).json({
        message: "You can only review Admin-approved posts",
      });
    }

    next();
  } catch (err: any) {
    console.error("Error in checkApprovedPost middleware:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
