import { Router } from "express";
import { userController } from "../controllers";
import { roleCheck } from "../helpers";
import { AccountType } from "../common";

const router = Router();

router.get("/get", roleCheck([AccountType.ADMIN]), userController.getUsers);
router.get("/get/:id", roleCheck([AccountType.USER, AccountType.ADMIN]), userController.getById);
router.delete("/delete/:id", roleCheck([AccountType.ADMIN]), userController.deleteUser);
router.put("/update", roleCheck([AccountType.USER, AccountType.ADMIN]), userController.updateUser);

export default router;