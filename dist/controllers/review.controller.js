"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReviewById = exports.deleteReview = exports.declineReview = exports.approveReview = exports.updateReview = exports.getMyReviews = exports.getReviewsByPostId = exports.getAllReviews = exports.createReview = void 0;
const review_model_1 = __importDefault(require("../models/review.model"));
const notification_controller_1 = require("./notification.controller");
// Create review (only approved posts allowed)
const createReview = async (req, res) => {
    try {
        const { post, rating, comment, name: bodyName } = req.body || {};
        // Validation
        if (!post || !rating || !comment) {
            return res.status(400).json({ message: "Missing required fields: post, rating, comment" });
        }
        // Get name from request body or from user token
        const name = bodyName || req.user?.name || req.user?.username || "Anonymous";
        if (!name) {
            return res.status(400).json({ message: "Name is required" });
        }
        const newReview = await review_model_1.default.create({
            post,
            rating,
            comment,
            name,
            status: "PENDING",
        });
        try {
            await (0, notification_controller_1.createNotificationForAdmins)({
                title: "New Review",
                message: `${name} left a review (rating ${rating})`,
                type: "info",
            });
        }
        catch (err) {
            console.warn("notify admins review failed", err);
        }
        res.status(201).json(newReview);
    }
    catch (err) {
        console.error("Error creating review:", err.message);
        res.status(500).json({ message: "Failed to create review", error: err.message });
    }
};
exports.createReview = createReview;
// Get all reviews (paginated)
const getAllReviews = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const status = req.query.status || undefined;
        const query = {};
        if (status && ["PENDING", "APPROVED", "DECLINED"].includes(status)) {
            query.status = status;
        }
        const reviews = await review_model_1.default.find(query)
            .populate("post", "title category")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        res.status(200).json(reviews);
    }
    catch (err) {
        console.error("Error fetching reviews:", err.message);
        res.status(500).json({ message: "Failed to fetch reviews", error: err.message });
    }
};
exports.getAllReviews = getAllReviews;
// Get reviews for a specific post
const getReviewsByPostId = async (req, res) => {
    try {
        const { postId } = req.params;
        const reviews = await review_model_1.default.find({ post: postId })
            .sort({ createdAt: -1 });
        res.status(200).json(reviews);
    }
    catch (err) {
        console.error("Error fetching post reviews:", err.message);
        res.status(500).json({ message: "Failed to fetch post reviews", error: err.message });
    }
};
exports.getReviewsByPostId = getReviewsByPostId;
// Get logged-in user's reviews
const getMyReviews = async (req, res) => {
    try {
        const name = req.user.name;
        const reviews = await review_model_1.default.find({ name }).sort({ createdAt: -1 });
        res.status(200).json(reviews);
    }
    catch (err) {
        console.error("Error fetching user reviews:", err.message);
        res.status(500).json({ message: "Failed to fetch user reviews", error: err.message });
    }
};
exports.getMyReviews = getMyReviews;
// Update review
const updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await review_model_1.default.findByIdAndUpdate(id, req.body, {
            new: true,
        });
        res.status(200).json(updated);
    }
    catch (err) {
        console.error("Error updating review:", err.message);
        res.status(500).json({ message: "Failed to update review", error: err.message });
    }
};
exports.updateReview = updateReview;
// Approve review (ADMIN only)
const approveReview = async (req, res) => {
    try {
        const { id } = req.params;
        const review = await review_model_1.default.findByIdAndUpdate(id, { status: "APPROVED" }, { new: true });
        if (!review)
            return res.status(404).json({ message: "Review not found" });
        res.status(200).json(review);
    }
    catch (err) {
        console.error("Error approving review:", err.message);
        res.status(500).json({ message: "Failed to approve review", error: err.message });
    }
};
exports.approveReview = approveReview;
// Decline review (ADMIN only)
const declineReview = async (req, res) => {
    try {
        const { id } = req.params;
        const review = await review_model_1.default.findByIdAndUpdate(id, { status: "DECLINED" }, { new: true });
        if (!review)
            return res.status(404).json({ message: "Review not found" });
        res.status(200).json(review);
    }
    catch (err) {
        console.error("Error declining review:", err.message);
        res.status(500).json({ message: "Failed to decline review", error: err.message });
    }
};
exports.declineReview = declineReview;
// Delete review
const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        await review_model_1.default.findByIdAndDelete(id);
        res.status(200).json({ message: "Review deleted" });
    }
    catch (err) {
        console.error("Error deleting review:", err.message);
        res.status(500).json({ message: "Failed to delete review", error: err.message });
    }
};
exports.deleteReview = deleteReview;
// Get single review by ID
const getReviewById = async (req, res) => {
    try {
        const review = await review_model_1.default.findById(req.params.id);
        res.status(200).json(review);
    }
    catch (err) {
        console.error("Error fetching review:", err.message);
        res.status(500).json({ message: "Failed to fetch review", error: err.message });
    }
};
exports.getReviewById = getReviewById;
