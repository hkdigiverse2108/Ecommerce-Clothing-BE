import { apiResponse, STATUS_CODE, userModelName, wishlistModelName, colorModelName } from "../../common";
import { ProductModel, UserModel, WishlistModel } from "../../database";
import { createData, findOneAndPopulate, getFirstMatch, responseMessage, updateData, aggregateAndPopulate, reqInfo } from "../../helpers";
import { clearWishlistValidation, getWishlistValidation, wishlistValidation } from "../../validations";
import { getProductStatsStages } from "../product";

export const wishlist = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = wishlistValidation.validate(req.body);
        if (error)
            return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage('Validation Error'), {}, error.message));

        const { userId, productId } = value;

        const user = await getFirstMatch(UserModel, { _id: userId, isDeleted: false }, {}, {});
        if (!user)
            return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.getDataNotFound('User'), {}, {}));

        const product = await getFirstMatch(ProductModel, { _id: productId, isDeleted: false }, {}, {});
        if (!product)
            return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.getDataNotFound('Product'), {}, {}));

        // if product is already in wishlist then remove it
        const wishlist = await getFirstMatch(WishlistModel, { userId, productIds: { $in: [productId] } }, {}, {});
        if (wishlist) {
            const data = await updateData(WishlistModel, { _id: wishlist._id }, { $pull: { productIds: productId } }, { new: true });
            return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage('Product removed from wishlist'), data, {}));
        }

        // if product is not in wishlist then add it
        const data = await updateData(WishlistModel, { userId }, { $push: { productIds: productId } }, { upsert: true, new: true });
        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage('Product added to wishlist'), data, {}));

    } catch (error) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.customMessage('Internal Server Error'), {}, error.message));
    }
}

export const getWishlist = async (req, res) => {
    try {
        const userId = req.headers.user._id;

        const user = await getFirstMatch(UserModel, { _id: userId, isDeleted: false }, {}, {});
        if (!user)
            return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.getDataNotFound('User'), {}, {}));

        let wishlist: any = await getFirstMatch(WishlistModel, { userId }, {}, {});
        if (!wishlist) {
            wishlist = await createData(WishlistModel, { userId, productIds: [] });
            return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage('Wishlist retrieved successfully'), wishlist, {}));
        }

        let wishlistProducts = [];
        if (wishlist.productIds && wishlist.productIds.length > 0) {
            wishlistProducts = await aggregateAndPopulate(ProductModel, [
                { $match: { _id: { $in: wishlist.productIds }, isDeleted: false } },
                ...getProductStatsStages(),
                {
                    $project: {
                        product: "$$ROOT",
                        rating: 1,
                        totalReviews: 1,
                        totalSold: 1
                    }
                },
                {
                    $project: {
                        "product.rating": 0,
                        "product.totalReviews": 0,
                        "product.totalSold": 0
                    }
                }
            ], { path: "product.attributes.color", model: colorModelName });
        }

        const responseWishlist = {
            ...wishlist,
            productIds: wishlistProducts
        };

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage('Wishlist retrieved successfully'), responseWishlist, {}));

    } catch (error) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.customMessage('Internal Server Error'), {}, error.message));
    }
}

export const clearWishlist = async (req, res) => {
    try {
        const { error, value } = clearWishlistValidation.validate(req.params);
        if (error)
            return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage('Validation Error'), {}, error.message));

        const userId = value.id;

        // check if user is exist
        const isUser = await getFirstMatch(UserModel, { _id: userId, isDeleted: false }, {}, {});
        if (!isUser)
            return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.getDataNotFound('User'), {}, {}));

        const wishlist = await updateData(WishlistModel, { userId }, { $set: { productIds: [] } }, { new: true });
        if (!wishlist)
            return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.getDataNotFound('Wishlist'), {}, {}));

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage('Wishlist cleared successfully'), wishlist, {}));

    } catch (error) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.customMessage('Internal Server Error'), {}, error.message));
    }
}