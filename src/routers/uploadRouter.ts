import { Router } from "express";
import { upload, handleUploadError } from "../middleware";
import { uploadController } from "../controllers";
import { roleCheck, verifyToken } from "../helpers";
import { AccountType } from "../common";

const router = Router();

router.post("/", upload.array("files"), handleUploadError, uploadController.uploadImages);
router.get("/", uploadController.getImages);
router.delete("/", roleCheck([AccountType.USER, AccountType.ADMIN]), uploadController.deleteImage);

export default router;
