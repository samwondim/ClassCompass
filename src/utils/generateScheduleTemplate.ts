import ExcelJS from 'exceljs';
import { Context, InputFile } from 'grammy'; // Assuming you're using grammy
import prisma from '../models/Client';

async function generateScheduleTemplate(ctx: Context) {
  // Fetch all teachers from the database
  const teachers = await prisma.teacher.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  // Create a new workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Schedule Template');

  // Define columns
  worksheet.columns = [
    { header: 'Teacher Name', key: 'teacher_name', width: 25 },
    { header: 'Teacher Id', key: 'teacher_id', width: 15 },
    { header: 'Course Name', key: 'course_name', width: 25 },
    { header: 'Verse', key: 'verse', width: 20 },
    { header: 'Date', key: 'date', width: 20 },
    { header: 'Section', key: 'section', width: 20 },
  ];

  // Populate teacher names and IDs
  teachers.forEach((teacher) => {
    worksheet.addRow({
      teacher_name: teacher.name,
      teacher_id: teacher.id,
      course_name: '',
      verse: '',
      date: '',
      section: '',
    });
  });

  // Save file to buffer
  const buffer = await workbook.xlsx.writeBuffer();
  const uint8Array = new Uint8Array(buffer);
  // Send file to the manager on Telegram
  await ctx.replyWithDocument(
    new InputFile(uint8Array, 'Schedule.xlsx'),
    { caption: 'Here is the schedule template. Fill it in and send it back.' }
  );
}

export default generateScheduleTemplate;
