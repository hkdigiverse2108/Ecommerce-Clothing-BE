import joi from "joi";

export const addMoneyValidation = joi.object({
    amount: joi.number().min(1).required(),
    description: joi.string().allow(null, ""),
});

export const getTransactionsValidation = joi.object({
    page: joi.number().optional().default(1),
    limit: joi.number().optional(),
});
