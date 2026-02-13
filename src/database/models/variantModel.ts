import mongoose from "mongoose";
import { colorModelName, productModelName, variantModelName } from "../../common";

const imageSchema = new mongoose.Schema({
    imageUrl: { type: String },
    isPrimary: { type: Boolean, default: false },
})

const variantSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: productModelName },
    sku: { type: String },
    attributes: {
        size: { type: String },
        colorId: { type: mongoose.Schema.Types.ObjectId, ref: colorModelName },
    },
    price: { type: Number },
    compareAtPrice: { type: Number },
    stock: { type: Number },
    lowStockThreshold: { type: Number },
    images: [imageSchema],
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
})

export const VariantModel = mongoose.model(variantModelName, variantSchema);
