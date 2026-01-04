"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkApprovedPost = void 0;
const post_model_1 = __importDefault(require("../models/post.model"));
const checkApprovedPost = async (req, res, next) => {
    try {
        const { post } = req.body || {}; // must match Review model
        if (!post) {
            return res.status(400).json({ message: "Post ID is required in request body" });
        }
        const postData = await post_model_1.default.findById(post);
        if (!postData) {
            return res.status(404).json({ message: "Post not found" });
        }
        if (postData.status !== "APPROVED") {
            return res.status(400).json({
                message: "You can only review Admin-approved posts",
            });
        }
        next();
    }
    catch (err) {
        console.error("Error in checkApprovedPost middleware:", err.message);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
exports.checkApprovedPost = checkApprovedPost;
