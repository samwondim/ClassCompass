
import prisma from "../models/Client";
import ExcelJS from "exceljs";

async function registerTeachers(scheduleData: Array<any>) {
  for (const row of scheduleData) {
    try {
      await prisma.teacher.upsert({
        where: { phone_number: row.phone_number }, // Search by unique field
        update: {
          name: row.name,
          is_manager: row.is_manager
        }, // Update existing record
        create: {
          name: row.name,
          phone_number: row.phone_number,
          is_manager: row.is_manager
        } // Create new record if not found
      });
      console.log("Teachers Registered successfully")
    } catch (error) {
      console.log("Failed to instert Teachers to db", error);

    }
  }
}

export default async function handleTeacherRegisteration(filePath: string) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.worksheets[0];
  const teachersData: Array<any> = [];

  worksheet.eachRow({ includeEmpty: false }, (row, rowNum) => {
    if (rowNum > 1) {
      teachersData.push({
        name: row.getCell(1).value,
        is_manager: row.getCell(2).value === "Manager" ? true : false,
        phone_number: row.getCell(3).value
      })
    }
  })

  await registerTeachers(teachersData);
}
