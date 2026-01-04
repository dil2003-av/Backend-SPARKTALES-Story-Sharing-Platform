"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnalytics = exports.getPostStats = exports.getAllPostsAdmin = exports.deleteUser = exports.updateUserRole = exports.getUserById = exports.getAllUsers = exports.getDashboardStats = void 0;
const post_model_1 = __importDefault(require("../models/post.model"));
const user_model_1 = require("../models/user.model");
// ==================== DASHBOARD STATISTICS ====================
const getDashboardStats = async (req, res) => {
    try {
        // Get post statistics
        const totalPosts = await post_model_1.default.countDocuments();
        const pendingPosts = await post_model_1.default.countDocuments({ status: "PENDING" });
        const approvedPosts = await post_model_1.default.countDocuments({ status: "APPROVED" });
        const declinedPosts = await post_model_1.default.countDocuments({ status: "DECLINED" });
        // Get user statistics
        const totalUsers = await user_model_1.User.countDocuments();
        const adminUsers = await user_model_1.User.countDocuments({ roles: "ADMIN" });
        const authorUsers = await user_model_1.User.countDocuments({ roles: "AUTHOR" });
        const regularUsers = await user_model_1.User.countDocuments({ roles: "USER" });
        // Get total views and likes
        const postsWithStats = await post_model_1.default.aggregate([
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: { $ifNull: ["$views", 0] } },
                    totalLikes: { $sum: { $ifNull: ["$likes", 0] } },
                },
            },
        ]);
        const totalViews = postsWithStats[0]?.totalViews || 0;
        const totalLikes = postsWithStats[0]?.totalLikes || 0;
        // Category distribution
        const categoryDistribution = await post_model_1.default.aggregate([
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { count: -1 },
            },
        ]);
        // Recent posts
        const recentPosts = await post_model_1.default.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select("title category status createdAt views likes")
            .populate("admin", "email firstname lastname");
        // Posts per day for the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const postsPerDay = await post_model_1.default.aggregate([
            {
                $match: {
                    createdAt: { $gte: sevenDaysAgo },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                    },
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { _id: 1 },
            },
        ]);
        res.json({
            success: true,
            data: {
                posts: {
                    total: totalPosts,
                    pending: pendingPosts,
                    approved: approvedPosts,
                    declined: declinedPosts,
                },
                users: {
                    total: totalUsers,
                    admins: adminUsers,
                    authors: authorUsers,
                    regular: regularUsers,
                },
                engagement: {
                    totalViews,
                    totalLikes,
                },
                categoryDistribution,
                recentPosts,
                postsPerDay,
            },
        });
    }
    catch (err) {
        console.error("getDashboardStats error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};
exports.getDashboardStats = getDashboardStats;
// ==================== USER MANAGEMENT ====================
const getAllUsers = async (req, res) => {
    try {
        const users = await user_model_1.User.find()
            .select("-password -otp -otpExpires")
            .sort({ createdAt: -1 });
        res.json({
            success: true,
            count: users.length,
            data: users,
        });
    }
    catch (err) {
        console.error("getAllUsers error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};
exports.getAllUsers = getAllUsers;
const getUserById = async (req, res) => {
    try {
        const user = await user_model_1.User.findById(req.params.id).select("-password -otp -otpExpires");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Get user's posts
        const posts = await post_model_1.default.find({ admin: req.params.id })
            .select("title category status createdAt views likes")
            .sort({ createdAt: -1 });
        res.json({
            success: true,
            data: {
                user,
                posts,
                stats: {
                    totalPosts: posts.length,
                    approvedPosts: posts.filter((p) => p.status === "APPROVED").length,
                    pendingPosts: posts.filter((p) => p.status === "PENDING").length,
                },
            },
        });
    }
    catch (err) {
        console.error("getUserById error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};
exports.getUserById = getUserById;
const updateUserRole = async (req, res) => {
    try {
        const { roles } = req.body;
        if (!roles || !Array.isArray(roles)) {
            return res.status(400).json({ message: "Invalid roles array" });
        }
        const user = await user_model_1.User.findByIdAndUpdate(req.params.id, { roles }, { new: true }).select("-password -otp -otpExpires");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({
            success: true,
            message: "User role updated",
            data: user,
        });
    }
    catch (err) {
        console.error("updateUserRole error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};
exports.updateUserRole = updateUserRole;
const deleteUser = async (req, res) => {
    try {
        const user = await user_model_1.User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Optionally delete user's posts
        await post_model_1.default.deleteMany({ admin: req.params.id });
        res.json({
            success: true,
            message: "User and their posts deleted",
        });
    }
    catch (err) {
        console.error("deleteUser error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};
exports.deleteUser = deleteUser;
// ==================== POST MANAGEMENT ====================
const getAllPostsAdmin = async (req, res) => {
    try {
        const { status, category, search, page = 1, limit = 100 } = req.query;
        const filter = {};
        if (status && status !== "all") {
            filter.status = status;
        }
        if (category) {
            filter.category = category;
        }
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: "i" } },
                { content: { $regex: search, $options: "i" } },
            ];
        }
        const skip = (Number(page) - 1) * Number(limit);
        const posts = await post_model_1.default.find(filter)
            .populate("admin", "email firstname lastname")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = await post_model_1.default.countDocuments(filter);
        res.json({
            success: true,
            count: posts.length,
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
            data: posts,
        });
    }
    catch (err) {
        console.error("getAllPostsAdmin error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};
exports.getAllPostsAdmin = getAllPostsAdmin;
const getPostStats = async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await post_model_1.default.findById(postId).populate("admin", "email firstname lastname");
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        // Get likes info
        const likedByUsers = await user_model_1.User.find({
            _id: { $in: post.likedBy },
        }).select("email firstname lastname");
        res.json({
            success: true,
            data: {
                post,
                likedByUsers,
                stats: {
                    likes: post.likes || 0,
                    views: post.views || 0,
                    uniqueLikes: post.likedBy?.length || 0,
                },
            },
        });
    }
    catch (err) {
        console.error("getPostStats error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};
exports.getPostStats = getPostStats;
// ==================== ANALYTICS ====================
const getAnalytics = async (req, res) => {
    try {
        const { period = "week" } = req.query;
        let daysAgo = 7;
        if (period === "month")
            daysAgo = 30;
        if (period === "year")
            daysAgo = 365;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);
        // Posts created over time
        const postsOverTime = await post_model_1.default.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                    },
                    count: { $sum: 1 },
                    approved: {
                        $sum: { $cond: [{ $eq: ["$status", "APPROVED"] }, 1, 0] },
                    },
                    pending: {
                        $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] },
                    },
                    declined: {
                        $sum: { $cond: [{ $eq: ["$status", "DECLINED"] }, 1, 0] },
                    },
                },
            },
            {
                $sort: { _id: 1 },
            },
        ]);
        // Top categories
        const topCategories = await post_model_1.default.aggregate([
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 },
                    totalViews: { $sum: { $ifNull: ["$views", 0] } },
                    totalLikes: { $sum: { $ifNull: ["$likes", 0] } },
                },
            },
            {
                $sort: { count: -1 },
            },
            {
                $limit: 10,
            },
        ]);
        // Top authors
        const topAuthors = await post_model_1.default.aggregate([
            {
                $group: {
                    _id: "$admin",
                    postCount: { $sum: 1 },
                    totalViews: { $sum: { $ifNull: ["$views", 0] } },
                    totalLikes: { $sum: { $ifNull: ["$likes", 0] } },
                },
            },
            {
                $sort: { postCount: -1 },
            },
            {
                $limit: 10,
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "author",
                },
            },
            {
                $unwind: "$author",
            },
            {
                $project: {
                    email: "$author.email",
                    firstname: "$author.firstname",
                    lastname: "$author.lastname",
                    postCount: 1,
                    totalViews: 1,
                    totalLikes: 1,
                },
            },
        ]);
        // Most liked posts
        const mostLikedPosts = await post_model_1.default.find()
            .sort({ likes: -1 })
            .limit(10)
            .populate("admin", "email firstname lastname")
            .select("title category likes views createdAt");
        // Most viewed posts
        const mostViewedPosts = await post_model_1.default.find()
            .sort({ views: -1 })
            .limit(10)
            .populate("admin", "email firstname lastname")
            .select("title category likes views createdAt");
        res.json({
            success: true,
            data: {
                postsOverTime,
                topCategories,
                topAuthors,
                mostLikedPosts,
                mostViewedPosts,
            },
        });
    }
    catch (err) {
        console.error("getAnalytics error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};
exports.getAnalytics = getAnalytics;
