import mongoose from "mongoose";
import { reviewModelName, userModelName, productModelName, orderModelName, schemaOptions } from "../../common";

const reviewSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: userModelName },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: productModelName },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: orderModelName },
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
}, schemaOptions);

// Ensure a user can review a product only once per order
reviewSchema.index({ userId: 1, productId: 1, orderId: 1 }, { unique: true });

export const ReviewModel = mongoose.model(reviewModelName, reviewSchema);
