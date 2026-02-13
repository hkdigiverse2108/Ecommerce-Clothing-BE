import joi from "joi";
import { objectId, commonIdSchema } from "../common";

export const createCategoryValidation = joi.object({
    name: joi.string().required(),
    description: joi.string().allow("", null).optional(),
    image: joi.string().allow("", null).optional(),
});

export const updateCategoryValidation = joi.object({
    categoryId: objectId().required(),
    name: joi.string().optional(),
    description: joi.string().optional(),
    image: joi.string().optional(),
    isActive: joi.boolean().optional(),
});

export const getCategoryValidation = joi.object({
    page: joi.number().optional().default(1),
    limit: joi.number().optional(),
    search: joi.string().optional(),
    isActive: joi.boolean().optional(),
});

export const getCategoryByIdValidation = commonIdSchema;
export const deleteCategoryValidation = commonIdSchema;