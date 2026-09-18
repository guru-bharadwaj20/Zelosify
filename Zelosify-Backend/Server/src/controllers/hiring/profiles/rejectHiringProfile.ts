import type { Response } from "express";
import { rejectProfile } from "../../../services/hiring/hiringManagerService.js";
import {
  getAuthContext,
  parseProfileId,
} from "../../../helpers/requestContext.js";
import { sendErrorResponse } from "../../../helpers/httpError.js";
import type { AuthenticatedRequest } from "../../../types/typeIndex.js";

export const rejectHiringProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { tenantId, userId } = getAuthContext(req);
    const profileId = parseProfileId(req.params.id);
    const profile = await rejectProfile(tenantId, userId, profileId);

    res.status(200).json({
      status: "success",
      message: "Profile rejected",
      profile,
    });
  } catch (error) {
    sendErrorResponse(res, error, "hiringManager.reject");
  }
};
