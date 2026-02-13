import { OAuth2Client } from "google-auth-library";
import axios from "axios";
import { UserModel } from "../../database";
import { apiResponse, LoginType, AccountType, STATUS_CODE } from "../../common";
import { responseMessage, generateToken, createData, getFirstMatch, updateData, reqInfo, email_verification_mail, removeSensitiveData } from "../../helpers";
import { changePasswordValidation, createAdminValidation, forgotPasswordValidation, loginValidation, registerValidation, resetPasswordValidation, socialLoginValidation, verifyOtpValidation } from "../../validations";
import bcrypt from "bcryptjs";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const socialLogin = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = socialLoginValidation.validate(req.body);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const { token, loginType } = value;
        let email: string | undefined;
        let socialId: string | undefined;
        let name: string | undefined;
        let profilePicture: string | undefined;

        if (loginType === LoginType.GOOGLE) {
            const ticket = await googleClient.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            if (!payload) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.invalidIdTokenAndAccessToken, {}, {}));

            email = payload.email;
            socialId = payload.sub;
            name = payload.name;
            profilePicture = payload.picture;
        } else if (loginType === LoginType.FACEBOOK) {
            const { data } = await axios.get(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${token}`);
            if (!data) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.invalidIdTokenAndAccessToken, {}, {}));

            email = data.email;
            socialId = data.id;
            name = data.name;
            profilePicture = data.picture?.data?.url;
        } else {
            return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Invalid login type"), {}, {}));
        }

        if (!email) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.invalidEmail, {}, {}));

        let user: any = await getFirstMatch(UserModel, { email, isDeleted: false }, {}, {});

        if (!user) {
            // Register new user
            user = await createData(UserModel, {
                email,
                name,
                profilePicture,
                accountType: AccountType.USER,
                loginType: loginType,
                socialId: socialId,
                isActive: true,
            });
        } else {
            // Update existing user info if needed or just login
            // If user registered with email previously, this links the account if implementation dictates
            if (user.loginType === LoginType.EMAIL) {
                // Optional: Update to social login or allow both. For now, we proceed.
            }
        }

        const authToken = generateToken({ id: user._id, accountType: user.accountType });

        // Add active session
        await updateData(UserModel, { _id: user._id }, {
            $push: {
                activeSession: {
                    $each: [{
                        token: authToken,
                        device: req.headers["user-agent"],
                        ip: req.ip,
                    }],
                    $slice: -3
                }
            }
        }, {});

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.loginSuccess, { token: authToken, user }, {}));

    } catch (error: any) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
}

export const register = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = registerValidation.validate(req.body);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const { email, password } = value;

        const hashPassword = await bcrypt.hash(password, 10);

        let user: any = await getFirstMatch(UserModel, { email, isDeleted: false }, {}, {});

        if (user) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.alreadyEmail, {}, {}));

        user = await createData(UserModel, {
            email,
            password: hashPassword,
            accountType: AccountType.USER,
            loginType: LoginType.EMAIL,
            isActive: true,
        });

        const authToken = generateToken({ id: user._id, accountType: user.accountType });

        // Add active session
        await updateData(UserModel, { _id: user._id }, {
            $push: {
                activeSession: {
                    $each: [{
                        token: authToken,
                        device: req.headers["user-agent"],
                        ip: req.ip,
                    }],
                    $slice: -3
                }
            }
        }, {});

        const sanitizedUser = removeSensitiveData(user, ["password", "pin", "otp", "activeSession", "isDeleted", "socialId"]);

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.signupSuccess, { token: authToken, user: sanitizedUser }, {}));
    } catch (error: any) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
}

export const login = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = loginValidation.validate(req.body);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const { email, password } = value;

        let user: any = await getFirstMatch(UserModel, { email, isDeleted: false }, {}, {});

        if (!user) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.invalidEmail, {}, {}));

        if (user.loginType !== LoginType.EMAIL) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.invalidLoginType, {}, {}));

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Invalid password"), {}, {}));

        const authToken = generateToken({ id: user._id, accountType: user.accountType });

        // Add active session
        await updateData(UserModel, { _id: user._id }, {
            $push: {
                activeSession: {
                    $each: [{
                        token: authToken,
                        device: req.headers["user-agent"],
                        ip: req.ip,
                    }],
                    $slice: -3
                }
            }
        }, {});

        const sanitizedUser = removeSensitiveData(user, ["password", "pin", "otp", "activeSession", "isDeleted", "socialId"]);

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.loginSuccess, { token: authToken, user: sanitizedUser }, {}));
    } catch (error: any) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
};

export const forgotPassword = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = forgotPasswordValidation.validate(req.body);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const { email } = value;

        let user: any = await getFirstMatch(UserModel, { email, isDeleted: false }, {}, {});

        if (!user) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.invalidEmail, {}, {}));

        const otp = Math.floor(100000 + Math.random() * 900000);
        await updateData(UserModel, { _id: user._id }, { otp }, {});

        await email_verification_mail(user, otp);

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.otpSent, {}, {}));
    } catch (error: any) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
};

export const verifyOtp = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = verifyOtpValidation.validate(req.body);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const { email, otp } = value;

        let user: any = await getFirstMatch(UserModel, { email, isDeleted: false }, {}, {});

        if (!user) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.invalidEmail, {}, {}));

        if (user.otp !== otp) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.invalidOTP, {}, {}));

        await updateData(UserModel, { _id: user._id }, { otp: null }, {});

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.OTPVerified, {}, {}));
    } catch (error: any) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
};

export const resetPassword = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = resetPasswordValidation.validate(req.body);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const { email, password } = value;

        let user: any = await getFirstMatch(UserModel, { email, isDeleted: false }, {}, {});

        if (!user) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.invalidEmail, {}, {}));

        const hashPassword = await bcrypt.hash(password, 10);
        await updateData(UserModel, { _id: user._id }, { password: hashPassword }, {});

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.resetPasswordSuccess, {}, {}));
    } catch (error: any) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
};

export const changePassword = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = changePasswordValidation.validate(req.body);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const { email, oldPassword, newPassword } = value;

        let user: any = await getFirstMatch(UserModel, { email, isDeleted: false }, {}, {});

        if (!user) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.invalidEmail, {}, {}));

        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordValid) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("Invalid password"), {}, {}));

        const hashPassword = await bcrypt.hash(newPassword, 10);
        await updateData(UserModel, { _id: user._id }, { password: hashPassword }, {});

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.passwordChangeSuccess, {}, {}));
    } catch (error: any) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
};

export const createAdmin = async (req, res) => {
    reqInfo(req);
    try {
        const { error, value } = createAdminValidation.validate(req.body);
        if (error) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage(error.details[0].message), {}, {}));

        const { email, password } = value;

        let user: any = await getFirstMatch(UserModel, { email, isDeleted: false }, {}, {});

        if (user) return res.status(STATUS_CODE.BAD_REQUEST).json(new apiResponse(STATUS_CODE.BAD_REQUEST, responseMessage.customMessage("User already exists"), {}, {}));

        const hashPassword = await bcrypt.hash(password, 10);
        await createData(UserModel, { email, password: hashPassword, accountType: AccountType.ADMIN });

        return res.status(STATUS_CODE.SUCCESS).json(new apiResponse(STATUS_CODE.SUCCESS, responseMessage.signupSuccess, {}, {}));
    } catch (error: any) {
        console.error(error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json(new apiResponse(STATUS_CODE.INTERNAL_SERVER_ERROR, responseMessage.internalServerError, {}, error));
    }
};