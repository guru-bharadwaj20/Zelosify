import type { Response } from "express";
import { createUploadTokens } from "../../../services/hiring/profileService.js";
import { validatePresignBody } from "../../../helpers/hiringValidation.js";
import { getAuthContext } from "../../../helpers/requestContext.js";
import { HttpError, sendErrorResponse } from "../../../helpers/httpError.js";
import type { AuthenticatedRequest } from "../../../types/typeIndex.js";

export const presignProfileUploads = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { tenantId } = getAuthContext(req);
    const validation = validatePresignBody(req.body);

    if (!validation.isValid) {
      throw new HttpError(400, validation.message || "Invalid request body");
    }

    const uploads = await createUploadTokens(
      tenantId,
      req.params.id,
      req.body.filenames
    );

    res.status(200).json({ status: "success", uploads });
  } catch (error) {
    sendErrorResponse(res, error, "vendor.presignProfileUploads");
  }
};
