import joi from "joi";
import { objectId, commonIdSchema } from "../common";

export const imageSchema = joi.object({
    imageUrl: joi.string().required(),
    isPrimary: joi.boolean().optional(),
});

export const addVariantValidation = joi.object({
    productId: objectId().required(),
    price: joi.number().required(),
    compareAtPrice: joi.number().optional(),
    stock: joi.number().required(),
    lowStockThreshold: joi.number().optional(),
    images: joi.array().items(imageSchema).optional(),
    attributes: joi.object({
        size: joi.string().required(),
        colorId: objectId().required(),
    }).required(),
});


export const updateVariantValidation = joi.object({
    variantId: objectId().required(),
    productId: objectId().optional(),
    price: joi.number().optional(),
    compareAtPrice: joi.number().optional(),
    stock: joi.number().optional(),
    lowStockThreshold: joi.number().optional(),
    images: joi.array().items(imageSchema).optional(),
    attributes: joi.object({
        size: joi.string().optional(),
        colorId: objectId().optional(),
    }).optional(),
    isActive: joi.boolean().optional(),
});

export const getVariantValidation = joi.object({
    productFilter: objectId().optional(),
    colorFilter: objectId().optional(),
    search: joi.string().allow("").optional(),
});

export const getVariantByIdValidation = commonIdSchema;
export const deleteVariantValidation = commonIdSchema;