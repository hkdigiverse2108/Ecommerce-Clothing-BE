import mongoose from "mongoose";

export const schemaOptions: mongoose.SchemaOptions = {
    timestamps: true,
    versionKey: false,
};
