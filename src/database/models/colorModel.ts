import mongoose from "mongoose";
import { colorModelName, schemaOptions } from "../../common";

const colorSchema = new mongoose.Schema({
    name: { type: String },
    code: { type: String },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
}, schemaOptions);

export const ColorModel = mongoose.model(colorModelName, colorSchema);