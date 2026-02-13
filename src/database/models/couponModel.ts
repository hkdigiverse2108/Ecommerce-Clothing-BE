import mongoose from "mongoose";
import { couponModelName, DISCOUNT_TYPE, schemaOptions } from "../../common";

const couponSchema = new mongoose.Schema({
    title: { type: String, trim: true },
    code: { type: String, required: true, trim: true, unique: true },
    discount: { type: Number, required: true },
    discountType: { type: String, enum: [DISCOUNT_TYPE.PERCENTAGE, DISCOUNT_TYPE.FIXED], default: DISCOUNT_TYPE.PERCENTAGE },
    minOrderAmount: { type: Number, default: 0 },
    maxDiscountAmount: { type: Number, default: 0 },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    usageLimit: { type: Number, default: null },
    usageCount: { type: Number, default: 0 },
    isOneTimePerUser: { type: Boolean, default: false },
    isFirstOrderOnly: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
}, schemaOptions);

export const CouponModel = mongoose.model(couponModelName, couponSchema);