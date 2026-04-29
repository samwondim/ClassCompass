
import { Teacher } from "@/app/models/models";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import Link from "next/link";
import { getUserRole } from "@/utils/data-access";
import prisma from "@/models/client";
import { redirect } from "next/navigation";
import { Filter } from "@/components/filter";

async function getSections(managerId: string) {
    const managerSections = await prisma.managerSection.findMany({
        where: { manager_id: managerId },
        include: { section: true }
    });
    return managerSections.map(ms => ms.section);
}

async function getData(managerId: string, sectionId?: string): Promise<Teacher[]> {
  try {
    const managerSections = await prisma.managerSection.findMany({
      where: { manager_id: managerId },
      select: { section_id: true }
    });
    const sectionIds = managerSections.map(ms => ms.section_id);

    if (sectionIds.length === 0) return [];

    const whereClause: any = {
      section_id: sectionId ? { in: [sectionId] } : { in: sectionIds }
    };
    if (sectionId && !sectionIds.includes(sectionId)) return [];

    const teacherSections = await prisma.teacherSection.findMany({
      where: whereClause,
      include: {
        teacher: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            tg_username: true,
            phone_number: true,
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

    return teacherSections
      .filter(ts => ts.teacher.user_role !== null)
      .map(ts => ({
        user_id: ts.teacher.user_id,
        user_role: ts.teacher.user_role as any,
        first_name: ts.teacher.first_name,
        last_name: ts.teacher.last_name,
        tg_username: ts.teacher.tg_username,
        phone_number: ts.teacher.phone_number,
        sections: ts.section.section_name
      }));
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return [];
  } finally {
    await prisma.$disconnect();
  }
}

export default async function TeacherMgmtPage({ params, searchParams }: { params: { locale: string }, searchParams: { sectionId?: string } }) {
  const user = await getUserRole();
  if (!user) redirect('/');
  
  const sections = await getSections(user.user_id);
  const data = await getData(user.user_id, searchParams.sectionId);
  const base = `/${params.locale}/manager`;

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Teachers</h1>
        <div className="flex gap-4">
          <Filter 
            options={sections.map(s => ({ label: s.section_name || 'Unnamed Section', value: s.section_id }))} 
            placeholder="Select Section" 
            paramName="sectionId"
          />
          <Link href={`${base}/teachers/new`}>
            <span className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Add Teacher</span>
          </Link>
        </div>
      </div>
      {data.length === 0 ? (
        <p className="text-muted-foreground">No teachers found.</p>
      ) : (
        <DataTable columns={columns} data={data} />
      )}
    </div>
  );
}
