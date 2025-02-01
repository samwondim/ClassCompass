import prisma from "../models/Client";
import ExcelJS from "exceljs";

async function insertSchedulesToDB(scheduleData: Array<any>) {
  for (const row of scheduleData) {
    const section = await prisma.section.findFirst(
      {
        where: { section_name: row.section },
      }
    );

    if (!section) {
      console.log("section not found");
      return;
    }

    const newCourse = await prisma.course.create({
      data: {
        course_name: row.course_name,
        verse: row.verse
      }
    });

    try {
      // Insert schedule into the database
      await prisma.schedule.create({
        data: {
          date: row.date,
          teacher_id: Number.parseInt(row.teacherId),
          section_id: section.id, // Use existing section ID
          course_id: newCourse.id,
        }
      });
      console.log("Schedules inserted successfully!");
    } catch (error) {
      console.error("Failed to insert schedule:", error);
    }
  }

}

export default async function handleScheduleRegisteration(filePath: string) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.worksheets[0];
  const scheduleData: Array<any> = [];

  worksheet.eachRow({ includeEmpty: false }, (row, rowNum) => {
    if (rowNum > 1) {
      scheduleData.push({
        course_name: row.getCell(1).value,
        verse: row.getCell(2).value,
        date: row.getCell(3).value,
        section: row.getCell(4).value,
        teacherId: row.getCell(6).value,
      });
    }
  });

  await insertSchedulesToDB(scheduleData);
}
