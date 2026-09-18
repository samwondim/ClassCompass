-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL DEFAULT 'app',
    "app_name" TEXT NOT NULL DEFAULT 'Sunday School Reminder',
    "bot_description" TEXT,
    "bot_short_description" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);
