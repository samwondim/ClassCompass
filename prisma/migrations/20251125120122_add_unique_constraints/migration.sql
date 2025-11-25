/*
  Warnings:

  - A unique constraint covering the columns `[teacher_id,course_id]` on the table `Schedule` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Schedule_teacher_id_course_id_key" ON "Schedule"("teacher_id", "course_id");
