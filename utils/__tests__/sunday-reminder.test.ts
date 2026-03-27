import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { runSundayReminder } from "@/utils/sunday-reminder";
import prisma from "@/models/client";
import { notifyMissingSundaySchedule, notifySundayScheduleReminder } from "@/utils/notifications";

vi.mock("@/models/client", () => {
  return {
    default: {
      schedule: { findMany: vi.fn() },
      section: { findMany: vi.fn() },
      managerSection: { findMany: vi.fn() },
    },
  };
});

vi.mock("@/utils/notifications", () => {
  return {
    notifySundayScheduleReminder: vi.fn(),
    notifyMissingSundaySchedule: vi.fn(),
  };
});

const prismaMock = prisma as unknown as {
  schedule: { findMany: ReturnType<typeof vi.fn> };
  section: { findMany: ReturnType<typeof vi.fn> };
  managerSection: { findMany: ReturnType<typeof vi.fn> };
};

const notifySundayMock = notifySundayScheduleReminder as unknown as ReturnType<typeof vi.fn>;
const notifyMissingMock = notifyMissingSundaySchedule as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("runSundayReminder", () => {
  it("skips on non-Wednesday/Friday when not forced", async () => {
    vi.setSystemTime(new Date("2026-03-16T10:00:00Z")); // Monday

    const result = await runSundayReminder({ timeZone: "UTC" });

    expect(result).toEqual({
      skipped: true,
      reason: "Only runs on Wednesdays and Fridays",
      timeZone: "UTC",
    });
    expect(prismaMock.schedule.findMany).not.toHaveBeenCalled();
    expect(prismaMock.section.findMany).not.toHaveBeenCalled();
    expect(prismaMock.managerSection.findMany).not.toHaveBeenCalled();
  });

  it("runs on Wednesday and notifies teachers and managers", async () => {
    vi.setSystemTime(new Date("2026-03-18T12:00:00Z")); // Wednesday

    prismaMock.schedule.findMany.mockResolvedValue([
      {
        schedule_date: new Date("2026-03-22T09:00:00Z"),
        teacher_id: "teacher-1",
        teacher: { user_id: "t-user-1", tg_id: "111", first_name: "T1", last_name: "A" },
        course: { course_name: "Math", course_description: null },
        section: { section_id: "section-1", section_name: "S1" },
        section_id: "section-1",
      },
      {
        schedule_date: new Date("2026-03-22T11:00:00Z"),
        teacher_id: "teacher-1",
        teacher: { user_id: "t-user-1", tg_id: "111", first_name: "T1", last_name: "A" },
        course: { course_name: "Science", course_description: null },
        section: { section_id: "section-1", section_name: "S1" },
        section_id: "section-1",
      },
      {
        schedule_date: new Date("2026-03-22T13:00:00Z"),
        teacher_id: "teacher-2",
        teacher: { user_id: "t-user-2", tg_id: "222", first_name: "T2", last_name: "B" },
        course: { course_name: "History", course_description: null },
        section: { section_id: "section-2", section_name: "S2" },
        section_id: "section-2",
      },
    ]);

    prismaMock.section.findMany.mockResolvedValue([
      {
        section_id: "section-1",
        section_name: "S1",
        manager_id: "mgr-1",
        manager: { user_id: "mgr-1", tg_id: "900", first_name: "M1", last_name: "Boss" },
      },
      {
        section_id: "section-2",
        section_name: "S2",
        manager_id: "mgr-1",
        manager: { user_id: "mgr-1", tg_id: "900", first_name: "M1", last_name: "Boss" },
      },
      {
        section_id: "section-3",
        section_name: "S3",
        manager_id: "mgr-3",
        manager: { user_id: "mgr-3", tg_id: "902", first_name: "M3", last_name: "Ops" },
      },
    ]);

    prismaMock.managerSection.findMany.mockResolvedValue([
      {
        section_id: "section-3",
        manager: { user_id: "mgr-1", tg_id: "900", first_name: "M1", last_name: "Boss" },
      },
      {
        section_id: "section-3",
        manager: { user_id: "mgr-2", tg_id: "901", first_name: "M2", last_name: "Lead" },
      },
    ]);

    const result = await runSundayReminder({ timeZone: "UTC" });

    expect(notifySundayMock).toHaveBeenCalledTimes(2);
    const sundayDate = new Date("2026-03-22T00:00:00.000Z");
    expect(notifySundayMock).toHaveBeenCalledWith(
      { user_id: "t-user-1", tg_id: "111", first_name: "T1", last_name: "A" },
      expect.arrayContaining([
        expect.objectContaining({
          course: { course_name: "Math", course_description: null },
          section: { section_name: "S1" },
        }),
      ]),
      sundayDate
    );

    expect(notifyMissingMock).toHaveBeenCalledTimes(3);
    expect(notifyMissingMock).toHaveBeenCalledWith(
      { user_id: "mgr-1", tg_id: "900", first_name: "M1", last_name: "Boss" },
      "S3",
      sundayDate
    );
    expect(notifyMissingMock).toHaveBeenCalledWith(
      { user_id: "mgr-2", tg_id: "901", first_name: "M2", last_name: "Lead" },
      "S3",
      sundayDate
    );
    expect(notifyMissingMock).toHaveBeenCalledWith(
      { user_id: "mgr-3", tg_id: "902", first_name: "M3", last_name: "Ops" },
      "S3",
      sundayDate
    );

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        timeZone: "UTC",
        sunday: sundayDate.toISOString(),
        sectionsWithoutSchedules: 1,
        teachers: expect.arrayContaining([
          { teacherId: "teacher-1", status: "sent" },
          { teacherId: "teacher-2", status: "sent" },
        ]),
        managers: expect.arrayContaining([
          { sectionId: "section-3", managerId: "mgr-1", status: "sent" },
          { sectionId: "section-3", managerId: "mgr-2", status: "sent" },
          { sectionId: "section-3", managerId: "mgr-3", status: "sent" },
        ]),
      })
    );
  });

  it("runs when forced even on non-Wednesday/Friday", async () => {
    vi.setSystemTime(new Date("2026-03-16T10:00:00Z")); // Monday

    prismaMock.schedule.findMany.mockResolvedValue([]);
    prismaMock.section.findMany.mockResolvedValue([]);
    prismaMock.managerSection.findMany.mockResolvedValue([]);

    const result = await runSundayReminder({ timeZone: "UTC", force: true });

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        timeZone: "UTC",
        sectionsWithoutSchedules: 0,
      })
    );
    expect(prismaMock.schedule.findMany).toHaveBeenCalledTimes(1);
  });
});
