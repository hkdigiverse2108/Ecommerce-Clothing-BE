import mongoose from "mongoose";
import { schemaOptions, orderModelName, userModelName, productModelName, couponModelName, variantModelName, addressModelName, OrderStatus, PaymentStatus, PaymentMethod } from "../../common";

const orderItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: productModelName },
    variantId: { type: mongoose.Schema.Types.ObjectId, ref: variantModelName },
    quantity: { type: Number },
    price: { type: Number },
}, { _id: false });

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: userModelName },
    orderNumber: { type: String },
    orderStatus: { type: String, enum: Object.values(OrderStatus), default: OrderStatus.PENDING },
    paymentStatus: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING },
    totalAmount: { type: Number },
    shippingAddress: { type: mongoose.Schema.Types.ObjectId, ref: addressModelName },
    billingAddress: { type: mongoose.Schema.Types.ObjectId, ref: addressModelName },
    paymentMethod: { type: String, enum: Object.values(PaymentMethod) }, // No default as it's required
    paymentId: { type: String },
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: couponModelName },
    discountAmount: { type: Number },
    shippingAmount: { type: Number },
    taxAmount: { type: Number },
    finalAmount: { type: Number },
    orderDate: { type: Date, default: Date.now },
    deliveredDate: { type: Date },
    cancelledDate: { type: Date },
    shippedDate: { type: Date },
    orderItems: [orderItemSchema],
}, schemaOptions);

export const OrderModel = mongoose.model(orderModelName, orderSchema);
