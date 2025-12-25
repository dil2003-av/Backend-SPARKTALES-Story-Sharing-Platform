import mongoose, { Schema, Document } from "mongoose";

export interface IPost extends Document {
  title: string;
  content: string;
  category: string;
  tags?: string;
  image?: string;
  admin: mongoose.Types.ObjectId;
  status: "PENDING" | "APPROVED" | "DECLINED";
  likes?: number;
  likedBy?: mongoose.Types.ObjectId[];
  views?: number;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    content: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    tags: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: null,
    },

    admin: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "DECLINED"],
      default: "PENDING",
    },

    likes: {
      type: Number,
      default: 0,
    },

    likedBy: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true, // createdAt / updatedAt automatically
  }
);

export default mongoose.model<IPost>("Post", PostSchema);
