import mongoose, { Document, Schema } from "mongoose"

export type NotificationType = "approved" | "declined" | "info"

export interface INotification extends Document {
  user: mongoose.Types.ObjectId
  title: string
  message: string
  type: NotificationType
  isRead: boolean
  createdAt: Date
  updatedAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: { type: String, enum: ["approved", "declined", "info"], default: "info" },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
)

export const Notification = mongoose.model<INotification>("Notification", NotificationSchema)
