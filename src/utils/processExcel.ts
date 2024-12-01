import ExcelJS from "exceljs";
import { PrismaClient } from "@prisma/client";
async function insertSchedulesToDB(scheduleData: Array<any>) {
  const prisma = new PrismaClient();

  for (const row of scheduleData) {
    try {
      // Insert schedule into the database
      await prisma.schedule.create({
        data: {
          date: new Date(row.date),  // Use the parsed Date object
          title: row.topic,  // Assuming 'topic' corresponds to the 'title'
          verse: row.verse,  // Ensure this is a string
          teacher: {
            connect: { id: row.teacherId },  // Assuming 'teacherId' corresponds to the teacher ID
          },
        },
      });
      console.log("Schedules inserted successfully!");
    } catch (error) {
      console.error("Failed to insert schedule:", error);
    }
  }

}
export default async function processExcel(filePath: string) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.worksheets[0];
  const scheduleData: Array<any> = [];

  worksheet.eachRow({ includeEmpty: false }, (row, rowNum) => {
    if (rowNum > 1) {
      scheduleData.push({
        teacherId: row.getCell(1).value,
        topic: row.getCell(2).value,
        verse: row.getCell(3).value,
        date: row.getCell(4).value,
      });
    }
  });

  await insertSchedulesToDB(scheduleData);

}
