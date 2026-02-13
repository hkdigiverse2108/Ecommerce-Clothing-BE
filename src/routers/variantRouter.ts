import { Router } from "express";
import { variantController } from "../controllers";
import { roleCheck } from "../helpers";
import { AccountType } from "../common";

const router = Router();

router.post("/create", roleCheck([AccountType.ADMIN]), variantController.addVariant);
router.put("/update", roleCheck([AccountType.ADMIN]), variantController.updateVariant);
router.get("/get", roleCheck([AccountType.USER, AccountType.ADMIN]), variantController.getVariants);
router.get("/get/:id", roleCheck([AccountType.USER, AccountType.ADMIN]), variantController.getVariantById);
router.delete("/delete/:id", roleCheck([AccountType.ADMIN]), variantController.deleteVariant);

export default router;
