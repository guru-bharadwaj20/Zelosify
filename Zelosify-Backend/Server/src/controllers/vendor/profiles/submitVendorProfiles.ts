import type { Response } from "express";
import { submitProfiles } from "../../../services/hiring/profileService.js";
import {
  getAuthContext,
  parseUploadTokens,
} from "../../../helpers/requestContext.js";
import { sendErrorResponse } from "../../../helpers/httpError.js";
import type { AuthenticatedRequest } from "../../../types/typeIndex.js";

export const submitVendorProfiles = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { tenantId, userId } = getAuthContext(req);
    const files = (req.files as Express.Multer.File[]) || [];
    const uploadTokens = parseUploadTokens(req.body?.uploadTokens);

    const profiles = await submitProfiles(
      tenantId,
      userId,
      req.params.id,
      files,
      uploadTokens
    );

    res.status(201).json({
      status: "success",
      message: "Profiles submitted successfully",
      profiles,
    });
  } catch (error) {
    sendErrorResponse(res, error, "vendor.submitProfiles");
  }
};
