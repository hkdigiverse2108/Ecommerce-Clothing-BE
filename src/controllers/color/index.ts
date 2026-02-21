import { reqInfo } from './../../helpers';
import { apiResponse, STATUS_CODE } from "../../common";
import { ColorModel } from "../../database";
import { countData, createData, getData, getFirstMatch, updateData } from "../../helpers";
import { addColorValidation, getColorValidation, updateColorValidation, getColorByIdValidation, deleteColorValidation } from "../../validations";

export const addColor = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = addColorValidation.validate(req.body);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, error.details[0].message, {}, {}));

        const existingColor = await ColorModel.findOne({ name: value.name });
        if (existingColor) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, "Color already exists", {}, {}));

        const color = await createData(ColorModel, value);
        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, "Color added successfully", color, {}));
    } catch (error) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, error.message, {}, {}));
    }
}

export const updateColor = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = updateColorValidation.validate(req.body);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, error.details[0].message, {}, {}));

        if (value.name) {
            const existingColor = await ColorModel.findOne({ name: value.name });
            if (existingColor) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, "Color already exists", {}, {}));
        }

        const color = await updateData(ColorModel, {
            _id: value.colorId
        }, value, {});
        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, "Color updated successfully", color, {}));
    } catch (error) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, error.message, {}, {}));
    }
}

export const getColor = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = getColorValidation.validate(req.body);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, error.details[0].message, {}, {}));

        const { page, limit, search, isActive } = value;

        const query: any = {
            isDeleted: false
        };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "si" } },
            ];
        }

        if (isActive !== undefined) {
            query.isActive = isActive;
        }

        const skip = (page - 1) * limit;

        const color = await getData(ColorModel, query, {}, { skip, limit });
        const total = await countData(ColorModel, query);

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, "Color fetched successfully", {
            color, total, state: {
                page, limit, totalPages: limit ? Math.ceil(total / limit) : 1
            }
        }, {}));
    } catch (error) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, error.message, {}, {}));
    }
}

export const getColorById = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = getColorByIdValidation.validate(req.params);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, error.details[0].message, {}, {}));

        const color = await getFirstMatch(ColorModel, { _id: value.id, isDeleted: false }, {}, {});
        if (!color) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, "Color not found", {}, {}));

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, "Color fetched successfully", color, {}));
    } catch (error) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, error.message, {}, {}));
    }
}

export const deleteColor = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = deleteColorValidation.validate(req.params);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, error.details[0].message, {}, {}));

        const color = await updateData(ColorModel, { _id: value.id, isDeleted: false }, { isDeleted: true }, {});

        if (!color) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, "Color not found", {}, {}));

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, "Color deleted successfully", color, {}));
    } catch (error) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, error.message, {}, {}));
    }
}