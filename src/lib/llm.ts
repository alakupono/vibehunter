import OpenAI from 'openai'
import { ArticleLLMSchema, type ArticleLLMOutput } from './schemas'

const provider = (process.env.LLM_PROVIDER || 'openai').toLowerCase()

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY/LLM_API_KEY')
  return new OpenAI({ apiKey })
}

const SYSTEM_PROMPT = `You are a concise tech editor for a site called Vibe Coding News. Summarize AI-assisted software development updates into accurate 150–300 word explainers with 2–5 takeaways. Never fabricate or overhype.`

export async function summarizeArticle(input: { sourceName: string; url: string; title: string; summary?: string; date?: string; tagGuess?: string }): Promise<ArticleLLMOutput> {
  if (provider !== 'openai') throw new Error('Only openai supported for now')
  const client = getClient()
  const user = `SOURCE: ${input.sourceName}\nURL: ${input.url}\nTITLE: ${input.title}\nSUMMARY: ${input.summary ?? ''}\nPUBLISHED: ${input.date ?? ''}`
  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
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
  return data
}


