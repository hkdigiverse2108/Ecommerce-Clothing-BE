import { aggregateData } from "../../helpers";
import { orderModelName, reviewModelName } from "../../common";
import { ReviewModel } from "../../database";
import mongoose from "mongoose";

/**
 * Returns reusable aggregation stages for fetching product stats:
 * - averageRating
 * - totalReviews
 * - totalSold
 */
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

/**
 * Fetches stats for a single product. 
 * Useful for getProductById and getProductBySlug.
 */
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
