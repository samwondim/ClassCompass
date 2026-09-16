
import { Teacher } from "@/app/models/models";
import { columns } from "./columns";
import { UsersTable } from "@/components/users/users-table";
import { getUserRole } from "@/utils/data-access";
import { getManagerSectionIds } from "@/utils/access";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

async function getData(managerId: string): Promise<Teacher[]> {
  const sectionIds = await getManagerSectionIds(managerId);
  if (sectionIds.length === 0) return [];

  const teacherSections = await prisma.teacherSection.findMany({
    where: {
      section_id: { in: sectionIds },
      teacher: { user_role: 'TEACHER' }
    },
    include: {
      teacher: {
        select: {
          user_id: true,
          first_name: true,
          last_name: true,
          tg_username: true,
          phone_number: true,
          photo_url: true,
          user_role: true
        }
      },
      section: {
        select: {
          section_id: true,
          section_name: true
        }
      }
    }
  });

  const byTeacher = new Map<string, Teacher>();
  for (const ts of teacherSections) {
    const existing = byTeacher.get(ts.teacher.user_id);
    if (existing) {
      if (!existing.section_ids.includes(ts.section.section_id)) {
        existing.section_ids.push(ts.section.section_id);
        existing.sections = [existing.sections, ts.section.section_name].filter(Boolean).join(', ');
      }
    } else {
      byTeacher.set(ts.teacher.user_id, {
        user_id: ts.teacher.user_id,
        user_role: ts.teacher.user_role as any,
        first_name: ts.teacher.first_name,
        last_name: ts.teacher.last_name,
        tg_username: ts.teacher.tg_username,
        phone_number: ts.teacher.phone_number,
        photo_url: ts.teacher.photo_url,
        sections: ts.section.section_name,
        section_ids: [ts.section.section_id],
      });
    }
  }

  return Array.from(byTeacher.values());
}

export default async function TeacherMgmtPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await getUserRole();
  if (!user) redirect('/');

  const data = await getData(user.user_id);
  const base = `/${locale}/manager`;

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold text-primary mb-6">መምህራን</h1>
      <UsersTable
        users={data}
        columns={columns}
        addHref={`${base}/teachers/new`}
        addLabel="መምህር ጨምር"
        editBase="/manager/teachers"
      />
    </div>
  );
}
