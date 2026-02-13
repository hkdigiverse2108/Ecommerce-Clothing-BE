import joi from "joi";
import { DISCOUNT_TYPE, commonIdSchema } from "../common";

export const couponValidation = joi.object({
    title: joi.string().optional(),
    code: joi.string().required(),
    discountType: joi.string().valid(...Object.values(DISCOUNT_TYPE)).required(),
    discount: joi.number().when('discountType', {
        is: DISCOUNT_TYPE.PERCENTAGE,
        then: joi.number().min(0).max(100).required(),
        otherwise: joi.number().min(0).required(),
    }),
    minOrderAmount: joi.number().optional(),
    maxDiscountAmount: joi.number().optional(),
    startDate: joi.date().required(),
    endDate: joi.date().optional(),
    usageLimit: joi.number().optional(),
    isOneTimePerUser: joi.boolean().optional(),
    isFirstOrderOnly: joi.boolean().optional(),
    isActive: joi.boolean().optional(),
});

export const updateCouponValidation = joi.object({
    title: joi.string().optional(),
    couponId: joi.string().required(),
    code: joi.string().optional(),
    discountType: joi.string().valid(...Object.values(DISCOUNT_TYPE)).optional(),
    discount: joi.number().when('discountType', {
        is: DISCOUNT_TYPE.PERCENTAGE,
        then: joi.number().min(0).max(100).optional(),
        otherwise: joi.number().min(0).optional(),
    }),
    minOrderAmount: joi.number().optional(),
    maxDiscountAmount: joi.number().optional(),
    startDate: joi.date().optional(),
    endDate: joi.date().optional(),
    usageLimit: joi.number().optional(),
    isOneTimePerUser: joi.boolean().optional(),
    isFirstOrderOnly: joi.boolean().optional(),
    isActive: joi.boolean().optional(),
});

export const getCouponValidation = joi.object({
    page: joi.number().optional().default(1),
    limit: joi.number().optional(),
    search: joi.string().optional(),
    sort: joi.string().optional(),
    dateRange: joi.array().optional().length(2).items(joi.date()).default([]),
});

export const deleteCouponValidation = commonIdSchema;
export const getCouponByIdValidation = commonIdSchema;