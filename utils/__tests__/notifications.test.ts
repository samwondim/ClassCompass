import { describe, expect, it, vi } from "vitest";
import { notifySundayScheduleReminder } from "@/utils/notifications";
import prisma from "@/models/client";

// Mock the dependencies
vi.mock("@/models/client", () => {
  return {
    default: {
      notification: { create: vi.fn() },
      notificationTemplate: { findUnique: vi.fn() },
    },
  };
});

vi.mock("grammy", () => {
    return {
        Bot: vi.fn().mockImplementation(() => ({
            api: {
                sendMessage: vi.fn().mockResolvedValue({ message_id: 123 })
            }
        }))
    }
});

// Mock the notification sending
vi.mock("@/utils/notifications", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/utils/notifications")>();
    return {
        ...actual,
        sendTelegramNotification: vi.fn().mockResolvedValue(true)
    };
});

describe("notifySundayScheduleReminder", () => {
    it("uses default message if no template exists", async () => {
        const prismaMock = prisma as any;
        prismaMock.notificationTemplate.findUnique.mockResolvedValue(null);

        const teacher = { user_id: "t1", tg_id: "123", first_name: "John", last_name: "Doe" };
        const schedules = [{
            schedule_date: new Date("2026-03-22T09:00:00Z"),
            course: { course_name: "Math", course_description: null },
            section: { section_name: "S1" }
        }];
        const sundayDate = new Date("2026-03-22T00:00:00Z");

        await notifySundayScheduleReminder(teacher, schedules, sundayDate);

        expect(prismaMock.notification.create).toHaveBeenCalled();
        // Verify default message structure contains expected data
        const callArgs = prismaMock.notification.create.mock.calls[0][0].data;
        expect(callArgs.message).toContain("Hello John Doe");
        expect(callArgs.message).toContain("Math");
        expect(callArgs.message).toContain("S1");
    });

    it("uses custom message if template exists", async () => {
        const prismaMock = prisma as any;
        prismaMock.notificationTemplate.findUnique.mockResolvedValue({
            key: "SUNDAY_REMINDER",
            message: "Custom Amharic Message"
        });

        const teacher = { user_id: "t1", tg_id: "123", first_name: "John", last_name: "Doe" };
        const schedules = [{
            schedule_date: new Date("2026-03-22T09:00:00Z"),
            course: { course_name: "Math", course_description: null },
            section: { section_name: "S1" }
        }];
        const sundayDate = new Date("2026-03-22T00:00:00Z");

        await notifySundayScheduleReminder(teacher, schedules, sundayDate);

        // Verify the custom message is used in the saved notification
        const callArgs = prismaMock.notification.create.mock.calls[0][0].data;
        expect(callArgs.message).toBe("Custom Amharic Message");
    });
});
