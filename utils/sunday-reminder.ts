import prisma from "@/models/client";
import { notifyMissingSundaySchedule, notifySundayScheduleReminder } from "@/utils/notifications";

const DEFAULT_TIMEZONE = "Africa/Addis_Ababa";

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  weekday: number; // 0=Sun..6=Sat
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

export async function runSundayReminder(options?: { force?: boolean; timeZone?: string }) {
  const timeZone = options?.timeZone || process.env.APP_TIMEZONE || DEFAULT_TIMEZONE;
  const force = options?.force === true;
  const now = new Date();
  const { sundayStart, sundayEnd, sundayDate, weekday } = getNextSundayRange(now, timeZone);

  if (!force && weekday !== 3 && weekday !== 5) {
    return {
      skipped: true,
      reason: "Only runs on Wednesdays and Fridays",
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

  const schedulesByTeacher = new Map<string, typeof schedules>();
  for (const schedule of schedules) {
    const teacherId = schedule.teacher_id;
    const group = schedulesByTeacher.get(teacherId) || [];
    group.push(schedule);
    schedulesByTeacher.set(teacherId, group);
  }

  const teacherResults: Array<{ teacherId: string; status: string }> = [];
  for (const [teacherId, teacherSchedules] of schedulesByTeacher.entries()) {
    const teacher = teacherSchedules[0].teacher;
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
    teacherResults.push({ teacherId, status: teacher.tg_id ? "sent" : "skipped" });
  }

  const sections = await prisma.section.findMany({
    select: {
      section_id: true,
      section_name: true,
      manager_id: true,
      manager: { select: { user_id: true, tg_id: true, first_name: true, last_name: true } },
    },
  });

  const sectionsWithSchedules = new Set(schedules.map((s) => s.section_id));
  const sectionsWithoutSchedules = sections.filter((s) => !sectionsWithSchedules.has(s.section_id));

  const managerAssignments = await prisma.managerSection.findMany({
    where: { section_id: { in: sectionsWithoutSchedules.map((s) => s.section_id) } },
    include: { manager: { select: { user_id: true, tg_id: true, first_name: true, last_name: true } } },
  });

  const managersBySection = new Map<
    string,
    Array<{ user_id: string; tg_id: string | number | null; first_name?: string | null; last_name?: string | null }>
  >();
  for (const assignment of managerAssignments) {
    const list = managersBySection.get(assignment.section_id) || [];
    list.push(assignment.manager);
    managersBySection.set(assignment.section_id, list);
  }

  const managerResults: Array<{ sectionId: string; managerId: string; status: string }> = [];
  for (const section of sectionsWithoutSchedules) {
    const managers: Array<{ user_id: string; tg_id: string | number | null; first_name?: string | null; last_name?: string | null }> = [];
    if (section.manager) {
      managers.push(section.manager);
    }
    const assigned = managersBySection.get(section.section_id) || [];
    for (const m of assigned) {
      if (!managers.find((x) => x.user_id === m.user_id)) {
        managers.push(m);
      }
    }

    for (const manager of managers) {
      await notifyMissingSundaySchedule(
        {
          user_id: manager.user_id,
          tg_id: manager.tg_id,
          first_name: manager.first_name,
          last_name: manager.last_name,
        },
        section.section_name,
        sundayDate
      );
      managerResults.push({
        sectionId: section.section_id,
        managerId: manager.user_id,
        status: manager.tg_id ? "sent" : "skipped",
      });
    }
  }

  return {
    success: true,
    timeZone,
    sunday: sundayDate.toISOString(),
    teachers: teacherResults,
    managers: managerResults,
    sectionsWithoutSchedules: sectionsWithoutSchedules.length,
  };
}
