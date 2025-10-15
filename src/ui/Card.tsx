import Image from 'next/image'

export function Card({
  title, dek, tag, href, imageUrl,
}: { title: string; dek: string; tag: string; href: string; imageUrl?: string | null }) {
  return (
    <a href={href} style={{
      background: '#111827', borderRadius: 12, overflow: 'hidden', textDecoration: 'none', color: '#E5E7EB',
      boxShadow: '0 0 0 1px rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column'
    }}>
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="" src={imageUrl} style={{ width: '100%', height: 140, objectFit: 'cover', opacity: 0.95 }} />
      )}
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 12, color: '#A78BFA', marginBottom: 6 }}>{tag.toUpperCase()}</div>
        <div style={{ fontWeight: 700, lineHeight: 1.3 }}>{title}</div>
        <div style={{ color: '#9CA3AF', marginTop: 8, fontSize: 14 }}>{dek}</div>
      </div>
    </a>
  )
}


