import joi from "joi";
import { objectId, commonIdSchema } from "../common";

export const addColorValidation = joi.object({
    name: joi.string().required(),
    code: joi.string().required(),
})

export const updateColorValidation = joi.object({
    colorId: objectId().required(),
    name: joi.string().optional(),
    code: joi.string().optional(),
})

export const getColorValidation = joi.object({
    page: joi.number().optional(),
    limit: joi.number().optional(),
    search: joi.string().optional(),
    isActive: joi.boolean().optional(),
})

export const getColorByIdValidation = commonIdSchema;
export const deleteColorValidation = commonIdSchema;