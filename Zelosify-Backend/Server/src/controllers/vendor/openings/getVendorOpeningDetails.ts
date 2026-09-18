import type { Response } from "express";
import { getOpeningDetailsForVendor } from "../../../services/hiring/openingService.js";
import { getAuthContext } from "../../../helpers/requestContext.js";
import { sendErrorResponse } from "../../../helpers/httpError.js";
import type { AuthenticatedRequest } from "../../../types/typeIndex.js";

export const getVendorOpeningDetails = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { tenantId, userId } = getAuthContext(req);
    const opening = await getOpeningDetailsForVendor(
      tenantId,
      req.params.id,
      userId
    );

    res.status(200).json({ status: "success", opening });
  } catch (error) {
    sendErrorResponse(res, error, "vendor.getOpeningDetails");
  }
};
