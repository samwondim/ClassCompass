-- DropForeignKey
ALTER TABLE "Section" DROP CONSTRAINT "Section_manager_id_fkey";

-- AlterTable
ALTER TABLE "Section" ALTER COLUMN "manager_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
