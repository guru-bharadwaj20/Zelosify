import { Router, type RequestHandler } from "express";

import { authenticateUser } from "../../middlewares/auth/authenticateMiddleware.js";
import { authorizeRole } from "../../middlewares/auth/authorizeMiddleware.js";
import {
  getManagerOpenings,
  getOpeningProfiles,
  shortlistHiringProfile,
  rejectHiringProfile,
  previewHiringProfile,
} from "../../controllers/controllers.js";

const router = Router();

router.use(
  authenticateUser as RequestHandler,
  authorizeRole("HIRING_MANAGER") as RequestHandler
);

router.get("/openings", getManagerOpenings as RequestHandler);

router.get("/openings/:id/profiles", getOpeningProfiles as RequestHandler);

router.post("/profiles/:id/shortlist", shortlistHiringProfile as RequestHandler);

router.post("/profiles/:id/reject", rejectHiringProfile as RequestHandler);

router.get("/profiles/:id/preview", previewHiringProfile as RequestHandler);

export default router;
