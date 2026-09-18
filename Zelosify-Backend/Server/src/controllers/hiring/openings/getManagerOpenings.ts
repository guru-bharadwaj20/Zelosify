import type { Response } from "express";
import { listManagerOpenings } from "../../../services/hiring/hiringManagerService.js";
import { parsePagination } from "../../../helpers/hiringValidation.js";
import { getAuthContext } from "../../../helpers/requestContext.js";
import { sendErrorResponse } from "../../../helpers/httpError.js";
import type { AuthenticatedRequest } from "../../../types/typeIndex.js";

export const getManagerOpenings = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { tenantId, userId } = getAuthContext(req);
    const { page, limit } = parsePagination(req.query);
    const data = await listManagerOpenings(tenantId, userId, page, limit);

    res.status(200).json({ status: "success", ...data });
  } catch (error) {
    sendErrorResponse(res, error, "hiringManager.getOpenings");
  }
};
