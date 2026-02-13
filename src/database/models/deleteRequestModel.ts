import mongoose from "mongoose";
import { DELETE_REQUEST_STATUS, deleteRequestModelName, schemaOptions, userModelName } from "../../common";

const deleteRequestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: userModelName },
    status: { type: String, enum: Object.values(DELETE_REQUEST_STATUS), default: DELETE_REQUEST_STATUS.PENDING },
}, schemaOptions);

export const deleteRequestModel = mongoose.model(deleteRequestModelName, deleteRequestSchema);