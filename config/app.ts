export const app = {
  brandName: 'Vibe Hunter',
  tagline: 'Auto‑curated updates for Cursor, Copilot, Replit, v0 and more.',
  sections: {
    radarTitle: 'Vibe Hunter Radar',
    ourTakeTitle: 'Our Take',
    beginnerTitle: 'Starter Guides for Vibe Coders',
    showBeginnerTwoUp: true,
  },
  colors: { accent: '#22D3EE', accent2: '#A78BFA' },
  assets: {
    heroFallback: '/fallback.png',
    sponsorImage: '/sponsor1.png',
    sponsorHref: 'https://example.com',
    sponsorLabel: 'Sponsored Ad',
  },
  sources: [
    { name: 'Vercel Changelog', tag: 'v0', type: 'atom', url: 'https://vercel.com/changelog.atom', weight: 1.2 },
    { name: 'GitHub Changelog', tag: 'copilot', type: 'rss', url: 'https://github.blog/changelog/feed/', weight: 1.1 },
    { name: 'Replit Blog', tag: 'replit', type: 'rss', url: 'https://blog.replit.com/feed.xml', weight: 1.0 },
  ],
  llm: {
    provider: process.env.LLM_PROVIDER ?? 'openai',
    model: 'gpt-4o-mini',
    summarizerPrompt:
      'You are a concise tech editor for a site called Vibe Coding News. Write accurate, neutral explainers around 500 words (aim 450–550), with 2–5 concrete takeaways. Never fabricate or overhype. Respond with JSON only that matches the required schema.',
    analyzerPrompt:
      "You are a neutral, pragmatic staff engineer. Provide a non-biased, defensible analysis surfacing trade-offs, risks, and limits. Use plain, direct language. Output JSON only matching the required schema.",
    targetWords: { min: 450, max: 550 },
  },
  affiliate: {
    maxLinks: 5,
    keywordVariants: ['Lovable', 'lovable', 'Lovable.dev', 'lovable.dev'],
    domains: [{ domain: 'lovable.dev', url: 'https://lovable.dev/?via=vibehunter', label: 'Lovable' }],
  },
  radarItems: [
    { label: 'SaaS: AI Prompt Cards', price: '$12k', href: '#' },
    { label: 'Community: Builders in v0 (Discord)', price: '$2.1k', href: '#' },
    { label: 'App: Prompt Graph', price: '$8.4k', href: '#' },
    { label: 'Blog: AI Daily (11k uniques/mo)', price: '$6.2k', href: '#' },
  ],
} as const


