"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotificationForAdmins = exports.createNotification = exports.deleteNotificationAdmin = exports.markNotificationReadAdmin = exports.getAllNotifications = exports.clearNotifications = exports.markNotificationRead = exports.getMyNotifications = void 0;
const notification_model_1 = require("../models/notification.model");
const user_model_1 = require("../models/user.model");
const mongoose_1 = __importDefault(require("mongoose"));
// Fetch notifications for the current user
const getMyNotifications = async (req, res) => {
    try {
        const userId = req.user?.sub || req.user?._id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const notifications = await notification_model_1.Notification.find({ user: userId })
            .sort({ createdAt: -1 })
            .lean();
        res.json({ success: true, notifications });
    }
    catch (err) {
        console.error("getMyNotifications error", err);
        res.status(500).json({ message: "Server Error" });
    }
};
exports.getMyNotifications = getMyNotifications;
// Mark a single notification as read
const markNotificationRead = async (req, res) => {
    try {
        const userId = req.user?.sub || req.user?._id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const notification = await notification_model_1.Notification.findOneAndUpdate({ _id: req.params.id, user: userId }, { isRead: true }, { new: true });
        if (!notification)
            return res.status(404).json({ message: "Notification not found" });
        res.json({ success: true, notification });
    }
    catch (err) {
        console.error("markNotificationRead error", err);
        res.status(500).json({ message: "Server Error" });
    }
};
exports.markNotificationRead = markNotificationRead;
// Clear all notifications for the current user
const clearNotifications = async (req, res) => {
    try {
        const userId = req.user?.sub || req.user?._id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        await notification_model_1.Notification.deleteMany({ user: userId });
        res.json({ success: true });
    }
    catch (err) {
        console.error("clearNotifications error", err);
        res.status(500).json({ message: "Server Error" });
    }
};
exports.clearNotifications = clearNotifications;
// Admin: get all notifications (paginated)
const getAllNotifications = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const notifications = await notification_model_1.Notification.find()
            .populate("user", "email firstname lastname")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        const total = await notification_model_1.Notification.countDocuments();
        res.json({ success: true, notifications, total, page, limit });
    }
    catch (err) {
        console.error("getAllNotifications error", err);
        res.status(500).json({ message: "Server Error" });
    }
};
exports.getAllNotifications = getAllNotifications;
// Admin: mark any notification as read
const markNotificationReadAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid notification id" });
        }
        const notification = await notification_model_1.Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
        if (!notification)
            return res.status(404).json({ message: "Notification not found" });
        res.json({ success: true, notification });
    }
    catch (err) {
        console.error("markNotificationReadAdmin error", err);
        res.status(500).json({ message: "Server Error" });
    }
};
exports.markNotificationReadAdmin = markNotificationReadAdmin;
// Admin: delete a specific notification
const deleteNotificationAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid notification id" });
        }
        const deleted = await notification_model_1.Notification.findByIdAndDelete(id);
        if (!deleted)
            return res.status(404).json({ message: "Notification not found" });
        res.json({ success: true });
    }
    catch (err) {
        console.error("deleteNotificationAdmin error", err);
        res.status(500).json({ message: "Server Error" });
    }
};
exports.deleteNotificationAdmin = deleteNotificationAdmin;
// Utility used by other controllers to create a notification
const createNotification = async (userId, payload) => {
    try {
        await notification_model_1.Notification.create({ user: userId, ...payload });
    }
    catch (err) {
        console.error("createNotification error", err);
    }
};
exports.createNotification = createNotification;
// Utility: create a notification for every admin
const createNotificationForAdmins = async (payload) => {
    try {
        const admins = await user_model_1.User.find({ roles: user_model_1.Role.ADMIN }).select("_id").lean();
        const docs = admins.map((a) => ({ user: a._id, ...payload }));
        if (docs.length) {
            await notification_model_1.Notification.insertMany(docs);
        }
    }
    catch (err) {
        console.error("createNotificationForAdmins error", err);
    }
};
exports.createNotificationForAdmins = createNotificationForAdmins;
