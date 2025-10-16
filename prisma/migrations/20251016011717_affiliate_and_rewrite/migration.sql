-- CreateTable
CREATE TABLE "AffiliateLink" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewriteJob" (
    "id" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "originalArticleId" TEXT NOT NULL,
    "rewrittenArticleId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewriteJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateLink_domain_key" ON "AffiliateLink"("domain");

-- AddForeignKey
ALTER TABLE "RewriteJob" ADD CONSTRAINT "RewriteJob_originalArticleId_fkey" FOREIGN KEY ("originalArticleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewriteJob" ADD CONSTRAINT "RewriteJob_rewrittenArticleId_fkey" FOREIGN KEY ("rewrittenArticleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;
