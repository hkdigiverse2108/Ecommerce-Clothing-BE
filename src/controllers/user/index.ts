import { getUsersValidation, updateProfileValidation, getUserByIdValidation, deleteUserValidation } from "../../validations";
import { STATUS_CODE, apiResponse } from "../../common";
import { UserModel } from "../../database";
import { responseMessage, getData, countData, removeSensitiveData, updateData, getFirstMatch, createData, reqInfo } from "../../helpers";

import { deleteRequestModel } from "../../database";

export const getUsers = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = getUsersValidation.validate(req.query);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const { page, limit, search, accountType } = value;

        const query: any = { isDeleted: false };
        if (accountType) query.accountType = accountType;
        if (search) query.name = { $regex: search, $options: "si" };

        const skip = (page - 1) * limit;

        const users = await getData(UserModel, query, {}, { limit, skip });
        const total = await countData(UserModel, query);

        const sanitizedUsers = removeSensitiveData(users, ["password", "pin", "otp", "activeSession", "isDeleted", "socialId"]);

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.getDataSuccess("Users"), {
            users: sanitizedUsers,
            state: {
                page,
                limit,
                totalPage: total / limit ? total / limit : 1
            },
            total
        }, {}));
    } catch (error: any) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
}

export const updateUser = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = updateProfileValidation.validate(req.body);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const userId = (req as any).headers.user._id;

        const user = await updateData(UserModel, { _id: userId, isDeleted: false }, value, { new: true });

        if (!user) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("User not found"), {}, {}));

        const sanitizedUser = removeSensitiveData(user, ["password", "pin", "otp", "activeSession", "isDeleted", "socialId"]);

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.updateDataSuccess("User"), sanitizedUser, {}));
    } catch (error: any) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
}

export const getById = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = getUserByIdValidation.validate(req.params);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const { id } = value;

        const user = await getData(UserModel, { _id: id, isDeleted: false }, {}, {});

        if (!user) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("User not found"), {}, {}));

        const sanitizedUser = removeSensitiveData(user, ["password", "pin", "otp", "activeSession", "isDeleted", "socialId"]);

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.getDataSuccess("User"), sanitizedUser, {}));
    } catch (error: any) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
}

export const deleteUser = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = deleteUserValidation.validate(req.params);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const { id } = value;

        const user = await getFirstMatch(UserModel, { _id: id, isDeleted: false }, {}, {});

        if (!user) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("User not found"), {}, {}));

        // create delete request
        const deleteRequest = await createData(deleteRequestModel, {
            userId: id,
        });

        const sanitizedUser = removeSensitiveData(user, ["password", "pin", "otp", "activeSession", "isDeleted", "socialId"]);

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.deleteDataSuccess("User"), sanitizedUser, {}));
    } catch (error: any) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
}