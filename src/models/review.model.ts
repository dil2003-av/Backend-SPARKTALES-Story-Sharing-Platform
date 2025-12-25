import mongoose, { Schema, Document } from "mongoose";

export interface IReview extends Document {
  post: mongoose.Types.ObjectId;
  name: string;
  rating: number;
  comment: string;
  status: "PENDING" | "APPROVED" | "DECLINED";
  createdAt: Date;
}

const ReviewSchema: Schema = new Schema(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "DECLINED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

export default mongoose.model<IReview>("Review", ReviewSchema);
