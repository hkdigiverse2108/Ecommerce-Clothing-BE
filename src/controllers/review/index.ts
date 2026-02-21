import { apiResponse, STATUS_CODE } from "../../common";
import { ReviewModel, OrderModel } from "../../database";
import { responseMessage, createData, getFirstMatch, reqInfo } from "../../helpers";
import { addReviewValidation } from "../../validations";

export const addReview = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = addReviewValidation.validate(req.body);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const userId = req.headers.user._id;
        const { productId, orderId, rating, review } = value;

        // Verify that the user has purchased the product in the given order
        const order: any = await getFirstMatch(OrderModel, { _id: orderId, userId, orderStatus: "DELIVERED" }, {}, {});
        // Note: Checking strict "DELIVERED" status. If not delivered, maybe they can't review yet.
        // Also need to check if productId is in orderItems.

        if (!order) {
            return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Order not found or not passed delivered yet"), {}, {}));
        }

        const productInOrder = order.orderItems.some((item: any) => item.productId.toString() === productId);
        if (!productInOrder) {
            return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Product not found in this order"), {}, {}));
        }

        // Check if review already exists
        const existingReview = await getFirstMatch(ReviewModel, { userId, productId, orderId }, {}, {});
        if (existingReview) {
            return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("You have already reviewed this product for this order"), {}, {}));
        }

        const reviewData = {
            userId,
            productId,
            orderId,
            rating,
            review
        };

        const newReview = await createData(ReviewModel, reviewData);

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage("Review added successfully"), newReview, {}));

    } catch (error) {
        console.error("Add Review Error:", error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
};
