import { Request, Response } from "express";
import { apiResponse, STATUS_CODE, TransactionStatus, TransactionType } from "../../common";
import { TransactionModel, UserModel } from "../../database";
import { countData, createData, getData, updateData } from "../../helpers";

export const getWallet = async (req: Request, res: Response) => {
    try {
        const user: any = req.headers.user;
        // User is already verified and attached to headers by verifyToken middleware

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, "Wallet fetched successfully", user.wallet, null));
    } catch (error) {
        console.error("Error fetching wallet:", error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, "Internal server error", null, error));
    }
};

export const getTransactions = async (req: Request, res: Response) => {
    try {
        const user: any = req.headers.user;
        const userId = user._id;
        const { page = 1, limit = 10 } = req.query;

        const skip = (Number(page) - 1) * Number(limit);

        const transactions = await getData(TransactionModel, { user: userId }, {}, { sort: { createdAt: -1 }, skip, limit: Number(limit) });

        const total = await countData(TransactionModel, { user: userId });

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, "Transactions fetched successfully", {
            transactions,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit))
            }
        }, null));
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, "Internal server error", null, error));
    }
};

export const addMoney = async (req: Request, res: Response) => {
    try {
        const user: any = req.headers.user;
        const userId = user._id;
        const { amount, description } = req.body;

        if (!amount || amount <= 0) {
            return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, "Invalid amount", null, null));
        }

        const balanceBefore = user.wallet.balance;
        const balanceAfter = balanceBefore + amount;

        const transaction = await createData(TransactionModel, {
            user: userId,
            amount,
            type: TransactionType.CREDIT,
            description: description || "Added money to wallet",
            status: TransactionStatus.COMPLETED,
            balanceBefore,
            balanceAfter,
        });

        // Update user wallet using updateData helper
        await updateData(UserModel, { _id: userId }, {
            $set: { "wallet.balance": balanceAfter }
        }, {});

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, "Money added successfully", {
            balance: balanceAfter,
            transaction
        }, null));

    } catch (error) {
        console.error("Error adding money:", error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, "Internal server error", null, error));
    }
};
