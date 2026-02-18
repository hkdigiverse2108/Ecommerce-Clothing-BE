import mongoose from "mongoose";
import { productModelName, schemaOptions, userModelName, wishlistModelName } from "../../common";

const wishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: userModelName,
        required: true,
        unique: true,
    },
    productIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: productModelName,
    }]
}, schemaOptions);

export const WishlistModel = mongoose.model(wishlistModelName, wishlistSchema);