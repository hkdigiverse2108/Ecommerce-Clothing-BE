import mongoose from "mongoose";
import { userModelName, cartModelName, couponModelName, schemaOptions, productModelName, variantModelName, taxModelName } from "../../common";

const itemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: productModelName,
    },
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: variantModelName,
    },
    quantity: { type: Number, default: 1 },
    price: { type: Number, default: 0 },
}, schemaOptions);

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: userModelName,
    },
    items: [itemSchema],
    currency: { type: String, default: "INR" },
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    taxId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: taxModelName,
    },
    total: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    couponCode: { type: mongoose.Schema.Types.ObjectId, ref: couponModelName },
    couponDiscount: { type: Number, default: 0 },
}, schemaOptions);

export interface ICart {
    userId: mongoose.Schema.Types.ObjectId;
    items: {
        productId: mongoose.Schema.Types.ObjectId;
        variantId?: mongoose.Schema.Types.ObjectId;
        quantity: number;
        price: number;
    }[];
    currency: string;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    shipping: number;
    couponCode?: mongoose.Schema.Types.ObjectId;
    couponDiscount: number;
    save: () => Promise<ICart>;
}

export const CartModel = mongoose.model<ICart>(cartModelName, cartSchema);