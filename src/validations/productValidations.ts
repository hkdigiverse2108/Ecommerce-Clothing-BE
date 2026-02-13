import joi from "joi";
import { objectId, commonIdSchema } from "../common";

export const addProductValidation = joi.object({
    name: joi.string().required(),
    description: joi.string().required(),
    categoryId: objectId().required(),
    brand: joi.string().optional(),
    basePrice: joi.number().required(),
    currency: joi.string().required(),
    baseImage: joi.string().required(),
    hasVariants: joi.boolean().required(),
    attributes: joi.when('hasVariants', {
        is: true,
        then: joi.object({
            size: joi.array().items(joi.string()).required(),
            color: joi.array().items(objectId()).required(),
        }).required(),
        otherwise: joi.object().optional(),
    }),
    stock: joi.when('hasVariants', {
        is: false,
        then: joi.number().required(),
        otherwise: joi.number().optional(),
    }),
});

export const updateProductValidation = joi.object({
    productId: objectId().required(),
    name: joi.string().optional(),
    brand: joi.string().optional(),
    description: joi.string().optional(),
    categoryId: objectId().optional(),
    basePrice: joi.number().optional(),
    currency: joi.string().optional(),
    baseImage: joi.string().optional(),
    hasVariants: joi.boolean().optional(),
    attributes: joi.when('hasVariants', {
        is: true,
        then: joi.object({
            size: joi.array().items(joi.string()).optional(),
            color: joi.array().items(objectId()).optional(),
        }).optional(),
        otherwise: joi.object().optional(),
    }),
    stock: joi.number().optional(),
});

export const getProductValidation = joi.object({
    page: joi.number().optional().default(1),
    limit: joi.number().optional(),
    search: joi.string().optional().allow("", null),
    categoryFilter: objectId().optional().allow("", null),
    priceFilter: joi.array().optional().items(joi.number()).length(2),
    sort: joi.string().optional().allow("", null),
});

export const getProductBySlugValidation = joi.object({
    slug: joi.string().required()
});

export const getProductByIdValidation = commonIdSchema;
export const deleteProductValidation = commonIdSchema;