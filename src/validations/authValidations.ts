import joi from "joi";
import { LoginType } from "../common";

export const registerValidation = joi.object({
    email: joi.string().email().required(),
    password: joi.string().required(),
});

export const loginValidation = joi.object({
    email: joi.string().email().required(),
    password: joi.string().required(),
});

export const forgotPasswordValidation = joi.object({
    email: joi.string().email().required(),
});

export const resetPasswordValidation = joi.object({
    email: joi.string().email().required(),
    password: joi.string().required(),
});

export const verifyOtpValidation = joi.object({
    email: joi.string().email().required(),
    otp: joi.string().required(),
});

export const changePasswordValidation = joi.object({
    email: joi.string().email().required(),
    oldPassword: joi.string().required(),
    newPassword: joi.string().required(),
});

export const socialLoginValidation = joi.object({
    token: joi.string().required(),
    loginType: joi.string().valid(LoginType.GOOGLE, LoginType.FACEBOOK).required(),
});

export const createAdminValidation = joi.object({
    email: joi.string().email().required(),
    password: joi.string().required(),
});