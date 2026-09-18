import prisma from "../../config/prisma/prisma.js";
import { HttpError } from "../../helpers/httpError.js";
import { getFileNameFromKey } from "../../helpers/hiringValidation.js";

export const buildManagerNameMap = async (
  managerIds: string[]
): Promise<Map<string, string>> => {
  const uniqueIds = Array.from(new Set(managerIds.filter(Boolean)));

  if (uniqueIds.length === 0) return new Map();

  const managers = await prisma.user.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true, firstName: true, lastName: true, username: true, email: true },
  });

  const map = new Map<string, string>();

  for (const manager of managers) {
    const fullName = [manager.firstName, manager.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    map.set(manager.id, fullName || manager.username || manager.email);
  }

  return map;
};

export const listOpeningsForTenant = async (
  tenantId: string,
  page: number,
  limit: number
) => {
  const skip = (page - 1) * limit;

  const [openings, total] = await prisma.$transaction([
    prisma.opening.findMany({
      where: { tenantId },
      orderBy: { postedDate: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        location: true,
        contractType: true,
        postedDate: true,
        status: true,
        experienceMin: true,
        experienceMax: true,
        hiringManagerId: true,
      },
    }),
    prisma.opening.count({ where: { tenantId } }),
  ]);

  const managerNames = await buildManagerNameMap(
    openings.map((opening) => opening.hiringManagerId)
  );

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
      hiringManagerName: managerNames.get(opening.hiringManagerId) || "Unassigned",
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};

export const getOpeningDetailsForVendor = async (
  tenantId: string,
  openingId: string,
  vendorUserId: string
) => {
  const opening = await prisma.opening.findFirst({
    where: { id: openingId, tenantId },
  });

  if (!opening) {
    throw new HttpError(404, "Opening not found");
  }

  const profiles = await prisma.hiringProfile.findMany({
    where: { openingId, uploadedBy: vendorUserId, isDeleted: false },
    orderBy: { submittedAt: "desc" },
    select: {
      id: true,
      s3Key: true,
      submittedAt: true,
      status: true,
    },
  });

  const managerNames = await buildManagerNameMap([opening.hiringManagerId]);

  return {
    id: opening.id,
    title: opening.title,
    description: opening.description,
    location: opening.location,
    contractType: opening.contractType,
    status: opening.status,
    postedDate: opening.postedDate,
    expectedCompletionDate: opening.expectedCompletionDate,
    requiredSkills: opening.requiredSkills,
    experienceRange: {
      min: opening.experienceMin,
      max: opening.experienceMax,
    },
    hiringManagerName: managerNames.get(opening.hiringManagerId) || "Unassigned",
    profilesCount: profiles.length,
    profiles: profiles.map((profile) => ({
      id: profile.id,
      fileName: getFileNameFromKey(profile.s3Key),
      submittedAt: profile.submittedAt,
      status: profile.status,
    })),
  };
};
