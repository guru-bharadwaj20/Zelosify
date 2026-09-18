import prisma from "../../config/prisma/prisma.js";
import { HttpError } from "../../helpers/httpError.js";
import { getFileNameFromKey } from "../../helpers/hiringValidation.js";
import { classifyScore } from "../agent/decisionPolicy.js";
import { createStorageService } from "../storage/storageFactory.js";
import { logInfo } from "../../utils/logger/structuredLogger.js";

const ensureOwnedOpening = async (
  tenantId: string,
  managerId: string,
  openingId: string
) => {
  const opening = await prisma.opening.findFirst({
    where: { id: openingId, tenantId },
  });

  if (!opening) {
    throw new HttpError(404, "Opening not found");
  }

  if (opening.hiringManagerId !== managerId) {
    throw new HttpError(403, "This opening belongs to another hiring manager");
  }

  return opening;
};

export const listManagerOpenings = async (
  tenantId: string,
  managerId: string,
  page: number,
  limit: number
) => {
  const where = { tenantId, hiringManagerId: managerId };
  const skip = (page - 1) * limit;

  const [openings, total] = await prisma.$transaction([
    prisma.opening.findMany({
      where,
      orderBy: { postedDate: "desc" },
      skip,
      take: limit,
      include: {
        _count: { select: { hiringProfiles: true } },
      },
    }),
    prisma.opening.count({ where }),
  ]);

  return {
    openings: openings.map((opening) => ({
      id: opening.id,
      title: opening.title,
      location: opening.location,
      contractType: opening.contractType,
      postedDate: opening.postedDate,
      status: opening.status,
      experienceMin: opening.experienceMin,
      experienceMax: opening.experienceMax,
      requiredSkills: opening.requiredSkills,
      profilesCount: opening._count.hiringProfiles,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};

export const listOpeningProfiles = async (
  tenantId: string,
  managerId: string,
  openingId: string
) => {
  const opening = await ensureOwnedOpening(tenantId, managerId, openingId);

  const profiles = await prisma.hiringProfile.findMany({
    where: { openingId, isDeleted: false },
    orderBy: [{ recommendationScore: "desc" }, { submittedAt: "desc" }],
  });

  return {
    opening: {
      id: opening.id,
      title: opening.title,
      description: opening.description,
      location: opening.location,
      contractType: opening.contractType,
      status: opening.status,
      requiredSkills: opening.requiredSkills,
      experienceRange: {
        min: opening.experienceMin,
        max: opening.experienceMax,
      },
    },
    profiles: profiles.map((profile) => ({
      id: profile.id,
      fileName: getFileNameFromKey(profile.s3Key),
      submittedAt: profile.submittedAt,
      status: profile.status,
      recommended: profile.recommended,
      recommendationLabel:
        profile.recommendationScore === null
          ? "PENDING"
          : classifyScore(profile.recommendationScore),
      score: profile.recommendationScore,
      confidence: profile.recommendationConfidence,
      explanation: profile.recommendationReason,
      processingTimeMs: profile.recommendationLatencyMs,
      recommendationVersion: profile.recommendationVersion,
      recommendedAt: profile.recommendedAt,
    })),
  };
};

const loadManagerProfile = async (
  tenantId: string,
  managerId: string,
  profileId: number
) => {
  const profile = await prisma.hiringProfile.findFirst({
    where: { id: profileId, isDeleted: false, opening: { tenantId } },
    include: { opening: { select: { hiringManagerId: true } } },
  });

  if (!profile) {
    throw new HttpError(404, "Profile not found");
  }

  if (profile.opening.hiringManagerId !== managerId) {
    throw new HttpError(403, "This profile belongs to another hiring manager");
  }

  return profile;
};

export const shortlistProfile = async (
  tenantId: string,
  managerId: string,
  profileId: number
) => {
  const profile = await loadManagerProfile(tenantId, managerId, profileId);

  if (profile.status === "SHORTLISTED") {
    return { id: profile.id, status: profile.status };
  }

  const updated = await prisma.$transaction(async (tx) =>
    tx.hiringProfile.update({
      where: { id: profile.id },
      data: {
        status: "SHORTLISTED",
        shortlistedBy: managerId,
        shortlistedAt: new Date(),
        rejectedBy: null,
        rejectedAt: null,
      },
      select: { id: true, status: true, shortlistedAt: true },
    })
  );

  logInfo("profile.shortlisted", { profileId, managerId, tenantId });

  return updated;
};

export const rejectProfile = async (
  tenantId: string,
  managerId: string,
  profileId: number
) => {
  const profile = await loadManagerProfile(tenantId, managerId, profileId);

  if (profile.status === "REJECTED") {
    return { id: profile.id, status: profile.status };
  }

  const updated = await prisma.$transaction(async (tx) =>
    tx.hiringProfile.update({
      where: { id: profile.id },
      data: {
        status: "REJECTED",
        rejectedBy: managerId,
        rejectedAt: new Date(),
        shortlistedBy: null,
        shortlistedAt: null,
      },
      select: { id: true, status: true, rejectedAt: true },
    })
  );

  logInfo("profile.rejected", { profileId, managerId, tenantId });

  return updated;
};

export const getManagerProfilePreviewUrl = async (
  tenantId: string,
  managerId: string,
  profileId: number
) => {
  const profile = await loadManagerProfile(tenantId, managerId, profileId);
  const url = await createStorageService().getObjectURL(profile.s3Key);

  return { fileName: getFileNameFromKey(profile.s3Key), url };
};
