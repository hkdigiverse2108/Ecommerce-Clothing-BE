import joi from "joi";
import { commonIdSchema } from "../common";

export const addBannerValidation = joi.object({
    title: joi.string().required(),
    description: joi.string().required(),
    image: joi.string().required(),
    link: joi.string().required(),
    isActive: joi.boolean().required(),
});

export const updateBannerValidation = joi.object({
    bannerId: commonIdSchema,
    title: joi.string().optional(),
    description: joi.string().optional(),
    image: joi.string().optional(),
    link: joi.string().optional(),
    isActive: joi.boolean().optional(),
});

export const getBannerValidation = joi.object({
    page: joi.number().optional().default(1),
    limit: joi.number().optional(),
    search: joi.string().optional().allow("", null),
    isActive: joi.boolean().optional(),
});

export const getBannerByIdValidation = commonIdSchema;
export const deleteBannerValidation = commonIdSchema;