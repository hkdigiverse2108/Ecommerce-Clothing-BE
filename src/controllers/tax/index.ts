import { apiResponse, STATUS_CODE } from "../../common";
import { TaxModel } from "../../database";
import { responseMessage, createData, getData, updateData, getFirstMatch, updateMany, countData, reqInfo } from "../../helpers";
import { createTaxValidation, updateTaxValidation, getAllTaxValidation, deleteTaxValidation, getTaxByIdValidation } from "../../validations";

export const createTax = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = createTaxValidation.validate(req.body);
        if (error)
            return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, error.details[0].message, {}, {}));

        const isTaxExists = await getFirstMatch(TaxModel, { name: value.name, isDeleted: false }, {}, {});
        if (isTaxExists)
            return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.dataAlreadyExist(value.name), {}, {}));

        if (value.isDefault) {
            await updateMany(TaxModel, { isDefault: true }, { isDefault: false }, {});
        }

        const tax = await createData(TaxModel, value);
        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.addDataSuccess(tax.name), tax, {}));
    } catch (error: any) {
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, error.message, {}, {}));
    }
}

export const updateTax = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = updateTaxValidation.validate(req.body);
        if (error)
            return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, error.details[0].message, {}, {}));

        const isTaxExists = await getFirstMatch(TaxModel, { name: value.name, isDeleted: false }, {}, {});
        if (isTaxExists)
            return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.dataAlreadyExist(value.name), {}, {}));

        if (value.isDefault) {
            await updateMany(TaxModel, { isDefault: true }, { isDefault: false }, {});
        }

        const tax = await updateData(TaxModel, { _id: value.taxId }, value, {});
        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.updateDataSuccess(tax.name), tax, {}));
    } catch (error: any) {
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, error.message, {}, {}));
    }
}

export const getAllTax = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = getAllTaxValidation.validate(req.query);
        if (error)
            return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, error.details[0].message, {}, {}));

        const query: any = {
            isDeleted: false
        };

        if (value.search) {
            query.$or = [
                { name: { $regex: value.search, $options: "si" } },
                { description: { $regex: value.search, $options: "si" } },
            ];
        }

        if (value.isActive) {
            query.isActive = value.isActive;
        }

        if (value.applicableOn) {
            query.applicableOn = value.applicableOn;
        }

        const skip = (value.page - 1) * value.limit;

        const taxes = await getData(TaxModel, query, {}, { skip, limit: value.limit });

        const total = await countData(TaxModel, query);

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.getDataSuccess("Tax data"), {
            taxes,
            state: {
                page: value.page,
                limit: value.limit,
                totalPage: value.limit == null ? 1 : Math.ceil(total / value.limit),
            },
            total
        }, {}));
    } catch (error: any) {
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, error.message, {}, {}));
    }
}

export const deleteTax = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = deleteTaxValidation.validate(req.params);
        if (error)
            return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, error.details[0].message, {}, {}));

        const tax = await updateData(TaxModel, { _id: value.taxId, isDeleted: false }, { isDeleted: true }, {});
        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.deleteDataSuccess(tax.name), tax, {}));
    } catch (error: any) {
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, error.message, {}, {}));
    }
}

export const getTaxById = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = getTaxByIdValidation.validate(req.params);
        if (error)
            return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, error.details[0].message, {}, {}));

        const tax = await getFirstMatch(TaxModel, { _id: value.taxId, isDeleted: false }, {}, {});
        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.getDataSuccess("Tax data"), tax, {}));
    } catch (error: any) {
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, error.message, {}, {}));
    }
}