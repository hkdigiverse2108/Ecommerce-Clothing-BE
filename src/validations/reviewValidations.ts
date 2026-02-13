import Joi from "joi";
import { objectId } from "../common";

export const addReviewValidation = Joi.object({
    productId: objectId().required(),
    orderId: objectId().required(),
    rating: Joi.number().min(1).max(5).required(),
    review: Joi.string().required(),
});
