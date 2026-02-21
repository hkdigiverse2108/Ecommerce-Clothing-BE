import { apiResponse, STATUS_CODE } from "../../common";
import { CategoryModel } from "../../database";
import { countData, createData, getData, getFirstMatch, reqInfo, responseMessage, updateData } from "../../helpers";
import { createCategoryValidation, getCategoryValidation, updateCategoryValidation, getCategoryByIdValidation, deleteCategoryValidation } from "../../validations";

export const createCategory = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = createCategoryValidation.validate(req.body);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const isCategoryExists = await getFirstMatch(CategoryModel, { name: value.name, isDeleted: false }, {}, {});
        if (isCategoryExists) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Category already exists"), {}, {}));

        const category = await createData(CategoryModel, value);

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.addDataSuccess("Category"), category, {}));
    } catch (error: any) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
}

export const updateCategory = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = updateCategoryValidation.validate(req.body);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));


        const isCategoryExists = await getFirstMatch(CategoryModel, { name: value.name, isDeleted: false }, {}, {});
        if (isCategoryExists) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Category name is already in use"), {}, {}));

        const category = await updateData(CategoryModel, { _id: value.categoryId, isDeleted: false }, value, {});
        if (!category) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Category not found"), {}, {}));

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.updateDataSuccess("Category"), category, {}));
    } catch (error: any) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
}

export const getCategory = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = getCategoryValidation.validate(req.query);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const { search, page, limit, isActive } = value;

        let query: any = { isDeleted: false };
        if (search) query.name = { $regex: search, $options: "si" };
        if (isActive) query.isActive = isActive;

        const skip = (page - 1) * limit;

        const category = await getData(CategoryModel, query, {}, { skip, limit });
        const total = await countData(CategoryModel, query);

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.getDataSuccess("Category"), {
            category, state: {
                page,
                limit,
                totalPage: limit ? Math.ceil(total / limit) : 1
            }, total
        }, {}));
    } catch (error: any) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
}

export const getById = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = getCategoryByIdValidation.validate(req.params);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const category = await getFirstMatch(CategoryModel, { _id: value.id, isDeleted: false }, {}, {});
        if (!category) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Category not found"), {}, {}));

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.getDataSuccess("Category"), category, {}));
    } catch (error: any) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
}

export const deleteCategory = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = deleteCategoryValidation.validate(req.params);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const category = await updateData(CategoryModel, { _id: value.id, isDeleted: false }, { isDeleted: true }, {});

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.deleteDataSuccess("Category"), category, {}));
    } catch (error: any) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
}