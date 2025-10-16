import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST() {
  await prisma.affiliateLink.upsert({
    where: { domain: 'lovable.dev' },
    update: { url: 'https://lovable.dev/?via=vibehunter', label: 'Lovable' },
    create: { domain: 'lovable.dev', url: 'https://lovable.dev/?via=vibehunter', label: 'Lovable' },
  })
  return NextResponse.json({ ok: true })
}

export async function GET() { return POST() }


