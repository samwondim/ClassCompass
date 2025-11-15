/*
  Warnings:

  - A unique constraint covering the columns `[teacher_id,section_id]` on the table `TeacherSection` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "TeacherSection_teacher_id_section_id_key" ON "TeacherSection"("teacher_id", "section_id");
