import joi from "joi";
import { objectId, commonIdSchema } from "../common";

export const addAddressValidation = joi.object({
    userId: objectId().required(),
    name: joi.string().required(),
    address: joi.string().required(),
    city: joi.string().required(),
    state: joi.string().required(),
    pincode: joi.string().required(),
    country: joi.string().required(),
    isDefault: joi.boolean().optional(),
});

export const updateAddressValidation = joi.object({
    addressId: objectId().required(),
    name: joi.string().optional(),
    address: joi.string().optional(),
    city: joi.string().optional(),
    state: joi.string().optional(),
    pincode: joi.string().optional(),
    country: joi.string().optional(),
    isDefault: joi.boolean().optional(),
});

export const getAddressValidation = joi.object({
    page: joi.number().optional().default(1),
    limit: joi.number().optional(),
});

export const getAddressByIdValidation = commonIdSchema;
export const deleteAddressValidation = commonIdSchema;