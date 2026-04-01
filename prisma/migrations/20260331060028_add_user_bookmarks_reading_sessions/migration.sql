-- CreateEnum
CREATE TYPE "BookmarkType" AS ENUM ('verse', 'word');

-- CreateTable
CREATE TABLE "bookmarks" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "verseId" TEXT NOT NULL,
    "wordId" TEXT,
    "type" "BookmarkType" NOT NULL DEFAULT 'verse',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reading_sessions" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "lastSurahId" INTEGER NOT NULL DEFAULT 1,
    "lastVerseNumber" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reading_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bookmarks_userId_idx" ON "bookmarks"("userId");

-- CreateIndex
CREATE INDEX "bookmarks_verseId_idx" ON "bookmarks"("verseId");

-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_userId_verseId_wordId_key" ON "bookmarks"("userId", "verseId", "wordId");

-- CreateIndex
CREATE UNIQUE INDEX "reading_sessions_userId_key" ON "reading_sessions"("userId");
