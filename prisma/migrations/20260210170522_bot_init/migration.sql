-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "chatId" TEXT NOT NULL,
    "city" TEXT,
    "dailyTime" TEXT DEFAULT '10:00',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Minsk',
    "enabledDailyDigest" BOOLEAN NOT NULL DEFAULT false,
    "lastDigestAt" DATETIME
);
INSERT INTO "new_User" ("chatId", "city", "dailyTime", "enabledDailyDigest", "id", "lastDigestAt", "timezone") SELECT "chatId", "city", "dailyTime", "enabledDailyDigest", "id", "lastDigestAt", "timezone" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_chatId_key" ON "User"("chatId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
