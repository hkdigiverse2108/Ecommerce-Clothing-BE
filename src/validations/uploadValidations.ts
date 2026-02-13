import joi from "joi";
import { FILE_TYPE } from "../common";

export const getFilesValidator = joi.object({
    page: joi.number().optional().default(1),
    limit: joi.number().optional(),
    type: joi.string().optional().valid(...Object.values(FILE_TYPE)),
});