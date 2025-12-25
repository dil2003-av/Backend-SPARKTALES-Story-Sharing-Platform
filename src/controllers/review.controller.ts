import { Request, Response } from "express";
import { AUthRequest } from "../middleware/auth";
import Review from "../models/review.model";
import { createNotificationForAdmins } from "./notification.controller";

// Create review (only approved posts allowed)
export const createReview = async (req: AUthRequest, res: Response) => {
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

    const newReview = await Review.create({
      post,
      rating,
      comment,
      name,
      status: "PENDING",
    });

    try {
      await createNotificationForAdmins({
        title: "New Review",
        message: `${name} left a review (rating ${rating})`,
        type: "info",
      });
    } catch (err) {
      console.warn("notify admins review failed", err);
    }

    res.status(201).json(newReview);
  } catch (err: any) {
    console.error("Error creating review:", err.message);
    res.status(500).json({ message: "Failed to create review", error: err.message });
  }
};

// Get all reviews (paginated)
export const getAllReviews = async (req: any, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = (req.query.status as string) || undefined;

    const query: any = {};
    if (status && ["PENDING", "APPROVED", "DECLINED"].includes(status)) {
      query.status = status;
    }

    const reviews = await Review.find(query)
      .populate("post", "title category")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json(reviews);
  } catch (err: any) {
    console.error("Error fetching reviews:", err.message);
    res.status(500).json({ message: "Failed to fetch reviews", error: err.message });
  }
};

// Get reviews for a specific post
export const getReviewsByPostId = async (req: any, res: Response) => {
  try {
    const { postId } = req.params;

    const reviews = await Review.find({ post: postId })
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (err: any) {
    console.error("Error fetching post reviews:", err.message);
    res.status(500).json({ message: "Failed to fetch post reviews", error: err.message });
  }
};

// Get logged-in user's reviews
export const getMyReviews = async (req: AUthRequest, res: Response) => {
  try {
    const name = req.user.name;

    const reviews = await Review.find({ name }).sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (err: any) {
    console.error("Error fetching user reviews:", err.message);
    res.status(500).json({ message: "Failed to fetch user reviews", error: err.message });
  }
};

// Update review
export const updateReview = async (req: AUthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const updated = await Review.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    res.status(200).json(updated);
  } catch (err: any) {
    console.error("Error updating review:", err.message);
    res.status(500).json({ message: "Failed to update review", error: err.message });
  }
};

// Approve review (ADMIN only)
export const approveReview = async (req: AUthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const review = await Review.findByIdAndUpdate(
      id,
      { status: "APPROVED" },
      { new: true }
    );
    if (!review) return res.status(404).json({ message: "Review not found" });
    res.status(200).json(review);
  } catch (err: any) {
    console.error("Error approving review:", err.message);
    res.status(500).json({ message: "Failed to approve review", error: err.message });
  }
};

// Decline review (ADMIN only)
export const declineReview = async (req: AUthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const review = await Review.findByIdAndUpdate(
      id,
      { status: "DECLINED" },
      { new: true }
    );
    if (!review) return res.status(404).json({ message: "Review not found" });
    res.status(200).json(review);
  } catch (err: any) {
    console.error("Error declining review:", err.message);
    res.status(500).json({ message: "Failed to decline review", error: err.message });
  }
};

// Delete review
export const deleteReview = async (req: AUthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await Review.findByIdAndDelete(id);

    res.status(200).json({ message: "Review deleted" });
  } catch (err: any) {
    console.error("Error deleting review:", err.message);
    res.status(500).json({ message: "Failed to delete review", error: err.message });
  }
};

// Get single review by ID
export const getReviewById = async (req: any, res: Response) => {
  try {
    const review = await Review.findById(req.params.id);

    res.status(200).json(review);
  } catch (err: any) {
    console.error("Error fetching review:", err.message);
    res.status(500).json({ message: "Failed to fetch review", error: err.message });
  }
};

