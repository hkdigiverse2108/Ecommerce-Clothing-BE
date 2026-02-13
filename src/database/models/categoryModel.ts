import mongoose from "mongoose";
import { categoryModelName, schemaOptions } from "../../common";

const categorySchema = new mongoose.Schema({
    name: { type: String },
    description: { type: String },
    image: { type: String },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
}, schemaOptions);

export const CategoryModel = mongoose.model(categoryModelName, categorySchema);