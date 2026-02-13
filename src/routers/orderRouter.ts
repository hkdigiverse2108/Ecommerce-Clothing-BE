import { Router } from "express";
import { orderController } from "../controllers";
import { verifyToken } from "../helpers";

const router = Router();

router.post("/checkout", verifyToken, orderController.createOrder);
router.get("/get", verifyToken, orderController.getMyOrders);
router.get("/:id", verifyToken, orderController.getOrderById);

export default router;