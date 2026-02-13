import mongoose from "mongoose";
import { bannerModelName, schemaOptions } from "../../common";

const bannerSchema = new mongoose.Schema({
    title: { type: String },
    description: { type: String },
    image: { type: String },
    link: { type: String },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
}, schemaOptions);

export const BannerModel = mongoose.model(bannerModelName, bannerSchema);