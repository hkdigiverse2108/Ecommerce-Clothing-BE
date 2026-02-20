import { apiResponse, STATUS_CODE } from "../../common";
import { CartModel, CouponModel, ProductModel, VariantModel } from "../../database";
import { TaxModel } from "../../database/models/taxModel";
import { responseMessage, createData, getData, updateData, getFirstMatch, reqInfo } from "../../helpers";
import { addToCartValidation, applyCouponValidation, removeItemValidation, updateQuantityValidation } from "../../validations";

const calcCartTotal = async (cart: any) => {
    let subtotal = 0;
    for (const item of cart.items) {
        let price = 0;
        if (item.variantId) {
            const variant: any = await VariantModel.findById(item.variantId);
            price = variant ? variant.price : 0;
        } else {
            const product: any = await ProductModel.findById(item.productId);
            price = product ? product.basePrice : 0;
        }
        subtotal += price * item.quantity;
        item.price = price;
    }
    cart.subtotal = subtotal;

    let discount = 0;
    if (cart.couponCode) {
        const coupon: any = await CouponModel.findById(cart.couponCode);
        if (coupon && coupon.isActive) {
            // Basic checks
            if (cart.subtotal >= coupon.minOrderAmount) {
                if (coupon.discountType === "percentage") {
                    discount = (cart.subtotal * coupon.discount) / 100;
                    if (coupon.maxDiscountAmount > 0) {
                        discount = Math.min(discount, coupon.maxDiscountAmount);
                    }
                } else {
                    discount = coupon.discount;
                }
            }
        }
    }
    cart.couponDiscount = discount;
    cart.discount = discount; // Total discount

    // Tax and Shipping logic can be added here
    const tax: any = await getFirstMatch(TaxModel, { isDefault: true, isActive: true, isDeleted: false }, {}, {});
    cart.tax = tax ? (cart.subtotal - cart.discount) * tax.percentage / 100 : 0;
    cart.taxId = tax ? tax._id : null;
    cart.shipping = 0;

    cart.total = Math.max(0, cart.subtotal - cart.discount + cart.tax + cart.shipping);
    return cart;
};

export const addToCart = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = addToCartValidation.validate(req.body);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const { productId, variantId, quantity } = value;
        if (!req.headers.user) {
            console.error("req.headers.user is missing!");
            return res.status(STATUS_CODE.UNAUTHORIZED).json(new apiResponse(STATUS_CODE.UNAUTHORIZED, responseMessage.customMessage("User not authenticated"), {}, {}));
        }
        console.log(req.headers.user);
        const userId = req.headers.user._id;



        let cart: any = await getFirstMatch(CartModel, { userId }, {}, {});

        if (!cart) {

            const newCart: any = await createData(CartModel, { userId, items: [] });
            if (!newCart) throw new Error("Failed to create cart");

            cart = newCart.toObject ? newCart.toObject() : newCart;
        } else {

        }

        const existingItemIndex = cart.items.findIndex(item =>
            item.productId.toString() === productId &&
            ((!item.variantId && !variantId) || (item.variantId && item.variantId.toString() === variantId))
        );

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            cart.items.push({ productId, variantId, quantity });
        }

        cart = await calcCartTotal(cart);
        const { _id, ...cartData } = cart;
        await updateData(CartModel, { _id: cart._id }, cartData, {});

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage("Item added to cart"), cart, {}));

    } catch (error: any) {
        console.error("Cart Add Error:", error);
        const errObj = {
            message: error.message,
            stack: error.stack,
            ...error
        };
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, errObj));
    }
};

export const getCart = async (req, res) => {
    try {
        const userId = req.headers.user._id;
        let cart: any = await getFirstMatch(CartModel, { userId }, {}, {});

        if (!cart) {
            return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage("Cart is empty"), { items: [] }, {}));
        }

        cart = await calcCartTotal(cart);
        const { _id, ...cartData } = cart;
        await updateData(CartModel, { _id: cart._id }, cartData, {});

        const populatedCart = await CartModel.findById(cart._id).populate("items.productId", "name basePrice baseImage stock").populate("items.variantId", "price attributes stock");

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage("Cart fetched successfully"), populatedCart, {}));

    } catch (error: any) {
        console.error("Cart Get Error:", error);
        const errObj = {
            message: error.message,
            stack: error.stack,
            ...error
        };
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, errObj));
    }
};

export const updateQuantity = async (req, res) => {
    try {
        const { error, value } = updateQuantityValidation.validate(req.body);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const { productId, variantId, quantity } = value;
        const userId = req.headers.user._id;

        let cart: any = await getFirstMatch(CartModel, { userId }, {}, {});
        if (!cart) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Cart not found"), {}, {}));

        const itemIndex = cart.items.findIndex(item =>
            item.productId.toString() === productId &&
            ((!item.variantId && !variantId) || (item.variantId && item.variantId.toString() === variantId))
        );

        if (itemIndex > -1) {
            cart.items[itemIndex].quantity = quantity;
            cart = await calcCartTotal(cart);
            const { _id, ...cartData } = cart;
            await updateData(CartModel, { _id: cart._id }, cartData, {});
            const populatedCart = await CartModel.findById(cart._id).populate("items.productId", "name basePrice baseImage stock").populate("items.variantId", "price attributes stock");
            return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage("Cart updated successfully"), populatedCart, {}));
        } else {
            return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Item not found in cart"), {}, {}));
        }

    } catch (error: any) {
        console.error("Cart Update Error:", error);
        const errObj = {
            message: error.message,
            stack: error.stack,
            ...error
        };
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, errObj));
    }
};

export const removeItem = async (req, res) => {
    try {
        const { error, value } = removeItemValidation.validate(req.body);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const { productId, variantId } = value;
        const userId = req.headers.user._id;

        let cart: any = await getFirstMatch(CartModel, { userId }, {}, {});
        if (!cart) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Cart not found"), {}, {}));

        cart.items = cart.items.filter(item =>
            !(item.productId.toString() === productId &&
                ((!item.variantId && !variantId) || (item.variantId && item.variantId.toString() === variantId)))
        );

        cart = await calcCartTotal(cart);
        const { _id, ...cartData } = cart;
        await updateData(CartModel, { _id: cart._id }, cartData, {});

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage("Item removed from cart"), cart, {}));

    } catch (error) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
};

export const applyCoupon = async (req, res) => {
    try {
        const { error, value } = applyCouponValidation.validate(req.body);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const { code } = value;
        const userId = req.headers.user._id;

        const coupon: any = await getFirstMatch(CouponModel, { code, isDeleted: false, isActive: true }, {}, {});
        if (!coupon) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Invalid or expired coupon"), {}, {}));

        // Date Check
        const now = new Date();
        if (now < new Date(coupon.startDate) || (coupon.endDate && now > new Date(coupon.endDate))) {
            return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Coupon is not valid at this time"), {}, {}));
        }

        // Usage Limit Check (Global)
        if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
            return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Coupon usage limit reached"), {}, {}));
        }

        let cart: any = await getFirstMatch(CartModel, { userId }, {}, {});
        if (!cart) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Cart not found"), {}, {}));

        if (cart.subtotal < coupon.minOrderAmount) {
            return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(`Minimum order amount of ${coupon.minOrderAmount} required`), {}, {}));
        }

        cart.couponCode = coupon._id;
        cart = await calcCartTotal(cart);
        const { _id, ...cartData } = cart;
        await updateData(CartModel, { _id: cart._id }, cartData, {});
        const populatedCart = await CartModel.findById(cart._id).populate("items.productId", "name basePrice baseImage stock").populate("items.variantId", "price attributes stock");
        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage("Coupon applied successfully"), populatedCart, {}));

    } catch (error) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
};

export const removeCoupon = async (req, res) => {
    try {
        const userId = req.headers.user._id;
        let cart: any = await getFirstMatch(CartModel, { userId }, {}, {});
        if (!cart) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Cart not found"), {}, {}));

        cart.couponCode = undefined;
        cart = await calcCartTotal(cart);
        const { _id, ...cartData } = cart;
        await updateData(CartModel, { _id: cart._id }, cartData, {});

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage("Coupon removed successfully"), cart, {}));
    } catch (error) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
}
