import { Router } from "express";
import { addressController } from "../controllers";
import { roleCheck } from "../helpers";
import { AccountType } from "../common";

const router = Router();

router.post("/add", roleCheck([AccountType.USER, AccountType.ADMIN]), addressController.addAddress);
router.put("/update", roleCheck([AccountType.USER, AccountType.ADMIN]), addressController.updateAddress);
router.get("/get", roleCheck([AccountType.USER, AccountType.ADMIN]), addressController.getAddress);
router.get("/get/:id", roleCheck([AccountType.USER, AccountType.ADMIN]), addressController.getById);
router.delete("/delete/:id", roleCheck([AccountType.USER, AccountType.ADMIN]), addressController.deleteAddress);

export default router;