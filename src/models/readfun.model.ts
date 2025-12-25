import mongoose, { Schema, Document } from "mongoose";

export interface ReadFunPost extends Document {
  title: string;
  content: string;
  category: string;
  tags: string[];
  image?: string;
  author: mongoose.Types.ObjectId;
  status: "pending" | "approved" | "declined";
  views: number;
}

const ReadFunSchema: Schema = new Schema(
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
      enum: ["Story", "Poem", "Quote", "Short Tale", "Other"],
      required: true,
    },

    tags: {
      type: [String],
      default: [],
    },

    image: {
      type: String,
      default: "",
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "declined"],
      default: "pending",
    },

    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model<ReadFunPost>("ReadFunPost", ReadFunSchema);
