export type Source = { name: string; tag: string; type: 'rss'|'atom'|'github-releases'; url: string; weight: number };

export const SOURCES: Source[] = [
  { name: 'Vercel Changelog', tag: 'v0', type: 'atom', url: 'https://vercel.com/changelog.atom', weight: 1.2 },
  { name: 'GitHub Changelog', tag: 'copilot', type: 'rss', url: 'https://github.blog/changelog/feed/', weight: 1.1 },
  { name: 'Replit Blog', tag: 'replit', type: 'rss', url: 'https://blog.replit.com/feed.xml', weight: 1.0 },
  { name: 'Next.js Blog', tag: 'nextjs', type: 'rss', url: 'https://nextjs.org/feed.xml', weight: 1.0 },
];


