import handleTeacherRegisteration from "./processTeachersExcel";
import handleScheduleRegisteration from "./processScheduleRegisteration";

export default async function processExcel(filePath: string, fileName: string) {
  if (fileName === "Teachers.xlsx") {
    await handleTeacherRegisteration(filePath);
  } else {
    await handleScheduleRegisteration(filePath);
  }
}
