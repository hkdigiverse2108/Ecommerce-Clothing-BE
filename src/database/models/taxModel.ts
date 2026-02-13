import mongoose from "mongoose";
import { APPLICABLE_ON, schemaOptions, taxModelName } from "../../common";

const taxSchema = new mongoose.Schema({
    name: { type: String },
    description: { type: String },
    percentage: { type: Number },
    applicableOn: { type: String, enum: Object.values(APPLICABLE_ON) },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
}, schemaOptions);

export const TaxModel = mongoose.model(taxModelName, taxSchema);
