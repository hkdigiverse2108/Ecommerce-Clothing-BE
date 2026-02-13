import { Router } from "express";
import { upload, handleUploadError } from "../middleware";
import { uploadController } from "../controllers";
import { roleCheck } from "../helpers";
import { AccountType } from "../common";

const router = Router();

router.post("/", roleCheck([AccountType.USER, AccountType.ADMIN]), upload.array("files"), handleUploadError, uploadController.uploadImages);
router.get("/", roleCheck([AccountType.USER, AccountType.ADMIN]), uploadController.getImages);
router.delete("/", roleCheck([AccountType.USER, AccountType.ADMIN]), uploadController.deleteImage);

export default router;
