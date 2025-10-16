export type Source = { name: string; tag: string; type: 'rss'|'atom'|'github-releases'; url: string; weight: number };
import { app } from '../../config/app'

export const SOURCES: Source[] = app.sources as any


