import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { app } from '@/../config/app'

export const runtime = 'nodejs'

export async function POST() {
  const domains = app.affiliate.domains
  for (const d of domains) {
    await prisma.affiliateLink.upsert({
      where: { domain: d.domain },
      update: { url: d.url, label: d.label ?? d.domain },
      create: { domain: d.domain, url: d.url, label: d.label ?? d.domain },
    })
  }
  return NextResponse.json({ ok: true, seeded: domains.length })
}

export async function GET() { return POST() }


