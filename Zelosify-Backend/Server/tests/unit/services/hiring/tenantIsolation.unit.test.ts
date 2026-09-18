import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../../src/config/prisma/prisma", () => ({
  default: {
    opening: { findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    hiringProfile: { findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    user: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import prisma from "../../../../src/config/prisma/prisma";
import {
  listOpeningsForTenant,
  getOpeningDetailsForVendor,
} from "../../../../src/services/hiring/openingService";
import {
  listManagerOpenings,
  listOpeningProfiles,
  shortlistProfile,
} from "../../../../src/services/hiring/hiringManagerService";
import { HttpError } from "../../../../src/helpers/httpError";

const TENANT_A = "tenant-a";
const TENANT_B = "tenant-b";
const MANAGER_A = "manager-a";
const MANAGER_B = "manager-b";

const db = prisma as any;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("vendor opening queries", () => {
  it("always filters the opening list by tenant", async () => {
    db.$transaction.mockResolvedValue([[], 0]);
    db.user.findMany.mockResolvedValue([]);

    await listOpeningsForTenant(TENANT_A, 1, 10);

    const queries = db.$transaction.mock.calls[0][0];
    expect(db.opening.findMany.mock.calls[0][0].where).toEqual({
      tenantId: TENANT_A,
    });
    expect(db.opening.count.mock.calls[0][0].where).toEqual({
      tenantId: TENANT_A,
    });
    expect(queries).toHaveLength(2);
  });

  it("paginates with skip and take", async () => {
    db.$transaction.mockResolvedValue([[], 0]);
    db.user.findMany.mockResolvedValue([]);

    await listOpeningsForTenant(TENANT_A, 3, 10);

    const args = db.opening.findMany.mock.calls[0][0];
    expect(args.skip).toBe(20);
    expect(args.take).toBe(10);
  });

  it("does not return an opening that belongs to another tenant", async () => {
    db.opening.findFirst.mockResolvedValue(null);

    await expect(
      getOpeningDetailsForVendor(TENANT_B, "opening-of-tenant-a", "vendor-1")
    ).rejects.toBeInstanceOf(HttpError);

    expect(db.opening.findFirst.mock.calls[0][0].where).toEqual({
      id: "opening-of-tenant-a",
      tenantId: TENANT_B,
    });
  });

  it("only lists profiles uploaded by the requesting vendor", async () => {
    db.opening.findFirst.mockResolvedValue({
      id: "opening-1",
      tenantId: TENANT_A,
      title: "Backend Engineer",
      hiringManagerId: MANAGER_A,
      experienceMin: 4,
      experienceMax: 8,
      requiredSkills: [],
      postedDate: new Date(),
      expectedCompletionDate: null,
      description: null,
      location: null,
      contractType: null,
      status: "OPEN",
    });
    db.hiringProfile.findMany.mockResolvedValue([]);
    db.user.findMany.mockResolvedValue([]);

    await getOpeningDetailsForVendor(TENANT_A, "opening-1", "vendor-1");

    expect(db.hiringProfile.findMany.mock.calls[0][0].where).toEqual({
      openingId: "opening-1",
      uploadedBy: "vendor-1",
      isDeleted: false,
    });
  });
});

describe("hiring manager queries", () => {
  it("only lists openings owned by the logged in manager", async () => {
    db.$transaction.mockResolvedValue([[], 0]);

    await listManagerOpenings(TENANT_A, MANAGER_A, 1, 10);

    expect(db.opening.findMany.mock.calls[0][0].where).toEqual({
      tenantId: TENANT_A,
      hiringManagerId: MANAGER_A,
    });
  });

  it("refuses profiles of an opening owned by another manager", async () => {
    db.opening.findFirst.mockResolvedValue({
      id: "opening-1",
      tenantId: TENANT_A,
      hiringManagerId: MANAGER_B,
    });

    await expect(
      listOpeningProfiles(TENANT_A, MANAGER_A, "opening-1")
    ).rejects.toMatchObject({ status: 403 });

    expect(db.hiringProfile.findMany).not.toHaveBeenCalled();
  });

  it("refuses an opening from another tenant", async () => {
    db.opening.findFirst.mockResolvedValue(null);

    await expect(
      listOpeningProfiles(TENANT_B, MANAGER_A, "opening-1")
    ).rejects.toMatchObject({ status: 404 });
  });

  it("refuses to shortlist a profile of another manager", async () => {
    db.hiringProfile.findFirst.mockResolvedValue({
      id: 1,
      status: "SUBMITTED",
      opening: { hiringManagerId: MANAGER_B },
    });

    await expect(
      shortlistProfile(TENANT_A, MANAGER_A, 1)
    ).rejects.toMatchObject({ status: 403 });

    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("scopes the profile lookup to the tenant", async () => {
    db.hiringProfile.findFirst.mockResolvedValue(null);

    await expect(
      shortlistProfile(TENANT_A, MANAGER_A, 99)
    ).rejects.toMatchObject({ status: 404 });

    expect(db.hiringProfile.findFirst.mock.calls[0][0].where).toEqual({
      id: 99,
      isDeleted: false,
      opening: { tenantId: TENANT_A },
    });
  });
});
