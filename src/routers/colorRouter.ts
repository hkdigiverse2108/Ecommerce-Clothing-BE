import { Router } from "express";
import { colorController } from "../controllers";
import { roleCheck } from "../helpers";
import { AccountType } from "../common";

const router = Router();

router.post("/create", roleCheck([AccountType.ADMIN]), colorController.addColor);
router.put("/update", roleCheck([AccountType.ADMIN]), colorController.updateColor);
router.get("/get", roleCheck([AccountType.USER, AccountType.ADMIN]), colorController.getColor);
router.get("/get/:id", roleCheck([AccountType.USER, AccountType.ADMIN]), colorController.getColorById);
router.delete("/delete/:id", roleCheck([AccountType.ADMIN]), colorController.deleteColor);

export default router;
