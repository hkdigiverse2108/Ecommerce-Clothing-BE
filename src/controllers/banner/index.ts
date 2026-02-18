import { apiResponse, STATUS_CODE } from "../../common";
import { BannerModel } from "../../database";
import { createData, getData, getFirstMatch, responseMessage, updateData } from "../../helpers";
import { addBannerValidation, getBannerValidation, updateBannerValidation, getBannerByIdValidation, deleteBannerValidation } from "../../validations";

export const addBanner = async (req, res) => {
    try {
        const { error, value } = addBannerValidation.validate(req.body);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const banner = await createData(BannerModel, value);
        if (!banner) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Banner not added"), {}, {}));

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage("Banner added successfully"), banner, {}));

    } catch (error) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, (error as any).message || error));
    }
};

export const updateBanner = async (req, res) => {
    try {
        const { error, value } = updateBannerValidation.validate(req.body);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const banner = await updateData(BannerModel, { _id: value.bannerId, isDeleted: false }, value, { new: true });
        if (!banner) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Banner not updated"), {}, {}));

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage("Banner updated successfully"), banner, {}));

    } catch (error) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, (error as any).message || error));
    }
};

export const getBanner = async (req, res) => {
    try {
        const { error, value } = getBannerValidation.validate(req.query);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const criteria: any = { isDeleted: false };
        const projection = {};
        const options: any = {};

        if (value.isActive) {
            criteria.isActive = value.isActive;
        }

        if (value.search) {
            criteria.search = { $regex: value.search, $options: "si" };
        }

        const skip = (value.page - 1) * value.limit;
        options.skip = skip;
        options.limit = value.limit;

        const banner = await getData(BannerModel, criteria, projection, options);
        if (!banner) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Banner not found"), {}, {}));

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage("Banner fetched successfully"), banner, {}));

    } catch (error) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, (error as any).message || error));
    }
};

export const getBannerById = async (req, res) => {
    try {
        const { error, value } = getBannerByIdValidation.validate(req.params);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const banner = await getFirstMatch(BannerModel, { _id: value.bannerId, isDeleted: false }, {}, {});
        if (!banner) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Banner not found"), {}, {}));

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage("Banner fetched successfully"), banner, {}));

    } catch (error) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, (error as any).message || error));
    }
};

export const deleteBanner = async (req, res) => {
    try {
        const { error, value } = deleteBannerValidation.validate(req.params);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const banner = await updateData(BannerModel, { _id: value.bannerId, isDeleted: false }, { isDeleted: true }, { new: true });
        if (!banner) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Banner not found"), {}, {}));

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage("Banner deleted successfully"), banner, {}));

    } catch (error) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, (error as any).message || error));
    }
};
