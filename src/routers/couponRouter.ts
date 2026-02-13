import { Router } from "express";
import { couponController } from "../controllers";
import { roleCheck } from "../helpers";
import { AccountType } from "../common";

const router = Router();

router.post("/create", roleCheck([AccountType.ADMIN]), couponController.addCoupon);
router.put("/update", roleCheck([AccountType.ADMIN]), couponController.updateCoupon);
router.get("/get", roleCheck([AccountType.USER, AccountType.ADMIN]), couponController.getCoupon);
router.get("/get/:id", roleCheck([AccountType.USER, AccountType.ADMIN]), couponController.getCouponById);
router.delete("/delete/:id", roleCheck([AccountType.ADMIN]), couponController.deleteCoupon);

export default router;
