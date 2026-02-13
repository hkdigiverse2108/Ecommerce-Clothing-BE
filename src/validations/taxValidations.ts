import Joi from "joi";
import { APPLICABLE_ON, commonIdSchema, objectId } from "../common";

export const createTaxValidation = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().optional(),
    percentage: Joi.number().min(0).max(100).required(),
    applicableOn: Joi.string().valid(...Object.values(APPLICABLE_ON)).default(APPLICABLE_ON.ORDER),
    isDefault: Joi.boolean().default(false),
    isActive: Joi.boolean().default(true),
});

export const updateTaxValidation = Joi.object({
    texId: objectId().required(),
    name: Joi.string().optional(),
    description: Joi.string().optional(),
    percentage: Joi.number().min(0).max(100).optional(),
    applicableOn: Joi.string().valid(...Object.values(APPLICABLE_ON)).optional(),
    isDefault: Joi.boolean().optional(),
    isActive: Joi.boolean().optional(),
});

export const getAllTaxValidation = Joi.object({
    page: Joi.number().optional().default(1),
    limit: Joi.number().optional(),
    search: Joi.string().optional(),
    isActive: Joi.boolean().optional(),
    applicableOn: Joi.string().valid(...Object.values(APPLICABLE_ON)).optional(),
});

export const deleteTaxValidation = commonIdSchema;
export const getTaxByIdValidation = commonIdSchema;