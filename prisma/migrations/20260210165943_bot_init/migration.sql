-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "chatId" TEXT NOT NULL,
    "city" TEXT,
    "dailyTime" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Minsk',
    "enabledDailyDigest" BOOLEAN NOT NULL DEFAULT false,
    "lastDigestAt" DATETIME
);

-- CreateTable
CREATE TABLE "SentQuestion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "questionId" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SentQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_chatId_key" ON "User"("chatId");

-- CreateIndex
CREATE INDEX "SentQuestion_userId_sentAt_idx" ON "SentQuestion"("userId", "sentAt");

-- CreateIndex
CREATE INDEX "SentQuestion_questionId_idx" ON "SentQuestion"("questionId");
