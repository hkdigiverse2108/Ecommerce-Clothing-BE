import mongoose from "mongoose";
import { colorModelName, productModelName, variantModelName } from "../../common";

const imageSchema = new mongoose.Schema({
    imageUrl: { type: String },
    isPrimary: { type: Boolean, default: false },
})

const variantSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: productModelName, index: true },
    sku: { type: String, index: true },
    attributes: {
        size: { type: String },
        colorId: { type: mongoose.Schema.Types.ObjectId, ref: colorModelName, index: true },
    },
    price: { type: Number },
    compareAtPrice: { type: Number },
    stock: { type: Number },
    lowStockThreshold: { type: Number },
    images: [imageSchema],
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

variantSchema.index({ productId: 1, "attributes.size": 1, "attributes.colorId": 1 }, { unique: true });

export const VariantModel = mongoose.model(variantModelName, variantSchema);
