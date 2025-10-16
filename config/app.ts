export const app = {
  brandName: 'Trinity Lenz',
  tagline: 'Science meets Metaphysics — curated, analyzed, and grounded in spiritual inquiry.',
  sections: {
    radarTitle: 'Trinity Lenz Radar',
    ourTakeTitle: 'Our Lens',
    beginnerTitle: 'Starter Guides for Seekers',
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
    // Metaphysics / Spiritual-science news & essays
    { name: 'Scientific American: Mind', tag: 'consciousness', type: 'rss', url: 'https://www.scientificamerican.com/feed/topic/mind-and-brain/', weight: 1.0 },
    { name: 'Big Think', tag: 'philosophy', type: 'rss', url: 'https://bigthink.com/feed/', weight: 0.9 },
    { name: 'Institute of Noetic Sciences', tag: 'noetic', type: 'rss', url: 'https://noetic.org/blog/rss/', weight: 1.0 },
    { name: 'The Marginalian (Brain Pickings)', tag: 'wisdom', type: 'rss', url: 'https://www.themarginalian.org/feed/', weight: 0.8 },
    { name: 'AEON Essays', tag: 'philosophy', type: 'rss', url: 'https://aeon.co/feed.rss', weight: 0.9 },
    { name: 'Edge.org', tag: 'science', type: 'rss', url: 'https://www.edge.org/feeds/conversations.xml', weight: 0.8 },
    // Community and lineage-adjacent
    { name: 'Chopra Foundation (News)', tag: 'chopra', type: 'rss', url: 'https://www.choprafoundation.org/feed/', weight: 1.1 },
    { name: 'Deepak Chopra (Press/Blog)', tag: 'chopra', type: 'rss', url: 'https://www.deepakchopra.com/feed/', weight: 1.1 },
    { name: 'Seth Material Discussions (Reddit search)', tag: 'seth', type: 'rss', url: 'https://www.reddit.com/search.rss?q=%22Seth%20Material%22&sort=new', weight: 0.6 },
    { name: 'Consciousness Research (HN search)', tag: 'consciousness', type: 'rss', url: 'https://hnrss.org/newest?q=consciousness', weight: 0.5 },
  ],
  llm: {
    provider: process.env.LLM_PROVIDER ?? 'openai',
    model: 'gpt-4o-mini',
    summarizerPrompt:
      'You are an editor for Trinity Lenz, a publication where science meets metaphysics. Write accurate, neutral explainers around 500 words (aim 450–550). Integrate context on consciousness, subjective experience, and meaning-making without overclaiming. Honor empirical boundaries; avoid woo. Respond with JSON only matching the required schema.',
    analyzerPrompt:
      'You are a clear, non-dogmatic analyst informed by the lineage of Deepak Chopra and the Seth Material. Evaluate claims through a lens that values consciousness, mind-body connection, and multi-dimensional perspectives while remaining evidence-aware and non‑sensational. Surface trade-offs, open questions, and implications for personal practice. Output JSON only matching the required schema.',
    targetWords: { min: 450, max: 550 },
  },
  affiliate: {
    maxLinks: 3,
    keywordVariants: ['Deepak Chopra','Chopra','Seth Material','Seth','Jane Roberts'],
    domains: [
      { domain: 'chopra.com', url: 'https://chopra.com', label: 'Chopra' },
    ],
  },
  radarItems: [
    { label: 'Retreat: Mind-Body Workshop (Sedona)', price: '$1.2k', href: '#' },
    { label: 'Course: Consciousness & Science (online)', price: '$299', href: '#' },
    { label: 'Community: Seth Study Group', price: 'Free', href: '#' },
    { label: 'Journal: Noetic Sciences Review (back issues)', price: '$49', href: '#' },
    { label: 'Podcast: Science of Consciousness', price: 'Free', href: '#' },
  ],
} as const


