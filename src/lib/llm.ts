import OpenAI from 'openai'
import { ArticleLLMSchema, type ArticleLLMOutput, AnalysisSchema, type AnalysisOutput } from './schemas'
import { app } from '../../config/app'

const provider = (process.env.LLM_PROVIDER || 'openai').toLowerCase()

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY/LLM_API_KEY')
  return new OpenAI({ apiKey })
}

const SYSTEM_PROMPT = app.llm.summarizerPrompt

export async function summarizeArticle(input: { sourceName: string; url: string; title: string; summary?: string; date?: string; tagGuess?: string }): Promise<ArticleLLMOutput> {
  if (provider !== 'openai') throw new Error('Only openai supported for now')
  const client = getClient()
  const user = `SOURCE: ${input.sourceName}\nURL: ${input.url}\nTITLE: ${input.title}\nSUMMARY: ${input.summary ?? ''}\nPUBLISHED: ${input.date ?? ''}`
  const res = await client.chat.completions.create({
    model: app.llm.model,
    temperature: 0.4,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: user },
    ],
    response_format: { type: 'json_object' },
  })
  const text = res.choices[0]?.message?.content || '{}'
  const parsed = ArticleLLMSchema.safeParse(JSON.parse(text))
  if (!parsed.success) {
    throw new Error('LLM output validation failed')
  }
  const data = parsed.data
  if (!data.tag && input.tagGuess) data.tag = input.tagGuess
  // Ensure body length ~500 words; if too short, attempt one expansion pass
  const wordCount = data.body.trim().split(/\s+/).length
  if (wordCount < 420) {
    const expand = await client.chat.completions.create({
      model: app.llm.model, temperature: 0.4,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `${user}\nYour last answer was ${wordCount} words. Expand to 450–550 words with concrete details, context, and caveats. Output JSON only.` },
      ],
      response_format: { type: 'json_object' },
    })
    const t2 = expand.choices[0]?.message?.content || '{}'
    const p2 = ArticleLLMSchema.safeParse(JSON.parse(t2))
    if (p2.success) return { ...p2.data, tag: p2.data.tag || data.tag }
  }
  return data
}

const ANALYSIS_SYSTEM = app.llm.analyzerPrompt

export async function analyzeArticle(input: { title: string; dek: string; body: string; tag: string }): Promise<AnalysisOutput> {
  const client = getClient()
  const user = `Return JSON only. Follow this schema strictly. TITLE: ${input.title}\nDEK: ${input.dek}\nTAG: ${input.tag}\nBODY: ${input.body}`
  const analysisSchema = {
    name: 'analysis',
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        opinion: { type: 'string' },
        implications: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 6 },
      },
      required: ['opinion', 'implications'],
    },
    strict: true,
  } as const

  // First attempt: JSON schema guided
  const res = await client.chat.completions.create({
    model: app.llm.model,
    temperature: 0.3,
    messages: [
      { role: 'system', content: ANALYSIS_SYSTEM },
      { role: 'user', content: user },
    ],
    response_format: { type: 'json_schema', json_schema: analysisSchema as any },
  })
  let text = res.choices[0]?.message?.content || '{}'
  let parsed = AnalysisSchema.safeParse(JSON.parse(text))
  if (parsed.success) return parsed.data

  // Fallback: no schema, ask for pure JSON explicitly
  const res2 = await client.chat.completions.create({
    model: app.llm.model, temperature: 0.2,
    messages: [
      { role: 'system', content: ANALYSIS_SYSTEM },
      { role: 'user', content: `${user}\nRespond with a JSON object EXACTLY matching: {\"opinion\": string, \"implications\":[string]}` },
    ],
  })
  text = res2.choices[0]?.message?.content || '{}'
  parsed = AnalysisSchema.safeParse(JSON.parse(text))
  if (!parsed.success) throw new Error('Analysis validation failed')
  return parsed.data
}


