-- CreateTable
CREATE TABLE "ManagerSection" (
    "id" TEXT NOT NULL,
    "manager_id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,

    CONSTRAINT "ManagerSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ManagerSection_manager_id_section_id_key" ON "ManagerSection"("manager_id", "section_id");

-- AddForeignKey
ALTER TABLE "ManagerSection" ADD CONSTRAINT "ManagerSection_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagerSection" ADD CONSTRAINT "ManagerSection_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "Section"("section_id") ON DELETE CASCADE ON UPDATE CASCADE;
