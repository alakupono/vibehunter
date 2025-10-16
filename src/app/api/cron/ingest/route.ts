import { NextResponse } from 'next/server'
import { ingestAllSources } from '@/lib/fetchers'

export const runtime = 'nodejs'

export async function POST() {
  try {
    const result = await ingestAllSources()
    return NextResponse.json(result)
  } catch (e: any) {
    console.error('ingest error', e)
    return new NextResponse(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: { 'content-type': 'application/json' } })
  }
}

export async function GET() { return POST() }


