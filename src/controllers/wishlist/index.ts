import { apiResponse, STATUS_CODE, userModelName, wishlistModelName } from "../../common";
import { ProductModel, UserModel, WishlistModel } from "../../database";
import { createData, findOneAndPopulate, getFirstMatch, responseMessage, updateData } from "../../helpers";
import { clearWishlistValidation, getWishlistValidation, wishlistValidation } from "../../validations";

export const wishlist = async (req, res) => {
    try {
        const { error, value } = wishlistValidation.validate(req.body);
        if (error)
            return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage('Validation Error'), {}, error.message));

        const { userId, productId } = value;

        const user = await getFirstMatch(UserModel, { _id: userId, isDeleted: false }, {}, {});
        if (!user)
            return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.getDataNotFound('User'), {}, error.message));

        const product = await getFirstMatch(ProductModel, { _id: productId, isDeleted: false }, {}, {});
        if (!product)
            return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.getDataNotFound('Product'), {}, error.message));

        // if product is already in wishlist then remove it
        const wishlist = await getFirstMatch(WishlistModel, { userId, productIds: { $in: [productId] } }, {}, {});
        if (wishlist) {
            const data = await updateData(WishlistModel, { _id: wishlist._id }, { $pull: { productIds: productId } }, { new: true });
            return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage('Product removed from wishlist'), data, error.message));
        }

        // if product is not in wishlist then add it
        const data = await updateData(WishlistModel, { userId }, { $push: { productIds: productId } }, { upsert: true, new: true });
        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage('Product added to wishlist'), data, error.message));

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

        // show the product details in wishlist
        let wishlist = await findOneAndPopulate(WishlistModel, { userId }, {}, {}, [{ path: "productIds" }]);
        if (!wishlist) wishlist = await createData(WishlistModel, { userId, productIds: [] });

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage('Wishlist retrieved successfully'), wishlist, {}));

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