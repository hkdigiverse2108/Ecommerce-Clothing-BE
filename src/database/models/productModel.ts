import mongoose from "mongoose";
import { categoryModelName, colorModelName, productModelName, schemaOptions } from "../../common";

const attributeSchema = new mongoose.Schema({
    size: [String],
    color: [{ type: mongoose.Schema.Types.ObjectId, ref: colorModelName }],
}, { _id: false })

const productSchema = new mongoose.Schema({
    name: { type: String },
    slug: { type: String },
    description: { type: String },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: categoryModelName },
    brand: { type: String },
    basePrice: { type: Number },
    currency: { type: String },
    baseImage: { type: String },
    attributes: attributeSchema,
    stock: { type: Number, default: 0 },
    hasVariants: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
}, schemaOptions)

export const ProductModel = mongoose.model(productModelName, productSchema);