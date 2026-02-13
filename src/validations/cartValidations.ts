import joi from "joi";
import { commonIdSchema } from "../common";

export const addToCartValidation = joi.object({
    productId: joi.string().required(),
    variantId: joi.string().optional(),
    quantity: joi.number().min(1).required(),
});

export const updateQuantityValidation = joi.object({
    productId: joi.string().required(),
    variantId: joi.string().optional(),
    quantity: joi.number().min(1).required(),
});

export const removeItemValidation = joi.object({
    productId: joi.string().required(),
    variantId: joi.string().optional(),
});

export const applyCouponValidation = joi.object({
    code: joi.string().required(),
});

export const removeCouponValidation = joi.object({});
