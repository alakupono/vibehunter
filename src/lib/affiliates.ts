import { prisma } from './db'

export async function resolveAffiliate(url: string): Promise<string | null> {
  try {
    const u = new URL(url)
    const domain = u.hostname.replace(/^www\./, '')
    const link = await prisma.affiliateLink.findFirst({ where: { domain } })
    return link?.url ?? null
  } catch {
    return null
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function decorateAffiliateMentions(
  markdown: string,
  opts: { keywordVariants: string[]; href: string; maxLinks?: number }
): string {
  const { keywordVariants, href } = opts
  const maxLinks = Math.max(1, opts.maxLinks ?? 5)

  // 1) Temporarily replace existing markdown links with placeholders
  const linkRegex = /\[[^\]]+\]\([^\)]+\)/g
  const saved: string[] = []
  let temp = markdown.replace(linkRegex, (m) => {
    const id = saved.push(m) - 1
    return `__LINK_${id}__`
  })

  // 2) Replace up to maxLinks keyword occurrences
  let remaining = maxLinks
  for (const kw of keywordVariants) {
    if (remaining <= 0) break
    const re = new RegExp(`\\b${escapeRegex(kw)}\\b`, 'gi')
    temp = temp.replace(re, (m) => {
      if (remaining <= 0) return m
      remaining -= 1
      return `[${m}](${href})`
    })
  }

  // 3) Restore saved links
  temp = temp.replace(/__LINK_(\d+)__/g, (_, i) => saved[Number(i)] ?? _)
  return temp
}


