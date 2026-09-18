import prisma from "../../config/prisma/prisma.js";
import { HttpError } from "../../helpers/httpError.js";
import { getFileNameFromKey } from "../../helpers/hiringValidation.js";
import { FilePresignService } from "../upload/filePresignService.js";
import { FileUploadService } from "../upload/fileUploadService.js";
import { createStorageService } from "../storage/storageFactory.js";
import { queueRecommendations } from "../agent/recommendationService.js";
import { isSupportedProfileFile } from "../../utils/parsing/documentText.js";
import { logInfo } from "../../utils/logger/structuredLogger.js";

const presignService = new FilePresignService();
const uploadService = new FileUploadService();

const ensureOpening = async (tenantId: string, openingId: string) => {
  const opening = await prisma.opening.findFirst({
    where: { id: openingId, tenantId },
    select: { id: true, status: true },
  });

  if (!opening) {
    throw new HttpError(404, "Opening not found");
  }

  return opening;
};

export const createUploadTokens = async (
  tenantId: string,
  openingId: string,
  filenames: string[]
) => {
  await ensureOpening(tenantId, openingId);

  return presignService.generateUploadTokens(filenames, {
    tenantId,
    uploadEndpoint: `/vendor/openings/${openingId}/profiles/upload`,
    s3KeyConfig: {
      pathSegments: [tenantId, openingId],
      includeTimestamp: true,
    },
    customMetadata: { openingId },
  });
};

export const submitProfiles = async (
  tenantId: string,
  vendorUserId: string,
  openingId: string,
  files: Express.Multer.File[],
  uploadTokens: string[]
) => {
  await ensureOpening(tenantId, openingId);

  if (files.length === 0) {
    throw new HttpError(400, "No files were provided");
  }

  if (files.length !== uploadTokens.length) {
    throw new HttpError(400, "Each file must be sent with its upload token");
  }

  const unsupported = files.filter(
    (file) => !isSupportedProfileFile(file.originalname)
  );

  if (unsupported.length > 0) {
    throw new HttpError(400, "Only PDF and PPTX profiles are allowed");
  }

  const keyPrefix = `${tenantId}/${openingId}/`;
  const uploaded: string[] = [];

  for (let index = 0; index < files.length; index++) {
    const result = await uploadService.uploadFile(
      {
        fileBuffer: files[index].buffer,
        mimeType: files[index].mimetype,
        uploadToken: uploadTokens[index],
      },
      {
        validateTokenFn: (metadata) => {
          if (metadata.tenantId !== tenantId) {
            return { isValid: false, errorMessage: "Token belongs to another tenant" };
          }
          if (!String(metadata.key).startsWith(keyPrefix)) {
            return { isValid: false, errorMessage: "Token does not match this opening" };
          }
          return { isValid: true };
        },
      }
    );

    if (!result.success) {
      throw new HttpError(400, result.errorMessage || "Profile upload failed");
    }

    uploaded.push(result.key);
  }

  const created = await prisma.$transaction(async (tx) => {
    const rows = [];

    for (const s3Key of uploaded) {
      const profile = await tx.hiringProfile.create({
        data: { openingId, s3Key, uploadedBy: vendorUserId },
        select: { id: true, s3Key: true, submittedAt: true, status: true },
      });
      rows.push(profile);
    }

    return rows;
  });

  logInfo("profiles.submitted", {
    openingId,
    tenantId,
    vendorUserId,
    count: created.length,
  });

  queueRecommendations(created.map((profile) => profile.id));

  return created.map((profile) => ({
    id: profile.id,
    fileName: getFileNameFromKey(profile.s3Key),
    submittedAt: profile.submittedAt,
    status: profile.status,
  }));
};

export const softDeleteProfile = async (
  tenantId: string,
  vendorUserId: string,
  profileId: number
) => {
  const profile = await prisma.hiringProfile.findFirst({
    where: {
      id: profileId,
      uploadedBy: vendorUserId,
      isDeleted: false,
      opening: { tenantId },
    },
    select: { id: true },
  });

  if (!profile) {
    throw new HttpError(404, "Profile not found");
  }

  await prisma.$transaction(async (tx) => {
    await tx.hiringProfile.update({
      where: { id: profile.id },
      data: { isDeleted: true },
    });
  });

  logInfo("profile.soft_deleted", { profileId, vendorUserId, tenantId });

  return { id: profile.id };
};

export const getVendorProfilePreviewUrl = async (
  tenantId: string,
  vendorUserId: string,
  profileId: number
) => {
  const profile = await prisma.hiringProfile.findFirst({
    where: {
      id: profileId,
      uploadedBy: vendorUserId,
      isDeleted: false,
      opening: { tenantId },
    },
    select: { s3Key: true },
  });

  if (!profile) {
    throw new HttpError(404, "Profile not found");
  }

  const url = await createStorageService().getObjectURL(profile.s3Key);

  return { fileName: getFileNameFromKey(profile.s3Key), url };
};
