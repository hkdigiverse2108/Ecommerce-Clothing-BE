import { apiResponse, STATUS_CODE } from "../../common";
import { CouponModel } from "../../database";
import { countData, createData, getData, getFirstMatch, reqInfo, responseMessage, updateData } from "../../helpers";
import { couponValidation, deleteCouponValidation, getCouponByIdValidation, getCouponValidation, updateCouponValidation } from "../../validations";

export const addCoupon = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = couponValidation.validate(req.body);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const coupon = await createData(CouponModel, value);
        if (!coupon) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Coupon not added"), {}, {}));

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage("Coupon added successfully"), coupon, {}));

    } catch (error) {
        console.error(error);
        if (error.code === 11000) {
            return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Coupon code already exists"), {}, {}));
        }
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
};

export const updateCoupon = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = updateCouponValidation.validate(req.body);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const { couponId, ...updateFields } = value;

        const coupon = await updateData(CouponModel, { _id: couponId }, updateFields, {});
        if (!coupon) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Coupon not updated"), {}, {}));

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage("Coupon updated successfully"), coupon, {}));

    } catch (error) {
        console.error(error);
        if (error.code === 11000) {
            return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Coupon code already exists"), {}, {}));
        }
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
};

export const getCoupon = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = getCouponValidation.validate(req.query);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const { page = 1, limit = 10, search, sort } = value;
        const query: any = { isDeleted: false };

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "si" } },
                { code: { $regex: search, $options: "si" } },
            ];
        }

        const skip = (page - 1) * limit;
        const options = { skip, limit, sort: sort ? { [sort]: 1 } : { createdAt: -1 } };

        const coupons = await getData(CouponModel, query, {}, options);
        const total = await countData(CouponModel, query);

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage("Coupons fetched successfully"), {
            coupons, total, state: {
                page, limit, totalPage: Math.ceil(total / limit)
            }
        }, {}));

    } catch (error) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
};

export const getCouponById = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = getCouponByIdValidation.validate(req.params);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const coupon = await getFirstMatch(CouponModel, { _id: value.id, isDeleted: false }, {}, {});
        if (!coupon) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Coupon not found"), {}, {}));

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.getDataSuccess("Coupon"), coupon, {}));
    } catch (error) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
};

export const deleteCoupon = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = deleteCouponValidation.validate(req.params);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const coupon = await updateData(CouponModel, { _id: value.id, isDeleted: false }, { isDeleted: true }, {});
        if (!coupon) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Coupon not found"), {}, {}));

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.deleteDataSuccess("Coupon"), {}, {}));
    } catch (error) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
};
