import express from "express";
import { bannerController } from "../controllers";
import { AccountType } from "../common";
import { roleCheck } from "../helpers";

const router = express.Router();

router.post("/add-banner", roleCheck([AccountType.ADMIN]), bannerController.addBanner);
router.put("/update-banner", roleCheck([AccountType.ADMIN]), bannerController.updateBanner);
router.get("/get-banner", bannerController.getBanner);
router.get("/get-banner/:id", bannerController.getBannerById);
router.delete("/delete-banner/:id", roleCheck([AccountType.ADMIN]), bannerController.deleteBanner);

export default router;