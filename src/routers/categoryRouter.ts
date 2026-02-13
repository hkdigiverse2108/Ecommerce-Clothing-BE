import { Router } from "express";
import { categoryController } from "../controllers";
import { roleCheck } from "../helpers";
import { AccountType } from "../common";

const router = Router();

router.post("/create", roleCheck([AccountType.ADMIN]), categoryController.createCategory);
router.put("/update", roleCheck([AccountType.ADMIN]), categoryController.updateCategory);
router.get("/get", roleCheck([AccountType.USER, AccountType.ADMIN]), categoryController.getCategory);
router.get("/get/:id", roleCheck([AccountType.USER, AccountType.ADMIN]), categoryController.getById);
router.delete("/delete/:id", roleCheck([AccountType.ADMIN]), categoryController.deleteCategory);

export default router;