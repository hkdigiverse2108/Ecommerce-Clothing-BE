import { apiResponse, STATUS_CODE, PaymentStatus, PaymentMethod, OrderStatus, TransactionType, TransactionStatus } from "../../common";
import { OrderModel, CartModel, ProductModel, VariantModel, AddressModel, TransactionModel, UserModel } from "../../database";
import { responseMessage, getFirstMatch, createData, updateData, deleteData, countData, getData, reqInfo } from "../../helpers";
import { createOrderValidation, getMyOrdersValidation, getOrderByIdValidation } from "../../validations";

import Razorpay from "razorpay";

export const createOrder = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = createOrderValidation.validate(req.body);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const user = req.headers.user;
        const userId = user._id;
        const { shippingAddressId, billingAddressId, paymentMethod, paymentId, productId, variantId, quantity } = value;

        let orderItems: any[] = [];
        let subtotal = 0;
        let discount = 0;
        let shipping = 0;
        let tax = 0;
        let couponId = undefined;
        let isBuyNow = false;

        // --- SCENARIO 1: BUY NOW (Direct Item) ---
        if (productId) {
            isBuyNow = true;
            if (!quantity || quantity < 1) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Quantity is required for direct purchase"), {}, {}));

            // Validate Stock for Single Item
            let price = 0;
            if (variantId) {
                const variant: any = await getFirstMatch(VariantModel, { _id: variantId }, {}, {});
                if (!variant) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Variant not found"), {}, {}));
                if (variant.stock < quantity) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(`Insufficient stock. Available: ${variant.stock}`), {}, {}));
                price = variant.price;
            } else {
                const product: any = await getFirstMatch(ProductModel, { _id: productId }, {}, {});
                if (!product) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Product not found"), {}, {}));
                if (product.stock < quantity) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(`Insufficient stock. Available: ${product.stock}`), {}, {}));
                price = product.basePrice;
            }

            subtotal = price * quantity;
            orderItems.push({
                productId,
                variantId,
                quantity,
                price
            });
        }
        // --- SCENARIO 2: CART CHECKOUT ---
        else {
            const cart: any = await getFirstMatch(CartModel, { userId }, {}, {});
            if (!cart || cart.items.length === 0) {
                return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Cart is empty"), {}, {}));
            }

            // Validate Stock for ALL Cart Items
            for (const item of cart.items) {
                let price = 0;
                if (item.variantId) {
                    const variant: any = await getFirstMatch(VariantModel, { _id: item.variantId }, {}, {});
                    if (!variant) throw new Error(`Variant not found for product ${item.productId}`);
                    if (variant.stock < item.quantity) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(`Insufficient stock for variant. Available: ${variant.stock}`), {}, {}));
                    price = variant.price;
                } else {
                    const product: any = await getFirstMatch(ProductModel, { _id: item.productId }, {}, {});
                    if (!product) throw new Error(`Product not found ${item.productId}`);
                    if (product.stock < item.quantity) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(`Insufficient stock for product. Available: ${product.stock}`), {}, {}));
                    price = product.basePrice;
                }

                orderItems.push({
                    productId: item.productId,
                    variantId: item.variantId,
                    quantity: item.quantity,
                    price: price
                });
            }

            subtotal = cart.subtotal;
            discount = cart.discount;
            shipping = cart.shipping;
            tax = cart.tax;
            couponId = cart.couponCode;
        }

        // Validate Address
        const shippingAddress = await getFirstMatch(AddressModel, { _id: shippingAddressId, userId }, {}, {});
        if (!shippingAddress) {
            return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Invalid shipping address"), {}, {}));
        }

        const finalAmount = Math.max(0, subtotal - discount + tax + shipping);

        // Payment Processing Preparation
        let paymentStatus = PaymentStatus.PENDING;

        // WALLET PRE-CHECK (Optimistic)
        if (paymentMethod === PaymentMethod.WALLET) {
            const currentUser = await getFirstMatch(UserModel, { _id: userId }, {}, {});
            if (!currentUser || currentUser.wallet.balance < finalAmount) {
                return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Insufficient wallet balance"), {}, {}));
            }
        }

        // Create Pending Order
        const orderData = {
            userId,
            orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            orderStatus: OrderStatus.PENDING,
            paymentStatus, // Initially PENDING
            totalAmount: subtotal,
            shippingAddress: shippingAddressId,
            billingAddress: billingAddressId || shippingAddressId,
            paymentMethod,
            paymentId,
            couponId,
            discountAmount: discount,
            shippingAmount: shipping,
            taxAmount: tax,
            finalAmount,
            orderDate: new Date(),
            orderItems
        };

        const newOrder = await createData(OrderModel, orderData);

        // Process Payment (Post Order Creation)
        if (paymentMethod === PaymentMethod.ONLINE) {
            if (!paymentId) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Payment ID required for online payment"), {}, {}));

            const razorpay = new Razorpay({
                key_id: "rzp_test_PLACEHOLDER",
                key_secret: "PLACEHOLDER_SECRET"
            });

            try {
                const payment = await razorpay.payments.fetch(paymentId);
                if (payment.status === "captured") {
                    paymentStatus = PaymentStatus.COMPLETED;
                    await updateData(OrderModel, { _id: newOrder._id }, { paymentStatus: PaymentStatus.COMPLETED }, {});
                } else {
                    // If online payment failed (or wasn't captured), we leave it as Pending or mark as Failed?
                    // Usually for 'captured' check it's strictly success.
                    await updateData(OrderModel, { _id: newOrder._id }, { paymentStatus: PaymentStatus.FAILED, orderStatus: OrderStatus.CANCELLED }, {});
                    return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Payment not captured"), {}, {}));
                }
            } catch (error) {
                console.log("Razorpay Error:", error);
                await updateData(OrderModel, { _id: newOrder._id }, { paymentStatus: PaymentStatus.FAILED, orderStatus: OrderStatus.CANCELLED }, {});
                return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Payment verification failed"), {}, error));
            }
        } else if (paymentMethod === PaymentMethod.WALLET) {
            // Atomic Deduction
            const updatedUser = await updateData(UserModel,
                { _id: userId, "wallet.balance": { $gte: finalAmount } },
                { $inc: { "wallet.balance": -finalAmount } },
                { new: true }
            );

            if (updatedUser) {
                // Deduction Success
                paymentStatus = PaymentStatus.COMPLETED;

                await updateData(OrderModel, { _id: newOrder._id }, { paymentStatus: PaymentStatus.COMPLETED }, {});

                // Record Transaction
                await createData(TransactionModel, {
                    user: userId,
                    amount: finalAmount,
                    type: TransactionType.DEBIT,
                    description: `Payment for Order #${newOrder.orderNumber}`,
                    status: TransactionStatus.COMPLETED,
                    balanceBefore: updatedUser.wallet.balance + finalAmount,
                    balanceAfter: updatedUser.wallet.balance,
                });
            } else {
                // Deduction Failed (Insufficient Funds likely, or race condition)
                await updateData(OrderModel, { _id: newOrder._id }, { paymentStatus: PaymentStatus.FAILED, orderStatus: OrderStatus.CANCELLED }, {});
                return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Payment failed: Insufficient wallet balance"), {}, {}));
            }
        }

        // Inventory Update & Cart Cleanup (Only if payment is successful or COD)
        // If Wallet/Online payment failed, we already returned or cancelled.
        // For COD, paymentStatus is PENDING but we confirm order.

        // Note: For Online/Wallet, we only reach here if payment was successful (User updated or Razorpay verified)

        if (isBuyNow) {
            if (variantId) {
                await updateData(VariantModel, { _id: variantId }, { $inc: { stock: -quantity } }, {});
            } else {
                await updateData(ProductModel, { _id: productId }, { $inc: { stock: -quantity } }, {});
            }
        } else {
            for (const item of orderItems) {
                if (item.variantId) {
                    await updateData(VariantModel, { _id: item.variantId }, { $inc: { stock: -item.quantity } }, {});
                } else {
                    await updateData(ProductModel, { _id: item.productId }, { $inc: { stock: -item.quantity } }, {});
                }
            }
            await deleteData(CartModel, { userId });
        }

        // Refetch order to get latest status if needed, or just return newOrder with updated status
        const finalOrder = await getFirstMatch(OrderModel, { _id: newOrder._id }, {}, {});

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage("Order placed successfully"), finalOrder, {}));

    } catch (error: any) {
        console.error("Create Order Error:", error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
};

export const getMyOrders = async (req, res) => {
    reqInfo(req);
    try {
        const user = req.headers.user;
        const userId = user ? user._id : null;
        if (!userId) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("User not found"), {}, {}));

        const { error, value } = getMyOrdersValidation.validate(req.query);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const { page = 1, limit, sort = -1, status } = value;

        const skip = (Number(page) - 1) * Number(limit);
        const query: any = { userId };

        if (status) {
            query.orderStatus = status;
        }

        let sortValue: any = -1;
        if (sort) {
            sortValue = sort;
        }

        const myOrders = await getData(OrderModel, query, {}, { sort: { createdAt: sortValue }, skip, limit: Number(limit) });

        const totalOrders = await countData(OrderModel, query);

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage("Orders fetched successfully"), {
            orders: myOrders,
            total: totalOrders,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(totalOrders / Number(limit))
        }, {}));
    } catch (error: any) {
        console.error("Get Orders Error:", error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
};

export const getOrderById = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = getOrderByIdValidation.validate(req.params);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const { id } = value;
        const userId = req.headers.user._id;

        const order = await getFirstMatch(OrderModel, { _id: id, userId }, {}, {});

        if (!order) {
            return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Order not found"), {}, {}));
        }

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage("Order fetched successfully"), order, {}));
    } catch (error: any) {
        console.error("Get Order By ID Error:", error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
};