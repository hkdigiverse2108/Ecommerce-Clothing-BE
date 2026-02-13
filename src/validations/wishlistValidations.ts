import joi from "joi";
import { objectId, commonIdSchema } from "../common";

export const wishlistValidation = joi.object({
    userId: objectId().required(),
    productId: objectId().required(),
});

export const getWishlistValidation = commonIdSchema;
export const clearWishlistValidation = commonIdSchema;
