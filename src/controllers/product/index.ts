import { skip } from "node:test";
import { apiResponse, orderModelName, productModelName, reviewModelName, STATUS_CODE } from "../../common";
import { ProductModel, VariantModel, OrderModel, ReviewModel } from "../../database";
import { countData, createData, getData, responseMessage, updateData, getFirstMatch, aggregateData } from "../../helpers";
import { addProductValidation, getProductValidation, updateProductValidation, getProductByIdValidation, deleteProductValidation, getProductBySlugValidation } from "../../validations";
import mongoose from "mongoose";

export const getProductStatsStages = () => {
    return [
        {
            $lookup: {
                from: reviewModelName,
                localField: "_id",
                foreignField: "productId",
                pipeline: [
                    {
                        $group: {
                            _id: "$productId",
                            averageRating: { $avg: "$rating" },
                            totalReviews: { $sum: 1 }
                        }
                    }
                ],
                as: "reviews"
            }
        },
        {
            $lookup: {
                from: orderModelName,
                localField: "_id",
                foreignField: "orderItems.productId",
                pipeline: [
                    { $unwind: "$orderItems" },
                    {
                        $group: {
                            _id: "$orderItems.productId",
                            totalSold: { $sum: "$orderItems.quantity" }
                        }
                    }
                ],
                as: "orders"
            }
        },
        {
            $addFields: {
                rating: { $ifNull: [{ $arrayElemAt: ["$reviews.averageRating", 0] }, 0] },
                totalReviews: { $ifNull: [{ $arrayElemAt: ["$reviews.totalReviews", 0] }, 0] },
                totalSold: { $ifNull: [{ $arrayElemAt: ["$orders.totalSold", 0] }, 0] }
            }
        },
        {
            $project: {
                reviews: 0,
                orders: 0
            }
        }
    ];
};

export const fetchSingleProductStats = async (productId: string | mongoose.Types.ObjectId) => {
    const stats = await aggregateData(ReviewModel, [
        { $match: { productId: new mongoose.Types.ObjectId(productId.toString()) } },
        {
            $facet: {
                reviewStats: [
                    {
                        $group: {
                            _id: "$productId",
                            averageRating: { $avg: "$rating" },
                            totalReviews: { $sum: 1 }
                        }
                    }
                ],
                orderStats: [
                    {
                        $lookup: {
                            from: orderModelName,
                            pipeline: [
                                { $unwind: "$orderItems" },
                                { $match: { "orderItems.productId": new mongoose.Types.ObjectId(productId.toString()) } },
                                {
                                    $group: {
                                        _id: "$orderItems.productId",
                                        totalSold: { $sum: "$orderItems.quantity" }
                                    }
                                }
                            ],
                            as: "sales"
                        }
                    },
                    { $unwind: { path: "$sales", preserveNullAndEmptyArrays: true } },
                    {
                        $group: {
                            _id: null,
                            totalSold: { $sum: "$sales.totalSold" }
                        }
                    }
                ]
            }
        }
    ]);

    const reviewInfo = stats[0]?.reviewStats[0] || { averageRating: 0, totalReviews: 0 };
    const orderInfo = stats[0]?.orderStats[0] || { totalSold: 0 };

    return {
        rating: reviewInfo.averageRating || 0,
        totalReviews: reviewInfo.totalReviews || 0,
        totalSold: orderInfo.totalSold || 0
    };
};

export const addProduct = async (req, res) => {
    try {
        const { error, value } = addProductValidation.validate(req.body);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        let slug = value.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

        let existingProduct = await getFirstMatch(ProductModel, { slug }, {}, {});
        if (existingProduct) {
            slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
        }

        const product = await createData(ProductModel, { ...value, slug });
        if (!product) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Product not added"), {}, {}));

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage("Product added successfully"), product, {}));

    } catch (error) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { error, value } = updateProductValidation.validate(req.body);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const product = await updateData(ProductModel, { _id: value.productId }, value, {});
        if (!product) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Product not updated"), {}, {}));

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage("Product updated successfully"), product, {}));

    } catch (error) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
};

export const getProduct = async (req, res) => {
    try {
        const { error, value } = getProductValidation.validate(req.query);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const { page, limit, search, categoryFilter, priceFilter, sort } = value;

        const query: any = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "si" } },
                { brand: { $regex: search, $options: "si" } },
            ];
        }

        if (categoryFilter) {
            query.categoryId = new mongoose.Types.ObjectId(categoryFilter);
        }

        if (priceFilter) {
            query.basePrice = { $gte: priceFilter[0], $lte: priceFilter[1] };
        }

        const skipVal = page > 1 ? (page - 1) * limit : 0;

        const products = await aggregateData(ProductModel, [
            { $match: { ...query, isDeleted: false } },
            { $sort: { createdAt: -1 } },
            ...(skipVal ? [{ $skip: skipVal }] : []),
            ...(limit ? [{ $limit: limit }] : []),
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
        ]);

        if (!products) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Products not found"), {}, {}));

        const total = await countData(ProductModel, { ...query, isDeleted: false });

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage("Products fetched successfully"), {
            products, total, state: {
                page, limit, totalPage: limit ? Math.ceil(total / limit) : 1
            }
        }, {}));

    } catch (error) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
}

export const getProductById = async (req, res) => {
    try {
        const { error, value } = getProductByIdValidation.validate(req.params);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const { id } = value;

        const product: any = await getFirstMatch(ProductModel, { _id: id, isDeleted: false }, {}, {});
        if (!product) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Product not found"), {}, {}));

        // Fetch Variants
        let variants: any[] = [];
        if (product.hasVariants) {
            variants = await getData(VariantModel, { productId: id, isDeleted: false }, {}, {});
        }

        // Fetch All Stats (Ratings, Reviews, Sales)
        const ratingInfo = await fetchSingleProductStats(product._id);

        const responseData = {
            _id: product._id,
            rating: ratingInfo.rating,
            totalReviews: ratingInfo.totalReviews,
            totalSold: ratingInfo.totalSold,
            product: {
                ...product,
                variants,
            }
        };

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.getDataSuccess("Product"), responseData, {}));
    } catch (error) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
}

export const deleteProduct = async (req, res) => {
    try {
        const { error, value } = deleteProductValidation.validate(req.params);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const product = await updateData(ProductModel, { _id: value.id, isDeleted: false }, { isDeleted: true }, {});
        if (!product) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Product not found"), {}, {}));

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.deleteDataSuccess("Product"), {}, {}));
    } catch (error) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
}

export const getProductBySlug = async (req, res) => {
    try {
        const { error, value } = getProductBySlugValidation.validate(req.params);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const { slug } = value;

        const product: any = await getFirstMatch(ProductModel, { slug, isDeleted: false }, {}, {});
        if (!product) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Product not found"), {}, {}));

        // Fetch Variants
        let variants: any[] = [];
        if (product.hasVariants) {
            variants = await getData(VariantModel, { productId: product._id, isDeleted: false }, {}, {});
        }

        // Fetch All Stats (Ratings, Reviews, Sales)
        const ratingInfo = await fetchSingleProductStats(product._id);

        const responseData = {
            _id: product._id,
            rating: ratingInfo.rating,
            totalReviews: ratingInfo.totalReviews,
            totalSold: ratingInfo.totalSold,
            product: {
                ...(product.toObject ? product.toObject() : product),
                variants
            }
        };

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.getDataSuccess("Product"), responseData, {}));
    } catch (error) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
}

export const getPopularProducts = async (req, res) => {
    try {
        let popularProducts = await aggregateData(OrderModel, [
            { $unwind: "$orderItems" },
            {
                $group: {
                    _id: "$orderItems.productId",
                    totalSold: { $sum: "$orderItems.quantity" }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: productModelName,
                    localField: "_id",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: "$product" },
            ...getProductStatsStages(),
            {
                $project: {
                    product: 1,
                    totalSold: 1,
                    rating: 1,
                    totalReviews: 1
                }
            }
        ]);

        if (popularProducts.length == 0) {
            popularProducts = await aggregateData(ProductModel, [
                { $match: { isDeleted: false, isActive: true } },
                { $sort: { createdAt: -1 } },
                { $limit: 10 },
                ...getProductStatsStages(),
                {
                    $project: {
                        product: "$$ROOT",
                        totalSold: 1,
                        rating: 1,
                        totalReviews: 1
                    }
                },
                {
                    $project: {
                        "product.rating": 0,
                        "product.totalReviews": 0,
                        "product.totalSold": 0
                    }
                }
            ]);
        }

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage("Popular products fetched successfully"), popularProducts, {}));

    } catch (error) {
        console.error("Get Popular Products Error:", error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
}

export const getRecommendedProducts = async (req, res) => {
    try {
        // Simple implementation: Random 10 active products
        const recommendedProducts = await aggregateData(ProductModel, [
            { $match: { isDeleted: false, isActive: true } },
            { $sample: { size: 10 } },
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
        ]);

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage("Recommended products fetched successfully"), recommendedProducts, {}));

    } catch (error) {
        console.error("Get Recommended Products Error:", error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
}

export const getBestSellers = async (req, res) => {
    // Currently same logic as Popular products, can be customized later
    return getPopularProducts(req, res);
}

export const getOfferProducts = async (req, res) => {
    try {
        const offers = await aggregateData(VariantModel, [
            {
                $match: {
                    isDeleted: false,
                    isActive: true,
                    $expr: { $gt: ["$compareAtPrice", "$price"] }
                }
            },
            {
                $addFields: {
                    discountAmount: { $subtract: ["$compareAtPrice", "$price"] },
                    discountPercentage: {
                        $multiply: [
                            { $divide: [{ $subtract: ["$compareAtPrice", "$price"] }, "$compareAtPrice"] },
                            100
                        ]
                    }
                }
            },
            { $sort: { discountPercentage: -1 } },
            { $limit: 20 },
            {
                $lookup: {
                    from: productModelName,
                    localField: "productId",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: "$product" },
            {
                $group: {
                    _id: "$productId",
                    variant: { $first: "$$ROOT" }, // Take the best offer variant
                    product: { $first: "$product" }
                }
            },
            ...getProductStatsStages()
        ]);

        // Flatten stats
        const result = offers.map(item => ({
            _id: item._id,
            rating: item.rating,
            totalReviews: item.totalReviews,
            totalSold: item.totalSold,
            product: {
                ...item.product,
                offerVariant: {
                    price: item.variant.price,
                    compareAtPrice: item.variant.compareAtPrice,
                    discountPercentage: item.variant.discountPercentage
                }
            }
        }));

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.customMessage("Offer products fetched successfully"), result, {}));

    } catch (error) {
        console.error("Get Offer Products Error:", error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
}
