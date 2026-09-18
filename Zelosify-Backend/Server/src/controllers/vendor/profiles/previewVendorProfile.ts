import type { Response } from "express";
import { getVendorProfilePreviewUrl } from "../../../services/hiring/profileService.js";
import {
  getAuthContext,
  parseProfileId,
} from "../../../helpers/requestContext.js";
import { sendErrorResponse } from "../../../helpers/httpError.js";
import type { AuthenticatedRequest } from "../../../types/typeIndex.js";

export const previewVendorProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { tenantId, userId } = getAuthContext(req);
    const profileId = parseProfileId(req.params.profileId);
    const preview = await getVendorProfilePreviewUrl(
      tenantId,
      userId,
      profileId
    );

    res.status(200).json({ status: "success", ...preview });
  } catch (error) {
    sendErrorResponse(res, error, "vendor.previewProfile");
  }
};
