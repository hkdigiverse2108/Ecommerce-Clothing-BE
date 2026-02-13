import mongoose from "mongoose";
import { addressModelName, schemaOptions, userModelName } from "../../common";

const addressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: userModelName },
    name: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    country: { type: String },
    isDefault: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
}, schemaOptions);

export const AddressModel = mongoose.model(addressModelName, addressSchema);