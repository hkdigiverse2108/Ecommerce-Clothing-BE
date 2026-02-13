import { Router } from "express";
import { taxController } from "../controllers";
import { AccountType } from "../common";
import { roleCheck } from "../helpers";

const router = Router();

router.post("/create", roleCheck([AccountType.ADMIN]), taxController.createTax);
router.put("/update", roleCheck([AccountType.ADMIN]), taxController.updateTax);
router.get("/get-all", roleCheck([AccountType.ADMIN, AccountType.SUPER_ADMIN, AccountType.USER]), taxController.getAllTax);
router.get("/get/:id", roleCheck([AccountType.ADMIN, AccountType.SUPER_ADMIN, AccountType.USER]), taxController.getTaxById);
router.delete("/delete/:id", roleCheck([AccountType.ADMIN, AccountType.SUPER_ADMIN]), taxController.deleteTax);

export default router;