import { describe, expect, it, vi, beforeEach } from "vitest";

import { GET } from "../route";
import prisma from "@/models/client";
import { getRequestUser } from "@/utils/request-auth";

vi.mock("@/models/client", () => {
  return {
    default: {
      managerSection: { findMany: vi.fn() },
      section: { findMany: vi.fn() },
      schedule: { findMany: vi.fn() },
    },
  };
});

vi.mock("@/utils/request-auth", () => {
  return {
    getRequestUser: vi.fn(),
  };
});

const prismaMock = prisma as unknown as {
  managerSection: { findMany: ReturnType<typeof vi.fn> };
  section: { findMany: ReturnType<typeof vi.fn> };
  schedule: { findMany: ReturnType<typeof vi.fn> };
};

const getRequestUserMock = getRequestUser as unknown as ReturnType<typeof vi.fn>;

describe("GET /api/managers/schedules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("unions section ids from managerSection and direct section manager_id", async () => {
    getRequestUserMock.mockResolvedValue({ user_id: "manager-1", user_role: "MANAGER" });

    prismaMock.managerSection.findMany.mockResolvedValue([
      { section_id: "section-a" },
      { section_id: "section-b" },
    ]);

    prismaMock.section.findMany.mockResolvedValue([
      { section_id: "section-b" },
      { section_id: "section-c" },
    ]);

    prismaMock.schedule.findMany.mockResolvedValue([]);

    const res = await GET({} as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ schedules: [] });

    expect(prismaMock.schedule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          section_id: { in: ["section-a", "section-b", "section-c"] },
        },
      })
    );
  });
});
