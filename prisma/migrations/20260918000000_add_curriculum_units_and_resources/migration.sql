-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('FILE', 'LINK', 'IMAGE', 'VIDEO');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "age_group" TEXT,
ADD COLUMN     "duration_minutes" INTEGER,
ADD COLUMN     "lesson_plan" JSONB,
ADD COLUMN     "order" INTEGER DEFAULT 0,
ADD COLUMN     "unit_id" TEXT;

-- CreateTable
CREATE TABLE "CurriculumUnit" (
    "unit_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "period" TEXT,
    "section_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurriculumUnit_pkey" PRIMARY KEY ("unit_id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "resource_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL DEFAULT 'FILE',
    "url" TEXT NOT NULL,
    "mime_type" TEXT,
    "size" INTEGER,
    "course_id" TEXT,
    "section_id" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("resource_id")
);

-- CreateIndex
CREATE INDEX "CurriculumUnit_section_id_idx" ON "CurriculumUnit"("section_id");

-- CreateIndex
CREATE INDEX "Resource_course_id_idx" ON "Resource"("course_id");

-- CreateIndex
CREATE INDEX "Resource_section_id_idx" ON "Resource"("section_id");

-- CreateIndex
CREATE INDEX "Course_unit_id_idx" ON "Course"("unit_id");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "CurriculumUnit"("unit_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumUnit" ADD CONSTRAINT "CurriculumUnit_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "Section"("section_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumUnit" ADD CONSTRAINT "CurriculumUnit_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("course_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "Section"("section_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
