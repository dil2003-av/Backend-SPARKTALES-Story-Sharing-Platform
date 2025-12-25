import { Request, Response } from "express";
import { Types } from "mongoose";
import Post, { IPost } from "../models/post.model";
import cloudinary from "../config/clodinaryconfig";
import { AUthRequest } from "../middleware/auth";
import { sendEmail, buildStatusEmail } from "../utils/email";
import { IUSER } from "../models/user.model";
import { createNotification, createNotificationForAdmins } from "./notification.controller";

const uploadBufferToCloudinary = async (file?: Express.Multer.File): Promise<string | null> => {
  if (!file) return null;

  return await new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ resource_type: "image" }, (error, result) => {
      if (error || !result) return reject(error || new Error("Upload failed"));
      resolve(result.secure_url);
    });

    stream.end(file.buffer);
  });
};

// UPDATE POST (AUTHOR OWNERSHIP)
export const updatePost = async (req: AUthRequest, res: Response) => {
  try {
    const userId = req.user?.sub || req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Only the author (admin field storing author id) can edit
    const isOwner = post.admin && new Types.ObjectId(post.admin).equals(new Types.ObjectId(userId));
    if (!isOwner) return res.status(403).json({ message: "Forbidden: You can only edit your own posts" });

    const { title, content, category, tags } = req.body as Partial<IPost>;

    // Optional image update via multipart upload
    const imageUrl = await uploadBufferToCloudinary(req.file as Express.Multer.File | undefined);

    if (typeof title === "string") post.title = title;
    if (typeof content === "string") post.content = content;
    if (typeof category === "string") post.category = category;
    if (typeof tags === "string") post.tags = tags;
    if (imageUrl) post.image = imageUrl;

    // If the post was approved and author edits content, set back to PENDING for re-review
    // Only revert status when title/content/category/tags change
    const editedCoreFields = [title, content, category, tags].some((v) => typeof v === "string");
    if (editedCoreFields && post.status === "APPROVED") {
      post.status = "PENDING";
    }

    await post.save();

    res.json({ success: true, post });
  } catch (err) {
    console.error("updatePost error", err);
    res.status(500).json({ message: "Server Error" });
  }
};

export const createPost = async (req: AUthRequest, res: Response) => {
  try {
    const userId = req.user?.sub || req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { title, content, category, tags } = req.body;
    if (!title || !content || !category) {
      return res.status(400).json({ message: "title, content, category are required" });
    }

    const imageUrl = (await uploadBufferToCloudinary(req.file as Express.Multer.File | undefined)) as string | null;

    const authorObjectId = new Types.ObjectId(userId);

    const payload: Partial<IPost> = {
      title,
      content,
      category,
      tags: tags || "",
      image: (imageUrl ?? undefined) as string | undefined,
      admin: authorObjectId,
      status: "PENDING",
    };

    const post = await Post.create(payload as IPost);

    // Notify all admins about the new post submission
    try {
      await createNotificationForAdmins({
        title: "New Post Submitted",
        message: `${post.title} submitted by ${req.user?.sub || "user"}`,
        type: "info",
      });
    } catch (err) {
      console.warn("notify admins new post failed", err);
    }

    res.status(201).json({ success: true, post });
  } catch (err) {
    console.error("createPost error", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// ADMIN APPROVE
export const approvePost = async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.id).populate("admin", "email firstname lastname");
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.status = "APPROVED";
    await post.save();

    const adminUser = post.admin as unknown as Partial<IUSER> | null;
    const recipient = adminUser?.email;
    if (recipient) {
      const name = `${adminUser?.firstname || ""} ${adminUser?.lastname || ""}`.trim();
      const { html, text } = buildStatusEmail(name, post.title, "APPROVED");
      await sendEmail(recipient, "Your post was approved", html, text);
    }

    // Notify the author in-app
    if (adminUser?._id) {
      await createNotification(adminUser._id.toString(), {
        title: "Post Approved",
        message: `Your post "${post.title}" was approved by admin`,
        type: "approved",
      });
    }

    res.json({ success: true, post });
  } catch (err) {
    console.error("approvePost error", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// ADMIN DECLINE
export const declinePost = async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.id).populate("admin", "email firstname lastname");
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.status = "DECLINED";
    await post.save();

    const adminUser = post.admin as unknown as Partial<IUSER> | null;
    const recipient = adminUser?.email;
    if (recipient) {
      const name = `${adminUser?.firstname || ""} ${adminUser?.lastname || ""}`.trim();
      const { html, text } = buildStatusEmail(name, post.title, "DECLINED");
      await sendEmail(recipient, "Your post was declined", html, text);
    }

    // Notify the author in-app
    if (adminUser?._id) {
      await createNotification(adminUser._id.toString(), {
        title: "Post Declined",
        message: `Your post "${post.title}" was declined by admin`,
        type: "declined",
      });
    }

    res.json({ success: true, post });
  } catch (err) {
    console.error("declinePost error", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// GET APPROVED ONLY → PUBLIC
export const getApprovedPosts = async (req: Request, res: Response) => {
  const posts = await Post.find({ status: "APPROVED" }).sort({ createdAt: -1 });
  res.json(posts);
};

// TOGGLE LIKE
export const toggleLikePost = async (req: AUthRequest, res: Response) => {
  try {
    const userId = req.user?.sub || req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userObjectId = new Types.ObjectId(userId);
    const alreadyLiked = (post.likedBy || []).some((id) => id.equals(userObjectId));

    if (alreadyLiked) {
      post.likedBy = (post.likedBy || []).filter((id) => !id.equals(userObjectId));
      post.likes = Math.max((post.likes ?? 0) - 1, 0);
    } else {
      post.likedBy = [...(post.likedBy || []), userObjectId];
      post.likes = (post.likes ?? 0) + 1;
    }

    await post.save();

    res.json({ success: true, liked: !alreadyLiked, likes: post.likes });
  } catch (err) {
    console.error("toggleLikePost error", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// GET MY POSTS
export const getMyPosts = async (req: AUthRequest, res: Response) => {
  const userId = req.user?.sub || req.user?._id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const posts = await Post.find({ admin: userId }).sort({ createdAt: -1 });
  res.json(posts);
};
