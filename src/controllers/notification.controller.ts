import { Request, Response } from "express"
import { AUthRequest } from "../middleware/auth"
import { Notification } from "../models/notification.model"
import { User, Role } from "../models/user.model"
import mongoose from "mongoose"

// Fetch notifications for the current user
export const getMyNotifications = async (req: AUthRequest, res: Response) => {
  try {
    const userId = req.user?.sub || req.user?._id
    if (!userId) return res.status(401).json({ message: "Unauthorized" })

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean()

    res.json({ success: true, notifications })
  } catch (err) {
    console.error("getMyNotifications error", err)
    res.status(500).json({ message: "Server Error" })
  }
}

// Mark a single notification as read
export const markNotificationRead = async (req: AUthRequest, res: Response) => {
  try {
    const userId = req.user?.sub || req.user?._id
    if (!userId) return res.status(401).json({ message: "Unauthorized" })

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      { isRead: true },
      { new: true }
    )

    if (!notification) return res.status(404).json({ message: "Notification not found" })

    res.json({ success: true, notification })
  } catch (err) {
    console.error("markNotificationRead error", err)
    res.status(500).json({ message: "Server Error" })
  }
}

// Clear all notifications for the current user
export const clearNotifications = async (req: AUthRequest, res: Response) => {
  try {
    const userId = req.user?.sub || req.user?._id
    if (!userId) return res.status(401).json({ message: "Unauthorized" })

    await Notification.deleteMany({ user: userId })
    res.json({ success: true })
  } catch (err) {
    console.error("clearNotifications error", err)
    res.status(500).json({ message: "Server Error" })
  }
}

// Admin: get all notifications (paginated)
export const getAllNotifications = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 20
    const skip = (page - 1) * limit

    const notifications = await Notification.find()
      .populate("user", "email firstname lastname")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const total = await Notification.countDocuments()

    res.json({ success: true, notifications, total, page, limit })
  } catch (err) {
    console.error("getAllNotifications error", err)
    res.status(500).json({ message: "Server Error" })
  }
}

// Admin: mark any notification as read
export const markNotificationReadAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid notification id" })
    }

    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    )

    if (!notification) return res.status(404).json({ message: "Notification not found" })

    res.json({ success: true, notification })
  } catch (err) {
    console.error("markNotificationReadAdmin error", err)
    res.status(500).json({ message: "Server Error" })
  }
}

// Admin: delete a specific notification
export const deleteNotificationAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid notification id" })
    }

    const deleted = await Notification.findByIdAndDelete(id)
    if (!deleted) return res.status(404).json({ message: "Notification not found" })

    res.json({ success: true })
  } catch (err) {
    console.error("deleteNotificationAdmin error", err)
    res.status(500).json({ message: "Server Error" })
  }
}

// Utility used by other controllers to create a notification
export const createNotification = async (
  userId: string,
  payload: { title: string; message: string; type: "approved" | "declined" | "info" }
) => {
  try {
    await Notification.create({ user: userId, ...payload })
  } catch (err) {
    console.error("createNotification error", err)
  }
}

// Utility: create a notification for every admin
export const createNotificationForAdmins = async (payload: {
  title: string
  message: string
  type: "approved" | "declined" | "info"
}) => {
  try {
    const admins = await User.find({ roles: Role.ADMIN }).select("_id").lean()
    const docs = admins.map((a) => ({ user: a._id, ...payload }))
    if (docs.length) {
      await Notification.insertMany(docs)
    }
  } catch (err) {
    console.error("createNotificationForAdmins error", err)
  }
}
