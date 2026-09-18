import { describe, expect, it, vi, beforeEach } from "vitest";

import { GET as teachersSchedulesGET } from "@/app/api/teachers/schedules/route";
import { getRequestUser } from "@/utils/request-auth";
import prisma from "@/lib/prisma";

vi.mock("@/utils/request-auth", () => ({
  getRequestUser: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    schedule: { findMany: vi.fn() },
  },
}));

const getRequestUserMock = getRequestUser as unknown as ReturnType<typeof vi.fn>;
const prismaMock = prisma as unknown as {
  schedule: { findMany: ReturnType<typeof vi.fn> };
};

function spoofedRequest(): any {
  return {
    headers: {
      get: (name: string) => (name === "x-phone-number" ? "000-000-0000" : null),
    },
    url: "http://localhost/api/foo",
  };
}

describe("CARD-101: x-phone-number spoofing is rejected", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("teachers/schedules GET returns 401 without a session even with spoofed phone header", async () => {
    getRequestUserMock.mockResolvedValue(null);

    const res = await teachersSchedulesGET(spoofedRequest());

    expect(res.status).toBe(401);
    expect(prismaMock.schedule.findMany).not.toHaveBeenCalled();
  });

  it("teachers/schedules GET uses the session user_id (not the phone header)", async () => {
    getRequestUserMock.mockResolvedValue({ user_id: "teacher-1", user_role: "TEACHER" });
    prismaMock.schedule.findMany.mockResolvedValue([]);

    const res = await teachersSchedulesGET(spoofedRequest());

    expect(res.status).toBe(200);
    expect(prismaMock.schedule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ teacher_id: "teacher-1" }) })
    );
  });
});
