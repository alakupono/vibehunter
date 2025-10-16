import { z } from 'zod'

export const ArticleLLMSchema = z.object({
  title: z.string().min(10).max(160),
  dek: z.string().min(20).max(280),
  takeaways: z.array(z.string().min(3)).min(2).max(5),
  body: z.string().min(300).max(4000),
  tag: z.string().min(2).max(24),
})

export type ArticleLLMOutput = z.infer<typeof ArticleLLMSchema>

export const AnalysisSchema = z.object({
  opinion: z.string().min(60).max(300),
  implications: z.array(z.string().min(6).max(140)).min(2).max(6).optional(),
})
export type AnalysisOutput = z.infer<typeof AnalysisSchema>


