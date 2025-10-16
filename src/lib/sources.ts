export type Source = { name: string; tag: string; type: 'rss'|'atom'|'github-releases'; url: string; weight: number };

export const SOURCES: Source[] = [
  { name: 'Vercel Changelog', tag: 'v0', type: 'atom', url: 'https://vercel.com/changelog.atom', weight: 1.2 },
  { name: 'GitHub Changelog', tag: 'copilot', type: 'rss', url: 'https://github.blog/changelog/feed/', weight: 1.1 },
  { name: 'Replit Blog', tag: 'replit', type: 'rss', url: 'https://blog.replit.com/feed.xml', weight: 1.0 },
  { name: 'Next.js Blog', tag: 'nextjs', type: 'rss', url: 'https://nextjs.org/feed.xml', weight: 1.0 },
  // Creative AI (video/music/voice)
  { name: 'Suno Blog', tag: 'suno', type: 'rss', url: 'https://www.suno.ai/blog?format=rss', weight: 1.0 },
  { name: 'Runway ML', tag: 'runway', type: 'rss', url: 'https://research.runwayml.com/rss.xml', weight: 0.9 },
  { name: 'Pika Labs', tag: 'pika', type: 'rss', url: 'https://pika.art/blog/rss', weight: 0.8 },
  { name: 'Luma AI', tag: 'luma', type: 'rss', url: 'https://lumalabs.ai/blog/rss', weight: 0.8 },
  { name: 'ElevenLabs', tag: 'elevenlabs', type: 'rss', url: 'https://blog.elevenlabs.io/rss/', weight: 0.9 },

  // Platforms & research
  { name: 'OpenAI (RSS)', tag: 'sora', type: 'rss', url: 'https://openai.com/blog/rss/', weight: 1.2 },
  { name: 'Google AI Blog', tag: 'googleai', type: 'atom', url: 'https://blog.research.google/atom.xml', weight: 1.0 },
  { name: 'Meta AI', tag: 'meta', type: 'rss', url: 'https://ai.meta.com/blog/feed/', weight: 0.9 },
  { name: 'Anthropic News', tag: 'anthropic', type: 'rss', url: 'https://www.anthropic.com/news/rss.xml', weight: 0.9 },
  { name: 'Stability AI', tag: 'stability', type: 'rss', url: 'https://stability.ai/blog/rss.xml', weight: 0.8 },
  { name: 'Perplexity', tag: 'perplexity', type: 'rss', url: 'https://www.perplexity.ai/hub/feed.xml', weight: 0.7 },

  // Hardware
  { name: 'NVIDIA Developer Blog', tag: 'hardware', type: 'rss', url: 'https://developer.nvidia.com/blog/feed/', weight: 1.0 },
  { name: 'AMD Community Dev', tag: 'hardware', type: 'rss', url: 'https://community.amd.com/ps/devhub-blog/rss/Board:devhub-blog', weight: 0.7 },

  // Entertainment tech
  { name: 'Variety Tech', tag: 'entertainment', type: 'rss', url: 'https://variety.com/v/tech/feed/', weight: 0.6 },
  { name: 'The Verge AI', tag: 'entertainment', type: 'rss', url: 'https://www.theverge.com/rss/index.xml', weight: 0.5 },
  // Community & amateur vibe coding sources (HN, Medium tags, Reddit search RSS)
  { name: 'HN: vibe coding', tag: 'community', type: 'rss', url: 'https://hnrss.org/newest?q=vibe%20coding', weight: 0.7 },
  { name: 'HN: Cursor', tag: 'cursor', type: 'rss', url: 'https://hnrss.org/newest?q=cursor%20ide', weight: 0.7 },
  { name: 'HN: Copilot', tag: 'copilot', type: 'rss', url: 'https://hnrss.org/newest?q=github%20copilot', weight: 0.7 },
  { name: 'HN: Replit', tag: 'replit', type: 'rss', url: 'https://hnrss.org/newest?q=replit', weight: 0.7 },
  { name: 'HN: Xcode AI', tag: 'xcode', type: 'rss', url: 'https://hnrss.org/newest?q=xcode%20ai', weight: 0.6 },
  { name: 'HN: Privacy AI', tag: 'privacy', type: 'rss', url: 'https://hnrss.org/newest?q=ai%20privacy', weight: 0.6 },

  { name: 'Medium Tag: AI coding', tag: 'vibecoding', type: 'rss', url: 'https://medium.com/feed/tag/ai-coding', weight: 0.6 },
  { name: 'Medium Tag: GitHub Copilot', tag: 'copilot', type: 'rss', url: 'https://medium.com/feed/tag/github-copilot', weight: 0.6 },
  { name: 'Medium Tag: Cursor', tag: 'cursor', type: 'rss', url: 'https://medium.com/feed/tag/cursor', weight: 0.6 },
  { name: 'Medium Tag: Replit', tag: 'replit', type: 'rss', url: 'https://medium.com/feed/tag/replit', weight: 0.6 },
  { name: 'Medium Tag: Xcode', tag: 'xcode', type: 'rss', url: 'https://medium.com/feed/tag/xcode', weight: 0.5 },
  { name: 'Medium Tag: Privacy', tag: 'privacy', type: 'rss', url: 'https://medium.com/feed/tag/privacy', weight: 0.5 },

  // Reddit search RSS
  { name: 'Reddit search: Cursor IDE', tag: 'cursor', type: 'rss', url: 'https://www.reddit.com/search.rss?q=cursor%20ide&sort=new', weight: 0.45 },
  { name: 'Reddit search: GitHub Copilot', tag: 'copilot', type: 'rss', url: 'https://www.reddit.com/search.rss?q=github%20copilot&sort=new', weight: 0.45 },
  { name: 'Reddit search: Replit', tag: 'replit', type: 'rss', url: 'https://www.reddit.com/search.rss?q=replit&sort=new', weight: 0.45 },
];


