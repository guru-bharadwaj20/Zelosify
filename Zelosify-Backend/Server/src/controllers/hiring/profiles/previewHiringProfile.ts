import type { Response } from "express";
import { getManagerProfilePreviewUrl } from "../../../services/hiring/hiringManagerService.js";
import {
  getAuthContext,
  parseProfileId,
} from "../../../helpers/requestContext.js";
import { sendErrorResponse } from "../../../helpers/httpError.js";
import type { AuthenticatedRequest } from "../../../types/typeIndex.js";

export const previewHiringProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { tenantId, userId } = getAuthContext(req);
    const profileId = parseProfileId(req.params.id);
    const preview = await getManagerProfilePreviewUrl(
      tenantId,
      userId,
      profileId
    );

    res.status(200).json({ status: "success", ...preview });
  } catch (error) {
    sendErrorResponse(res, error, "hiringManager.previewProfile");
  }
};
