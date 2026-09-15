import prisma from "@/lib/prisma";
import { notifyWeeklyEmptyScheduleReport } from "@/utils/notifications";

const DEFAULT_TIMEZONE = "Africa/Addis_Ababa";

function getNextSunday(now: Date, timeZone: string): Date {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = dtf.formatToParts(now);
  const values: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") values[part.type] = part.value;
  }

  const weekdayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };

  const dtfWeekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  });
  const weekdayStr = dtfWeekday.format(now);
  const weekday = weekdayMap[weekdayStr];

  const daysUntil = (7 - weekday) % 7 || 7;
  const utcGuess = new Date(Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    0, 0, 0
  ));

  const offsetDtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const offsetParts = offsetDtf.formatToParts(utcGuess);
  const offsetValues: Record<string, string> = {};
  for (const part of offsetParts) {
    if (part.type !== "literal") offsetValues[part.type] = part.value;
  }
  const offsetMs = Date.UTC(
    Number(offsetValues.year),
    Number(offsetValues.month) - 1,
    Number(offsetValues.day),
    Number(offsetValues.hour),
    Number(offsetValues.minute),
    Number(offsetValues.second)
  ) - utcGuess.getTime();

  const localStart = new Date(utcGuess.getTime() - offsetMs);
  const sunday = new Date(localStart.getTime() + daysUntil * 24 * 60 * 60 * 1000);
  return sunday;
}

export async function runEmptyScheduleAlert(options?: { force?: boolean; timeZone?: string }) {
  const timeZone = options?.timeZone || process.env.APP_TIMEZONE || DEFAULT_TIMEZONE;
  const now = new Date();
  const nextSunday = getNextSunday(now, timeZone);

  const upcomingSchedules = await prisma.schedule.findMany({
    where: {
      schedule_date: {
        gte: now,
        lte: nextSunday,
      },
    },
    select: {
      section_id: true,
    },
  });

  const scheduledSectionIds = new Set(upcomingSchedules.map(s => s.section_id));

  const sections = await prisma.section.findMany({
    select: {
      section_id: true,
      section_name: true,
      manager_id: true,
      manager: {
        select: {
          user_id: true,
          tg_id: true,
          first_name: true,
          last_name: true
        }
      },
    },
  });

  const sectionsWithoutSchedules = sections.filter(s => !scheduledSectionIds.has(s.section_id));

  if (sectionsWithoutSchedules.length === 0) {
    return {
      success: true,
      timeZone,
      nextSunday: nextSunday.toISOString(),
      sectionsWithoutSchedules: 0,
      message: "All sections have schedules",
    };
  }

  const managerAssignments = await prisma.managerSection.findMany({
    where: { section_id: { in: sectionsWithoutSchedules.map(s => s.section_id) } },
    include: {
      manager: {
        select: {
          user_id: true,
          tg_id: true,
          first_name: true,
          last_name: true
        }
      }
    },
  });

  const managersBySection = new Map<string, typeof managerAssignments>();
  for (const assignment of managerAssignments) {
    const list = managersBySection.get(assignment.section_id) || [];
    list.push(assignment);
    managersBySection.set(assignment.section_id, list);
  }

  // Build a per-manager view of their empty sections so each manager only
  // receives a report about sections they actually manage.
  const managerEmptySections = new Map<
    string,
    { user_id: string; tg_id: string | null; first_name?: string | null; last_name?: string | null; sections: string[] }
  >();

  for (const section of sectionsWithoutSchedules) {
    const managers: Array<{ user_id: string; tg_id: string | null; first_name?: string | null; last_name?: string | null }> = [];

    if (section.manager) {
      managers.push(section.manager);
    }

    const assigned = managersBySection.get(section.section_id) || [];
    for (const a of assigned) {
      if (!managers.find(m => m.user_id === a.manager.user_id)) {
        managers.push(a.manager);
      }
    }

    for (const manager of managers) {
      const entry = managerEmptySections.get(manager.user_id) || {
        user_id: manager.user_id,
        tg_id: manager.tg_id,
        first_name: manager.first_name,
        last_name: manager.last_name,
        sections: [],
      };
      if (!entry.sections.includes(section.section_name)) {
        entry.sections.push(section.section_name);
      }
      managerEmptySections.set(manager.user_id, entry);
    }
  }

  await notifyWeeklyEmptyScheduleReport(Array.from(managerEmptySections.values()));

  return {
    success: true,
    timeZone,
    nextSunday: nextSunday.toISOString(),
    totalSections: sections.length,
    sectionsWithoutSchedules: sectionsWithoutSchedules.length,
    managersNotified: managerEmptySections.size,
  };
}
