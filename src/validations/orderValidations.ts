import Joi from "joi";
import { commonIdSchema, PaymentMethod } from "../common";

export const createOrderValidation = Joi.object({
    shippingAddressId: Joi.string().required().messages({
        "string.empty": "Shipping address is required",
        "any.required": "Shipping address is required"
    }),
    billingAddressId: Joi.string().optional().allow(null, ""),
    paymentMethod: Joi.string().valid(...Object.values(PaymentMethod)).required().messages({
        "any.only": `Payment method must be one of ${Object.values(PaymentMethod).join(", ")}`,
        "any.required": "Payment method is required"
    }),
    paymentId: Joi.string().optional().allow(null, ""),

    // For Buy Now (Direct Order)
    productId: Joi.string().optional().allow(null, ""),
    variantId: Joi.string().optional().allow(null, ""),
    quantity: Joi.number().optional().min(1),
});

export const getMyOrdersValidation = Joi.object({
    page: Joi.number().optional().min(1),
    limit: Joi.number().optional().min(1),
    sort: Joi.number().optional().valid(1, -1),
    status: Joi.string().optional().valid('pending', 'processing', 'shipped', 'delivered', 'cancelled'),
});

export const getOrderByIdValidation = commonIdSchema;
