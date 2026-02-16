import joi from "joi";
import { AccountType, objectId, commonIdSchema } from "../common";

export const updateProfileValidation = joi.object({
    profilePicture: joi.string().optional(),
    name: joi.string().optional(),
    nickName: joi.string().optional(),
    dateOfBirth: joi.date().optional(),
    gender: joi.string().optional(),
    phone: joi.string().optional(),
    pin: joi.string().pattern(/^[0-9]{4}$/).optional(),
});

export const getUsersValidation = joi.object({
    page: joi.number().optional().default(1),
    limit: joi.number().optional(),
    search: joi.string().optional().allow("", null),
    accountType: joi.string().valid(AccountType.USER, AccountType.ADMIN).optional(),
});

export const getUserByIdValidation = commonIdSchema;
export const deleteUserValidation = commonIdSchema;