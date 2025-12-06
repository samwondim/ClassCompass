// app/manager/page.tsx
import { Manager } from "@/app/models/models";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { AddManagerButton } from "@/components/add-manager-button";
import prisma from "@/models/client";

// Map Prisma user → Manager DTO
const toPublicManager = (user: any): Manager => {
  return {
    user_role: user.user_role,
    user_id: user.user_id,
    telegram_id: user.tg_id,
    first_name: user.first_name,
    last_name: user.last_name,
    tg_username: user.tg_username,
    phone_number: user.phone_number,
    sections: user.sections_managed
  }
};

async function getData(): Promise<Manager[]> {
  try {
    const users = await prisma.user.findMany({
      where: {
        user_role: "MANAGER"
      },
      select: {
        user_role: true,
        user_id: true,
        first_name: true,
        last_name: true,
        tg_username: true,
        phone_number: true,
        sections_managed: {
          select: {
            section_name: true,
            section_id: true
          }
        },
        ManagerSection: {
          select: {
            section: {
              select: {
                section_name: true,
                section_id: true
              }
            }
          }
        }
      }
    });

    const managers = users.map(user => ({
      ...toPublicManager(user),
      sections: [
        ...user.sections_managed,
        ...user.ManagerSection.map((ms: any) => ms.section)
      ]
    }));

    return managers;
  } catch (error) {
    console.error('Error fetching managers:', error);
    return [];
  }
}

export default async function DemoPage() {
  const data = await getData();

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Managers</h1>
        <AddManagerButton />
      </div>
      {data.length === 0 ? (
        <p className="text-muted-foreground">No managers found.</p>
      ) : (
        <DataTable columns={columns} data={data} />
      )}
    </div>
  );
}
