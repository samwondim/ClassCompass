
// app/manager/teachers/page.tsx
import { Teacher } from "@/app/models/models";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import Link from "next/link";
import { getUserRole } from "@/utils/data-access";
import prisma from "@/models/client";
import { redirect } from "next/navigation";

async function getData(): Promise<Teacher[]> {
  try {
    // Get authenticated user directly (server component has access to cookies)
    const user = await getUserRole();

    if (!user) {
      redirect('/');
    }

    if (user.user_role !== 'MANAGER') {
      console.error('Unauthorized: User is not a manager');
      return [];
    }

    // Get sections managed by this manager
    const managerSections = await prisma.managerSection.findMany({
      where: {
        manager_id: user.user_id
      },
      select: {
        section_id: true
      }
    });

    const sectionIds = managerSections.map(ms => ms.section_id);

    if (sectionIds.length === 0) {
      return [];
    }

    // Fetch teachers assigned to those sections
    const teacherSections = await prisma.teacherSection.findMany({
      where: {
        section_id: { in: sectionIds }
      },
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

    // Transform to match the Teacher model format and filter out invalid entries
    const teachers = teacherSections
      .filter(ts => ts.teacher.user_role !== null) // Filter out teachers with null role
      .map(ts => ({
        user_id: ts.teacher.user_id,
        user_role: ts.teacher.user_role as any,  // Type assertion for Enum compatibility
        first_name: ts.teacher.first_name,
        last_name: ts.teacher.last_name,
        tg_username: ts.teacher.tg_username,
        phone_number: ts.teacher.phone_number,
        sections: ts.section.section_name
      }));

    return teachers;
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return [];
  } finally {
    await prisma.$disconnect();
  }
}

export default async function TeacherMgmtPage({ params }: { params: { locale: string } }) {
  const data = await getData();
  const base = `/${params.locale}/manager`;

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Teachers</h1>
        <Link href={`${base}/teachers/new`}>
          <span className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">Add Teacher</span>
        </Link>
      </div>
      {data.length === 0 ? (
        <p className="text-muted-foreground">No teachers found.</p>
      ) : (
        <DataTable columns={columns} data={data} />
      )}
    </div>
  );
}
