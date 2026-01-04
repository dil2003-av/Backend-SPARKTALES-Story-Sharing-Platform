"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestReadFunPosts = exports.searchReadFun = exports.getCategoryReadFun = exports.getTrendingReadFun = exports.incrementReadFunViews = exports.getSingleReadFunPost = exports.getReadFunPosts = void 0;
const readfun_model_1 = __importDefault(require("../models/readfun.model"));
// ---------------------------
// GET ALL APPROVED POSTS (READ & FUN PAGE)
// ---------------------------
const getReadFunPosts = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search || "";
        const category = req.query.category || "all";
        const filter = { status: "approved" };
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: "i" } },
                { tags: { $regex: search, $options: "i" } },
            ];
        }
        if (category !== "all") {
            filter.category = category;
        }
        const posts = await readfun_model_1.default.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);
        const count = await readfun_model_1.default.countDocuments(filter);
        res.json({
            success: true,
            data: posts,
            pagination: {
                total: count,
                page,
                limit,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to load posts", error });
    }
};
exports.getReadFunPosts = getReadFunPosts;
// ---------------------------
// GET SINGLE APPROVED POST
// ---------------------------
const getSingleReadFunPost = async (req, res) => {
    try {
        const post = await readfun_model_1.default.findOne({
            _id: req.params.id,
            status: "approved",
        });
        if (!post) {
            return res.status(404).json({ message: "Post not found or not approved" });
        }
        res.json({ success: true, data: post });
    }
    catch (error) {
        res.status(500).json({ message: "Error", error });
    }
};
exports.getSingleReadFunPost = getSingleReadFunPost;
// ---------------------------
// ADD VIEW COUNT
// ---------------------------
const incrementReadFunViews = async (req, res) => {
    try {
        const updatedPost = await readfun_model_1.default.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true });
        res.json({ success: true, data: updatedPost });
    }
    catch (error) {
        res.status(500).json({ message: "Error", error });
    }
};
exports.incrementReadFunViews = incrementReadFunViews;
// ---------------------------
// TRENDING POSTS (BASED ON VIEWS)
// ---------------------------
const getTrendingReadFun = async (req, res) => {
    try {
        const posts = await readfun_model_1.default.find({ status: "approved" })
            .sort({ views: -1 })
            .limit(10);
        res.json({ success: true, data: posts });
    }
    catch (error) {
        res.status(500).json({ message: "Error", error });
    }
};
exports.getTrendingReadFun = getTrendingReadFun;
// ---------------------------
// CATEGORY FILTER ONLY APPROVED
// ---------------------------
const getCategoryReadFun = async (req, res) => {
    try {
        const posts = await readfun_model_1.default.find({
            category: req.params.category,
            status: "approved",
        });
        res.json({ success: true, data: posts });
    }
    catch (error) {
        res.status(500).json({ message: "Error", error });
    }
};
exports.getCategoryReadFun = getCategoryReadFun;
// ---------------------------
// SEARCH ONLY APPROVED POSTS
// ---------------------------
const searchReadFun = async (req, res) => {
    try {
        const query = req.query.q;
        const posts = await readfun_model_1.default.find({
            status: "approved",
            $or: [
                { title: { $regex: query, $options: "i" } },
                { tags: { $regex: query, $options: "i" } },
            ],
        });
        res.json({ success: true, data: posts });
    }
    catch (error) {
        res.status(500).json({ message: "Error", error });
    }
};
exports.searchReadFun = searchReadFun;
// ---------------------------
// CREATE TEST DATA (for development)
// ---------------------------
const createTestReadFunPosts = async (req, res) => {
    try {
        // Check if test data already exists
        const existing = await readfun_model_1.default.countDocuments({ status: "approved" });
        if (existing > 0) {
            return res.json({ message: "Test data already exists", count: existing });
        }
        // Create test posts
        const testPosts = [
            {
                title: "The Midnight Garden",
                content: "In the quiet hours of midnight, a secret garden comes alive with magic and wonder. The flowers glow with ethereal light, and mysterious creatures dance between the vines. A young girl discovers the garden and learns that true magic lies not in spells, but in the bonds we create with nature.",
                category: "Story",
                tags: ["fantasy", "magic", "garden", "adventure"],
                image: "",
                status: "approved",
                views: 234,
            },
            {
                title: "Whispers of Dawn",
                content: "As the first light touches the horizon, the world awakens with gentle whispers. The birds sing their morning songs, and the dew on the petals sparkles like diamonds. A love story told through the eyes of the sunrise itself.",
                category: "Poem",
                tags: ["love", "sunrise", "poetry", "romance"],
                image: "",
                status: "approved",
                views: 120,
            },
            {
                title: "The Forgotten Library",
                content: "Deep within an ancient city, there exists a library that time forgot. Every book holds a secret, every shelf a mystery. Those who enter must choose between reading the truth or living a comfortable lie.",
                category: "Short Tale",
                tags: ["mystery", "library", "knowledge", "choice"],
                image: "",
                status: "approved",
                views: 89,
            },
            {
                title: "Echoes of Tomorrow",
                content: "Time is a river that flows both ways. In a future that might never be, a traveler discovers that changing the past only creates new futures. A thought-provoking tale about fate, choice, and consequences.",
                category: "Story",
                tags: ["sci-fi", "time-travel", "future", "philosophy"],
                image: "",
                status: "approved",
                views: 156,
            },
        ];
        // Get a valid user ID for author (use the first user if exists)
        const User = require("../models/user.model").default;
        let userId = new (require("mongoose").Types.ObjectId)();
        const users = await User.find().limit(1);
        if (users.length > 0) {
            userId = users[0]._id;
        }
        // Add author to each post
        const postsWithAuthor = testPosts.map(post => ({
            ...post,
            author: userId,
        }));
        await readfun_model_1.default.insertMany(postsWithAuthor);
        res.json({
            success: true,
            message: "Test data created",
            count: postsWithAuthor.length
        });
    }
    catch (error) {
        res.status(500).json({ message: "Error creating test data", error });
    }
};
exports.createTestReadFunPosts = createTestReadFunPosts;
