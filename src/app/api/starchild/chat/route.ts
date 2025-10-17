import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { DateTime } from 'luxon'
import { computeNatal } from '@/lib/astro'

export const runtime = 'nodejs'

type Msg = { role: 'user' | 'assistant'; content: string }

function normalizeTime(input: string): string | null {
  const m = input.trim().match(/^(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?$/i)
  if (!m) return null
  let h = parseInt(m[1]!, 10)
  const min = m[2] ? parseInt(m[2]!, 10) : 0
  const ap = m[3]?.toLowerCase()
  if (ap === 'am') {
    if (h === 12) h = 0
  } else if (ap === 'pm') {
    if (h !== 12) h += 12
  }
  if (h < 0 || h > 23 || min < 0 || min > 59) return null
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

async function geocode(place: string): Promise<{ lat: number; lng: number }> {
  const key = process.env.GOOGLE_GEOCODING_API_KEY
  if (!key) throw new Error('Missing GOOGLE_GEOCODING_API_KEY')
  const r = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(place)}&key=${key}`)
  const j = await r.json()
  const loc = j?.results?.[0]?.geometry?.location
  if (!loc) throw new Error('Could not geocode place')
  return { lat: loc.lat as number, lng: loc.lng as number }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { messages: Msg[]; context?: { chart?: any } }
    const contextChart = body?.context?.chart ?? null
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
    const lastUser = [...(body.messages||[])].reverse().find(m => m.role === 'user')

    const tools: any[] = [
      {
        type: 'function',
        function: {
          name: 'compute_natal',
          description: 'Compute natal chart for a birth event. Requires date (YYYY-MM-DD), time (24h HH:mm or 12h like 2:22pm), and place string.',
          parameters: {
            type: 'object',
            properties: {
              date: { type: 'string', description: 'YYYY-MM-DD' },
              time: { type: 'string', description: 'HH:mm or h:mm am/pm' },
              place: { type: 'string', description: 'City, Region or City, Country' },
            },
            required: ['date', 'time', 'place'],
            additionalProperties: false,
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'interpret_chart',
          description: 'Generate a grounded, neutral interpretation of a natal chart and optionally answer a user question about it.',
          parameters: {
            type: 'object',
            properties: {
              chart: { type: 'object', description: 'Natal chart payload produced by compute_natal' },
              question: { type: 'string', description: 'Optional user question to address' },
            },
            required: [],
            additionalProperties: false,
          },
        },
      },
    ]

    const systemPrompt = `You are Trinity Lenz, a calm, precise guide (science meets metaphysics). 
You hold a friendly conversation, ask for missing details, and when appropriate you call tools to compute a natal chart and interpret it. 
If the user provides partial info, ask clarifying questions. Keep answers factual and non-dogmatic.
If a chart already exists in context, you can interpret it without recomputing.`

    const baseMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...(contextChart
        ? [{ role: 'system' as const, content: `A chart is already available in context. Use it if needed.` }]
        : []),
      ...body.messages,
    ]

    let chart: any = null
    let interpretation: any = null

    // First call: let the model decide to call tools
    const first = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      messages: baseMessages as any,
      tools,
      tool_choice: 'auto',
    })

    const msg = first.choices[0]?.message as any

    let toolAugmentedMessages: any[] = [...baseMessages, msg]
    if (msg?.tool_calls?.length) {
      for (const call of msg.tool_calls) {
        if (call.function?.name === 'compute_natal') {
          const args = JSON.parse(call.function.arguments || '{}') as { date?: string; time?: string; place?: string }
          const date = args.date && /^\d{4}-\d{2}-\d{2}$/.test(args.date) ? args.date : null
          const t = args.time ? normalizeTime(args.time) : null
          const place = args.place?.trim() || ''
          if (!date || !t || !place) {
            toolAugmentedMessages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify({ error: 'Need date (YYYY-MM-DD), time, and place.' }) })
          } else {
            try {
              const result = await computeNatal({ date, time: t, place, geocode })
              chart = result
              toolAugmentedMessages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) })
            } catch (e: any) {
              toolAugmentedMessages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify({ error: e?.message || 'natal failed' }) })
            }
          }
        } else if (call.function?.name === 'interpret_chart') {
          const args = JSON.parse(call.function.arguments || '{}') as { chart?: any; question?: string }
          const chartInput = args.chart || contextChart || chart
          if (!chartInput) {
            toolAugmentedMessages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify({ error: 'No chart available to interpret.' }) })
          } else {
            try {
              const question = (args.question ?? lastUser?.content ?? '').slice(0, 600)
              const isSimple = /\/|\?|^what\b|^how\b|^do\b|^is\b|^are\b|^can\b|^should\b/i.test(question)
              const sysSimple = 'Speak simply to a curious friend. Use everyday words, short sentences, no jargon. Be neutral and grounded.'
              const sysStructured = 'Return JSON only. Keys: summary, planetInsights ([{body,note}]), aspectHighlights ([{pair,note}]), practicalReflection ([string]).'
              const sysSimpleJSON = 'Return ONLY JSON with keys: answer (string, 3-5 sentences, grade-6), bullets ([string, 2-4 items of practical meaning]), nextQuestions ([string, 2-4 concise follow-up questions]).'
              const messages = isSimple
                ? [ { role:'system' as const, content: `${sysSimple} ${sysSimpleJSON}` }, { role:'user' as const, content: JSON.stringify({ chart: { meta: chartInput.meta, planets: chartInput.planets, aspects: chartInput.aspects }, question }) } ]
                : [ { role:'system' as const, content: `You are a grounded analyst at Trinity Lenz (science meets metaphysics). ${sysStructured}` }, { role:'user' as const, content: JSON.stringify({ chart: { meta: chartInput.meta, planets: chartInput.planets, aspects: chartInput.aspects }, question }) } ]
              const res = await client.chat.completions.create({ model: 'gpt-4o-mini', temperature: 0.3, response_format: { type: 'json_object' }, messages })
              const text = res.choices[0]?.message?.content || '{}'
              const data = JSON.parse(text)
              interpretation = data
              toolAugmentedMessages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(data) })
            } catch (e: any) {
              toolAugmentedMessages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify({ error: e?.message || 'interpretation failed' }) })
            }
          }
        }
      }
    }

    // Second call: produce a conversational response incorporating tool results
    const second = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.5,
      messages: toolAugmentedMessages as any,
    })
    const answer = second.choices[0]?.message?.content || 'Okay.'

    return NextResponse.json({ message: { role: 'assistant', content: answer }, chart, interpretation })
  } catch (e: any) {
    const msg = typeof e === 'string' ? e : (e?.message ?? 'unexpected')
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}


