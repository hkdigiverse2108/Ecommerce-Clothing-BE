import mongoose, { Document, Schema } from "mongoose";
import { schemaOptions, transactionModelName, userModelName, TransactionType, TransactionStatus } from "../../common";

export interface ITransaction extends Document {
    user: mongoose.Types.ObjectId;
    amount: number;
    type: TransactionType;
    description?: string;
    status: TransactionStatus;
    referenceId?: string;
    balanceBefore: number;
    balanceAfter: number;
    createdAt: Date;
    updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
    user: { type: Schema.Types.ObjectId, ref: userModelName, required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: Object.values(TransactionType), required: true },
    description: { type: String },
    status: { type: String, enum: Object.values(TransactionStatus), default: TransactionStatus.PENDING },
    referenceId: { type: String },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
}, schemaOptions as any);

export const TransactionModel = mongoose.model<ITransaction>(transactionModelName, transactionSchema);
