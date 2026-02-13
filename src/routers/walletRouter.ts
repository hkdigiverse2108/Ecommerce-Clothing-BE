import express from "express";
import { walletController } from "../controllers";
import { verifyToken } from "../helpers";

const router = express.Router();

router.get("/", verifyToken, walletController.getWallet);
router.get("/transactions", verifyToken, walletController.getTransactions);
router.post("/add-money", verifyToken, walletController.addMoney);

export default router;
