import { Router, type RequestHandler } from "express";

import { authenticateUser } from "../../middlewares/auth/authenticateMiddleware.js";
import { authorizeRole } from "../../middlewares/auth/authorizeMiddleware.js";
import { uploadConfig } from "../../config/multer/multerConfig.js";
import {
  getVendorOpenings,
  getVendorOpeningDetails,
  presignProfileUploads,
  submitVendorProfiles,
  deleteVendorProfile,
  previewVendorProfile,
} from "../../controllers/controllers.js";

const router = Router();

router.use(
  authenticateUser as RequestHandler,
  authorizeRole("IT_VENDOR") as RequestHandler
);

router.get("/openings", getVendorOpenings as RequestHandler);

router.get("/openings/:id", getVendorOpeningDetails as RequestHandler);

router.post(
  "/openings/:id/profiles/presign",
  presignProfileUploads as RequestHandler
);

router.post(
  "/openings/:id/profiles/upload",
  uploadConfig.array("files", 10),
  submitVendorProfiles as RequestHandler
);

router.delete("/profiles/:profileId", deleteVendorProfile as RequestHandler);

router.get(
  "/profiles/:profileId/preview",
  previewVendorProfile as RequestHandler
);

export default router;
