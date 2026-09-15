import prisma from '@/lib/prisma';

// Returns the set of section ids a manager has access to, considering both the
// direct `section.manager_id` relation and the `ManagerSection` join table.
export async function getManagerSectionIds(managerId: string): Promise<string[]> {
  const [managerSections, directSections] = await Promise.all([
    prisma.managerSection.findMany({ where: { manager_id: managerId }, select: { section_id: true } }),
    prisma.section.findMany({ where: { manager_id: managerId }, select: { section_id: true } }),
  ]);

  return Array.from(
    new Set([
      ...managerSections.map(ms => ms.section_id),
      ...directSections.map(s => s.section_id),
    ])
  );
}

export async function managerCanAccessSection(managerId: string, sectionId: string): Promise<boolean> {
  const ids = await getManagerSectionIds(managerId);
  return ids.includes(sectionId);
}

export async function managerCanAccessTeacher(managerId: string, teacherId: string): Promise<boolean> {
  const [managedIds, teacherSections] = await Promise.all([
    getManagerSectionIds(managerId),
    prisma.teacherSection.findMany({ where: { teacher_id: teacherId }, select: { section_id: true } }),
  ]);

  return teacherSections.some(ts => managedIds.includes(ts.section_id));
}
