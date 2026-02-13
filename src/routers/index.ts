import { Router } from "express";
import authRouter from "./authRouter";
import userRouter from "./userRouter";
import deleteRequestRouter from "./uploadRouter";
import addressRouter from "./addressRouter";
import categoryRouter from "./categoryRouter";
import productRouter from "./productRouter";
import variantRouter from "./variantRouter";
import colorRouter from "./colorRouter";
import wishlistRouter from "./wishlistRouter";
import cartRouter from "./cartRouter";
import couponRouter from "./couponRouter";
import taxRouter from "./taxRouter";
import orderRouter from "./orderRouter";
import reviewRouter from "./reviewRouter";
import bannerRouter from "./bannerRouter";
import walletRouter from "./walletRouter";

const router = Router();

router.use("/auth", authRouter);
router.use("/user", userRouter);
router.use("/delete-request", deleteRequestRouter);
router.use("/address", addressRouter);
router.use("/category", categoryRouter);
router.use("/product", productRouter);
router.use("/variant", variantRouter);
router.use("/color", colorRouter);
router.use("/wishlist", wishlistRouter);
router.use("/cart", cartRouter);
router.use("/coupon", couponRouter);
router.use("/tax", taxRouter);
router.use("/order", orderRouter);
router.use("/review", reviewRouter);
router.use("/banner", bannerRouter);
router.use("/wallet", walletRouter);

export { router };