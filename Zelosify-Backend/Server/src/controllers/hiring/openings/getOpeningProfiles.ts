import type { Response } from "express";
import { listOpeningProfiles } from "../../../services/hiring/hiringManagerService.js";
import { getAuthContext } from "../../../helpers/requestContext.js";
import { sendErrorResponse } from "../../../helpers/httpError.js";
import type { AuthenticatedRequest } from "../../../types/typeIndex.js";

export const getOpeningProfiles = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { tenantId, userId } = getAuthContext(req);
    const data = await listOpeningProfiles(tenantId, userId, req.params.id);

    res.status(200).json({ status: "success", ...data });
  } catch (error) {
    sendErrorResponse(res, error, "hiringManager.getOpeningProfiles");
  }
};
