import { Router } from "express";
import { cartController } from "../controllers";
import { roleCheck } from "../helpers";
import { AccountType } from "../common";

const router = Router();

router.post("/add", roleCheck([AccountType.USER, AccountType.ADMIN]), cartController.addToCart);
router.get("/get", roleCheck([AccountType.USER, AccountType.ADMIN]), cartController.getCart);
router.put("/update", roleCheck([AccountType.USER, AccountType.ADMIN]), cartController.updateQuantity);
router.delete("/remove", roleCheck([AccountType.USER, AccountType.ADMIN]), cartController.removeItem);
router.post("/apply-coupon", roleCheck([AccountType.USER, AccountType.ADMIN]), cartController.applyCoupon);
router.delete("/remove-coupon", roleCheck([AccountType.USER, AccountType.ADMIN]), cartController.removeCoupon);

export default router;
