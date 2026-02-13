import { apiResponse, STATUS_CODE } from "../../common";

import { AddressModel } from "../../database";
import { countData, createData, getData, reqInfo, responseMessage, updateData, updateMany } from "../../helpers";
import { addAddressValidation, getAddressValidation, updateAddressValidation, getAddressByIdValidation, deleteAddressValidation } from "../../validations/addressValidations";

export const addAddress = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = addAddressValidation.validate(req.body);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const { userId, isDefault, ...rest } = value;

        if (isDefault) {
            await updateMany(AddressModel, { userId, isDeleted: false }, { $set: { isDefault: false } }, { new: true });
        }

        const address = await createData(AddressModel, { userId, ...rest });

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.addDataSuccess("Address"), address, {}));
    } catch (error) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
}

export const updateAddress = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = updateAddressValidation.validate(req.body);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const { addressId, isDefault, ...rest } = value;

        const user = req.headers.user;

        if (isDefault) {
            await updateMany(AddressModel, { userId: user._id, isDeleted: false }, { $set: { isDefault: false } }, { new: true });
        }

        const address = await updateData(AddressModel, { _id: addressId, isDeleted: false }, rest, { new: true });

        if (!address) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Address not found"), {}, {}));

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.updateDataSuccess("Address"), address, {}));
    } catch (error) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
}

export const getAddress = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = getAddressValidation.validate(req.query);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const { page, limit } = value;

        const user = req.headers.user;

        const address = await getData(AddressModel, { userId: user._id, isDeleted: false }, {}, { skip: (page - 1) * limit, limit });

        const total = await countData(AddressModel, { userId: user._id, isDeleted: false });

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.getDataSuccess("Address"), { address, state: { page, limit, totalPage: total / limit ? total / limit : 1 }, total }, {}));
    } catch (error) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
}

export const getById = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = getAddressByIdValidation.validate(req.params);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const { id } = value;

        const address = await getData(AddressModel, { _id: id, isDeleted: false }, {}, {});

        if (!address) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Address not found"), {}, {}));

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.getDataSuccess("Address"), address, {}));
    } catch (error) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
}

export const deleteAddress = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = deleteAddressValidation.validate(req.params);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const { id } = value;

        const address = await updateData(AddressModel, { _id: id, isDeleted: false }, { isDeleted: true }, { new: true });

        if (!address) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Address not found"), {}, {}));

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.deleteDataSuccess("Address"), address, {}));
    } catch (error) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
}
