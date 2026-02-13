import { Router } from "express";
import { productController } from "../controllers";
import { roleCheck } from "../helpers";
import { AccountType } from "../common";

const router = Router();

router.post("/create", roleCheck([AccountType.ADMIN]), productController.addProduct);
router.put("/update", roleCheck([AccountType.ADMIN]), productController.updateProduct);
router.get("/get", roleCheck([AccountType.USER, AccountType.ADMIN]), productController.getProduct);
router.get("/get/:id", roleCheck([AccountType.USER, AccountType.ADMIN]), productController.getProductById);
router.get("/get/slug/:slug", roleCheck([AccountType.USER, AccountType.ADMIN]), productController.getProductBySlug);
router.delete("/delete/:id", roleCheck([AccountType.ADMIN]), productController.deleteProduct);

router.get("/list/popular", roleCheck([AccountType.USER, AccountType.ADMIN]), productController.getPopularProducts);
router.get("/list/recommended", roleCheck([AccountType.USER, AccountType.ADMIN]), productController.getRecommendedProducts);
router.get("/list/best-sellers", roleCheck([AccountType.USER, AccountType.ADMIN]), productController.getBestSellers);
router.get("/list/offers", roleCheck([AccountType.USER, AccountType.ADMIN]), productController.getOfferProducts);

export default router;
