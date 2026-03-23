import prisma from "@/models/client";
import { notifySundayScheduleReminder } from "@/utils/notifications";

const DEFAULT_TIMEZONE = "Africa/Addis_Ababa";

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  weekday: number;
};

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const parts = dtf.formatToParts(date);
  const values: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") values[part.type] = part.value;
  }
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    weekday: weekdayMap[values.weekday],
  };
}

function getTimeZoneOffset(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(date);
  const values: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") values[part.type] = part.value;
  }
  const asUTC = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );
  return asUTC - date.getTime();
}

function getZonedStartOfDay(date: Date, timeZone: string): Date {
  const parts = getZonedParts(date, timeZone);
  const utcGuess = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 0, 0, 0));
  const offset = getTimeZoneOffset(utcGuess, timeZone);
  return new Date(utcGuess.getTime() - offset);
}

function getZonedEndOfDay(date: Date, timeZone: string): Date {
  const start = getZonedStartOfDay(date, timeZone);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

function getNextSundayRange(now: Date, timeZone: string) {
  const parts = getZonedParts(now, timeZone);
  const daysUntil = (7 - parts.weekday) % 7 || 7;
  const startToday = getZonedStartOfDay(now, timeZone);
  const sundayStart = new Date(startToday.getTime() + daysUntil * 24 * 60 * 60 * 1000);
  const sundayEnd = new Date(sundayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { sundayStart, sundayEnd, sundayDate: sundayStart, weekday: parts.weekday };
}

export async function runWednesdaySundayCheck(options?: { force?: boolean; timeZone?: string }) {
  const timeZone = options?.timeZone || process.env.APP_TIMEZONE || DEFAULT_TIMEZONE;
  const force = options?.force === true;
  const now = new Date();
  const { sundayStart, sundayEnd, sundayDate, weekday } = getNextSundayRange(now, timeZone);

  if (!force && weekday !== 3) {
    return {
      skipped: true,
      reason: "Only runs on Wednesdays",
      weekday,
      timeZone,
    };
  }

  const schedules = await prisma.schedule.findMany({
    where: {
      schedule_date: {
        gte: sundayStart,
        lte: sundayEnd,
      },
    },
    include: {
      teacher: true,
      course: true,
      section: true,
    },
  });

  if (schedules.length === 0) {
    return {
      success: true,
      timeZone,
      sunday: sundayDate.toISOString(),
      teachersNotified: 0,
      message: "No schedules found for Sunday",
    };
  }

  const schedulesByTeacher = new Map<string, typeof schedules>();
  for (const schedule of schedules) {
    const teacherId = schedule.teacher_id;
    const group = schedulesByTeacher.get(teacherId) || [];
    group.push(schedule);
    schedulesByTeacher.set(teacherId, group);
  }

  const teacherResults: Array<{ teacherId: string; teacherName: string; scheduleCount: number; status: string }> = [];
  
  for (const [teacherId, teacherSchedules] of schedulesByTeacher.entries()) {
    const teacher = teacherSchedules[0].teacher;
    const teacherName = `${teacher.first_name || ""} ${teacher.last_name || ""}`.trim() || "Teacher";

    await notifySundayScheduleReminder(
      {
        user_id: teacher.user_id,
        tg_id: teacher.tg_id,
        first_name: teacher.first_name,
        last_name: teacher.last_name,
      },
      teacherSchedules.map((s) => ({
        schedule_date: s.schedule_date,
        course: { course_name: s.course.course_name, course_description: s.course.course_description },
        section: { section_name: s.section.section_name },
      })),
      sundayDate
    );

    teacherResults.push({
      teacherId,
      teacherName,
      scheduleCount: teacherSchedules.length,
      status: teacher.tg_id ? "sent" : "skipped_no_telegram",
    });
  }

  return {
    success: true,
    timeZone,
    sunday: sundayDate.toISOString(),
    totalSchedules: schedules.length,
    teachersNotified: teacherResults.filter(t => t.status === "sent").length,
    teachers: teacherResults,
  };
}
