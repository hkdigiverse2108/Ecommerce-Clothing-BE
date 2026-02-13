import { Router } from "express";
import { reviewController } from "../controllers";
import { roleCheck } from "../helpers";
import { AccountType } from "../common";

const router = Router();

router.post("/add", roleCheck([AccountType.USER]), reviewController.addReview);

export default router;
