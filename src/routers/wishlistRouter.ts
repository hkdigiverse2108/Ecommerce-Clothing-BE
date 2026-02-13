import { Router } from "express";
import { wishlistController } from "../controllers";
import { roleCheck } from "../helpers";
import { AccountType } from "../common";

const router = Router();

router.post("/", roleCheck([AccountType.USER, AccountType.ADMIN]), wishlistController.wishlist);
router.get("/", roleCheck([AccountType.USER, AccountType.ADMIN]), wishlistController.getWishlist);
router.delete("/:id", roleCheck([AccountType.USER, AccountType.ADMIN]), wishlistController.clearWishlist);

export default router;