import mongoose from "mongoose";
import { schemaOptions, userModelName, AccountType, Gender, LoginType } from "../../common";

// only 3 active session will be allowed
const activeSessionSchema = new mongoose.Schema({
    token: { type: String },
    device: { type: String },
    ip: { type: String },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
}, { _id: false });

export interface IUser {
    _id: string;
    name: string;
    nickName: string;
    email: string;
    password?: string;
    dateOfBirth: Date;
    gender: string;
    profilePicture: string;
    phone: string;
    country: string;
    accountType: string;
    loginType: string;
    socialId: string;
    pin: string;
    otp: string;
    activeSession: any[];
    isActive: boolean;
    isDeleted: boolean;
}

const userSchema = new mongoose.Schema({
    name: { type: String },
    nickName: { type: String },
    email: { type: String },
    password: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: Object.values(Gender), default: Gender.MALE },
    profilePicture: { type: String },
    phone: { type: String },
    country: { type: String },
    accountType: { type: String, enum: Object.values(AccountType), default: AccountType.USER },
    loginType: { type: String, enum: Object.values(LoginType), default: LoginType.EMAIL },
    socialId: { type: String, default: null },
    pin: { type: String },
    otp: { type: String },
    activeSession: { type: [activeSessionSchema], default: [] },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
}, schemaOptions);

export const UserModel = mongoose.model<IUser>(userModelName, userSchema);