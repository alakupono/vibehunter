-- CreateTable
CREATE TABLE "CandidateSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "evidence" TEXT,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandidateSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CandidateSource_url_key" ON "CandidateSource"("url");

-- CreateIndex
CREATE INDEX "idx_candidate_status_score" ON "CandidateSource"("status", "score");

-- CreateIndex
CREATE INDEX "idx_article_published" ON "Article"("publishedAt", "id");

-- CreateIndex
CREATE INDEX "idx_article_tag_published" ON "Article"("tag", "publishedAt");
