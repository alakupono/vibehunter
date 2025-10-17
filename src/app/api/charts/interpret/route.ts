import OpenAI from 'openai'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const PROMPT = `You are a grounded analyst at Trinity Lenz (science meets metaphysics).
Write neutral, non-dogmatic insights from a natal chart. Avoid absolutes and sensational claims.
If a user question is provided, tailor the analysis to answer it directly while keeping context grounded.
Return ONLY JSON with keys: summary (string), planetInsights ([{body, note}]), aspectHighlights ([{pair, note}]), practicalReflection ([string]).`

export async function POST(req: Request) {
  try {
    const body = await req.json() as any // { meta, planets, aspects, question? }
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini', temperature: 0.3, response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: PROMPT },
        { role: 'user', content: JSON.stringify({ chart: { meta: body.meta, planets: body.planets, aspects: body.aspects }, question: body.question ?? null }) },
      ],
    })
    const text = res.choices[0]?.message?.content || '{}'
    const data = JSON.parse(text)
    return NextResponse.json(data)
  } catch (e: any) {
    const msg = typeof e === 'string' ? e : (e?.message ?? 'unexpected')
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}


