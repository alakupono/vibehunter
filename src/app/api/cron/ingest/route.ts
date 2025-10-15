import { NextResponse } from 'next/server'
import { ingestAllSources } from '@/lib/fetchers'

export const runtime = 'nodejs'

export async function POST() {
  const result = await ingestAllSources()
  return NextResponse.json(result)
}

export async function GET() {
  const result = await ingestAllSources()
  return NextResponse.json(result)
}


