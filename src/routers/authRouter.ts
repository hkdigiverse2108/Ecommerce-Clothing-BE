import { Router } from "express";
import { authController } from "../controllers";

const router = Router();

router.post("/social-login", authController.socialLogin);
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/forgotPassword", authController.forgotPassword);
router.post("/verifyOtp", authController.verifyOtp);
router.post("/resetPassword", authController.resetPassword);
router.post("/changePassword", authController.changePassword);
router.post("/createAdmin", authController.createAdmin);

export default router;