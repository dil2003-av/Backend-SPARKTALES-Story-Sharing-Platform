"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyPosts = exports.toggleLikePost = exports.getApprovedPosts = exports.declinePost = exports.approvePost = exports.createPost = exports.updatePost = void 0;
const mongoose_1 = require("mongoose");
const post_model_1 = __importDefault(require("../models/post.model"));
const clodinaryconfig_1 = __importDefault(require("../config/clodinaryconfig"));
const email_1 = require("../utils/email");
const notification_controller_1 = require("./notification.controller");
const uploadBufferToCloudinary = async (file) => {
    if (!file)
        return null;
    return await new Promise((resolve, reject) => {
        const stream = clodinaryconfig_1.default.uploader.upload_stream({ resource_type: "image" }, (error, result) => {
            if (error || !result)
                return reject(error || new Error("Upload failed"));
            resolve(result.secure_url);
        });
        stream.end(file.buffer);
    });
};
// UPDATE POST (AUTHOR OWNERSHIP)
const updatePost = async (req, res) => {
    try {
        const userId = req.user?.sub || req.user?._id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const { id } = req.params;
        const post = await post_model_1.default.findById(id);
        if (!post)
            return res.status(404).json({ message: "Post not found" });
        // Only the author (admin field storing author id) can edit
        const isOwner = post.admin && new mongoose_1.Types.ObjectId(post.admin).equals(new mongoose_1.Types.ObjectId(userId));
        if (!isOwner)
            return res.status(403).json({ message: "Forbidden: You can only edit your own posts" });
        const { title, content, category, tags } = req.body;
        // Optional image update via multipart upload
        const imageUrl = await uploadBufferToCloudinary(req.file);
        if (typeof title === "string")
            post.title = title;
        if (typeof content === "string")
            post.content = content;
        if (typeof category === "string")
            post.category = category;
        if (typeof tags === "string")
            post.tags = tags;
        if (imageUrl)
            post.image = imageUrl;
        // If the post was approved and author edits content, set back to PENDING for re-review
        // Only revert status when title/content/category/tags change
        const editedCoreFields = [title, content, category, tags].some((v) => typeof v === "string");
        if (editedCoreFields && post.status === "APPROVED") {
            post.status = "PENDING";
        }
        await post.save();
        res.json({ success: true, post });
    }
    catch (err) {
        console.error("updatePost error", err);
        res.status(500).json({ message: "Server Error" });
    }
};
exports.updatePost = updatePost;
const createPost = async (req, res) => {
    try {
        const userId = req.user?.sub || req.user?._id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const { title, content, category, tags } = req.body;
        if (!title || !content || !category) {
            return res.status(400).json({ message: "title, content, category are required" });
        }
        const imageUrl = (await uploadBufferToCloudinary(req.file));
        const authorObjectId = new mongoose_1.Types.ObjectId(userId);
        const payload = {
            title,
            content,
            category,
            tags: tags || "",
            image: (imageUrl ?? undefined),
            admin: authorObjectId,
            status: "PENDING",
        };
        const post = await post_model_1.default.create(payload);
        // Notify all admins about the new post submission
        try {
            await (0, notification_controller_1.createNotificationForAdmins)({
                title: "New Post Submitted",
                message: `${post.title} submitted by ${req.user?.sub || "user"}`,
                type: "info",
            });
        }
        catch (err) {
            console.warn("notify admins new post failed", err);
        }
        res.status(201).json({ success: true, post });
    }
    catch (err) {
        console.error("createPost error", err);
        res.status(500).json({ message: "Server Error" });
    }
};
exports.createPost = createPost;
// ADMIN APPROVE
const approvePost = async (req, res) => {
    try {
        const post = await post_model_1.default.findById(req.params.id).populate("admin", "email firstname lastname");
        if (!post)
            return res.status(404).json({ message: "Post not found" });
        post.status = "APPROVED";
        await post.save();
        const adminUser = post.admin;
        const recipient = adminUser?.email;
        if (recipient) {
            const name = `${adminUser?.firstname || ""} ${adminUser?.lastname || ""}`.trim();
            const { html, text } = (0, email_1.buildStatusEmail)(name, post.title, "APPROVED");
            await (0, email_1.sendEmail)(recipient, "Your post was approved", html, text);
        }
        // Notify the author in-app
        if (adminUser?._id) {
            await (0, notification_controller_1.createNotification)(adminUser._id.toString(), {
                title: "Post Approved",
                message: `Your post "${post.title}" was approved by admin`,
                type: "approved",
            });
        }
        res.json({ success: true, post });
    }
    catch (err) {
        console.error("approvePost error", err);
        res.status(500).json({ message: "Server Error" });
    }
};
exports.approvePost = approvePost;
// ADMIN DECLINE
const declinePost = async (req, res) => {
    try {
        const post = await post_model_1.default.findById(req.params.id).populate("admin", "email firstname lastname");
        if (!post)
            return res.status(404).json({ message: "Post not found" });
        post.status = "DECLINED";
        await post.save();
        const adminUser = post.admin;
        const recipient = adminUser?.email;
        if (recipient) {
            const name = `${adminUser?.firstname || ""} ${adminUser?.lastname || ""}`.trim();
            const { html, text } = (0, email_1.buildStatusEmail)(name, post.title, "DECLINED");
            await (0, email_1.sendEmail)(recipient, "Your post was declined", html, text);
        }
        // Notify the author in-app
        if (adminUser?._id) {
            await (0, notification_controller_1.createNotification)(adminUser._id.toString(), {
                title: "Post Declined",
                message: `Your post "${post.title}" was declined by admin`,
                type: "declined",
            });
        }
        res.json({ success: true, post });
    }
    catch (err) {
        console.error("declinePost error", err);
        res.status(500).json({ message: "Server Error" });
    }
};
exports.declinePost = declinePost;
// GET APPROVED ONLY → PUBLIC
const getApprovedPosts = async (req, res) => {
    const posts = await post_model_1.default.find({ status: "APPROVED" }).sort({ createdAt: -1 });
    res.json(posts);
};
exports.getApprovedPosts = getApprovedPosts;
// TOGGLE LIKE
const toggleLikePost = async (req, res) => {
    try {
        const userId = req.user?.sub || req.user?._id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const post = await post_model_1.default.findById(req.params.id);
        if (!post)
            return res.status(404).json({ message: "Post not found" });
        const userObjectId = new mongoose_1.Types.ObjectId(userId);
        const alreadyLiked = (post.likedBy || []).some((id) => id.equals(userObjectId));
        if (alreadyLiked) {
            post.likedBy = (post.likedBy || []).filter((id) => !id.equals(userObjectId));
            post.likes = Math.max((post.likes ?? 0) - 1, 0);
        }
        else {
            post.likedBy = [...(post.likedBy || []), userObjectId];
            post.likes = (post.likes ?? 0) + 1;
        }
        await post.save();
        res.json({ success: true, liked: !alreadyLiked, likes: post.likes });
    }
    catch (err) {
        console.error("toggleLikePost error", err);
        res.status(500).json({ message: "Server Error" });
    }
};
exports.toggleLikePost = toggleLikePost;
// GET MY POSTS
const getMyPosts = async (req, res) => {
    const userId = req.user?.sub || req.user?._id;
    if (!userId)
        return res.status(401).json({ message: "Unauthorized" });
    const posts = await post_model_1.default.find({ admin: userId }).sort({ createdAt: -1 });
    res.json(posts);
};
exports.getMyPosts = getMyPosts;
