// src/lib/zip-builder.ts
// Generates a complete, deployable Next.js project as a zip file
// Customer downloads this and deploys to Vercel in one click

import JSZip from 'jszip'
import { Strategy, PageContent } from './engine'

export async function buildProjectZip(
  strategy: Strategy,
  pages: PageContent[],
  businessName: string
): Promise<Buffer> {
  const zip = new JSZip()
  const slug = strategy.urlBase.replace(/\//g, '')
  const safeName = businessName.toLowerCase().replace(/\s+/g, '-')

  // ── package.json ──────────────────────────────────────────────────
  zip.file('package.json', JSON.stringify({
    name: safeName + '-seo',
    version: '1.0.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start'
    },
    dependencies: {
      next: '14.2.0',
      react: '^18',
      'react-dom': '^18'
    },
    devDependencies: {
      '@types/node': '^20',
      '@types/react': '^18',
      typescript: '^5'
    }
  }, null, 2))

  // ── next.config.js ────────────────────────────────────────────────
  zip.file('next.config.js', `/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
}
module.exports = nextConfig
`)

  // ── tsconfig.json ─────────────────────────────────────────────────
  zip.file('tsconfig.json', JSON.stringify({
    compilerOptions: {
      target: 'es5', lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true, skipLibCheck: true, strict: true,
      noEmit: true, esModuleInterop: true, moduleResolution: 'bundler',
      resolveJsonModule: true, isolatedModules: true, jsx: 'preserve',
      incremental: true, plugins: [{ name: 'next' }],
      paths: { '@/*': ['./src/*'] }
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx'],
    exclude: ['node_modules']
  }, null, 2))

  // ── Location data ──────────────────────────────────────────────────
  zip.file('src/data/locations.json', JSON.stringify(
    strategy.sampleLocations, null, 2
  ))

  // ── Page content data ──────────────────────────────────────────────
  const contentMap: Record<string, PageContent> = {}
  pages.forEach(p => { contentMap[p.slug] = p })
  zip.file('src/data/content.json', JSON.stringify(contentMap, null, 2))

  // ── Strategy data ─────────────────────────────────────────────────
  zip.file('src/data/strategy.json', JSON.stringify(strategy, null, 2))

  // ── Root layout ───────────────────────────────────────────────────
  zip.file('src/app/layout.tsx', `import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com'),
  title: {
    default: '${businessName}',
    template: '%s | ${businessName}'
  },
  robots: { index: true, follow: true }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
`)

  // ── Sitemap ───────────────────────────────────────────────────────
  zip.file('src/app/sitemap.ts', `import { MetadataRoute } from 'next'
import locations from '@/data/locations.json'

const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, lastModified: new Date(), priority: 1.0 },
    { url: \`\${BASE}${strategy.urlBase}\`, lastModified: new Date(), priority: 0.9 },
    ...(locations as any[]).map(loc => ({
      url: \`\${BASE}${strategy.urlBase}\${loc.slug}/\`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7
    }))
  ]
}
`)

  // ── Location page template ────────────────────────────────────────
  zip.file(`src/app${strategy.urlBase}[slug]/page.tsx`, buildPageTemplate(strategy, slug))

  // ── Hub page ──────────────────────────────────────────────────────
  zip.file(`src/app${strategy.urlBase}page.tsx`, buildHubPage(strategy, pages))

  // ── .env.example ──────────────────────────────────────────────────
  zip.file('.env.example', `NEXT_PUBLIC_BASE_URL=https://yourdomain.com\n`)

  // ── vercel.json ───────────────────────────────────────────────────
  zip.file('vercel.json', JSON.stringify({
    buildCommand: 'npm run build',
    outputDirectory: 'out',
    framework: 'nextjs'
  }, null, 2))

  // ── README ────────────────────────────────────────────────────────
  zip.file('README.md', buildReadme(strategy, businessName, pages.length))

  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
  return buffer
}

function buildPageTemplate(strategy: Strategy, slug: string): string {
  return `import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import locations from '@/data/locations.json'
import content from '@/data/content.json'

const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com'

export async function generateStaticParams() {
  return (locations as any[]).map((loc: any) => ({ slug: loc.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const c = (content as any)[params.slug]
  if (!c) return { title: 'Not Found' }
  return {
    title: c.metaTitle,
    description: c.metaDescription,
    alternates: { canonical: \`\${BASE}${strategy.urlBase}\${params.slug}/\` }
  }
}

export default function LocationPage({ params }: { params: { slug: string } }) {
  const c = (content as any)[params.slug]
  const loc = (locations as any[]).find((l: any) => l.slug === params.slug)
  if (!c || !loc) notFound()

  return (
    <>
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(c.structuredData) }} />
      <main>
        {/* Hero */}
        <section style={{background:'linear-gradient(135deg,#0f0c29,#302b63)',color:'#fff',padding:'80px 24px',textAlign:'center'}}>
          <div style={{maxWidth:760,margin:'0 auto'}}>
            <p style={{fontSize:12,letterSpacing:'0.1em',textTransform:'uppercase',opacity:0.6,marginBottom:12}}>
              {loc.region} · ${strategy.primaryKeyword}
            </p>
            <h1 style={{fontSize:'clamp(2rem,5vw,3.2rem)',fontWeight:700,lineHeight:1.15,marginBottom:16}}>{c.h1}</h1>
            <p style={{fontSize:17,opacity:0.85,lineHeight:1.7,marginBottom:32,maxWidth:600,margin:'0 auto 32px'}}>{c.heroSubheadline}</p>
            <a href="/contact/" style={{background:'#6366f1',color:'#fff',padding:'14px 32px',borderRadius:8,fontWeight:600,textDecoration:'none',fontSize:16}}>
              {c.cta}
            </a>
          </div>
        </section>

        {/* Stats */}
        <section style={{padding:'60px 24px',background:'#f9fafb'}}>
          <div style={{maxWidth:900,margin:'0 auto'}}>
            <h2 style={{fontSize:26,fontWeight:700,textAlign:'center',marginBottom:32}}>
              {loc.city} market in numbers
            </h2>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:20}}>
              {c.stats.map((s: any, i: number) => (
                <div key={i} style={{background:'#fff',borderRadius:12,padding:'24px 20px',border:'1px solid #e5e7eb',textAlign:'center'}}>
                  <p style={{fontSize:12,color:'#6b7280',marginBottom:6}}>{s.label}</p>
                  <p style={{fontSize:30,fontWeight:700,color:'#111',marginBottom:6}}>{s.value}</p>
                  <p style={{fontSize:12,color:'#9ca3af'}}>{s.context}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Content */}
        <section style={{padding:'60px 24px'}}>
          <div style={{maxWidth:780,margin:'0 auto'}}>
            <h2 style={{fontSize:24,fontWeight:700,marginBottom:16}}>Why {loc.city} businesses choose us</h2>
            <p style={{fontSize:16,lineHeight:1.8,color:'#374151',marginBottom:20}}>{c.introParagraph}</p>
            <p style={{fontSize:16,lineHeight:1.8,color:'#374151'}}>{c.localInsight}</p>
          </div>
        </section>

        {/* Testimonial */}
        <section style={{padding:'48px 24px',background:'#f0f9ff'}}>
          <div style={{maxWidth:680,margin:'0 auto',textAlign:'center'}}>
            <blockquote style={{fontSize:20,fontStyle:'italic',lineHeight:1.65,color:'#1e3a5f',marginBottom:16}}>
              &ldquo;{c.testimonialQuote}&rdquo;
            </blockquote>
            <p style={{fontSize:14,color:'#6b7280'}}>— {c.testimonialAuthor}</p>
          </div>
        </section>

        {/* FAQs */}
        <section style={{padding:'60px 24px'}}>
          <div style={{maxWidth:780,margin:'0 auto'}}>
            <h2 style={{fontSize:24,fontWeight:700,marginBottom:28}}>FAQs — {loc.city}</h2>
            {c.faqs.map((faq: any, i: number) => (
              <div key={i} style={{borderBottom:'1px solid #e5e7eb',paddingBottom:20,marginBottom:20}}>
                <h3 style={{fontSize:16,fontWeight:600,marginBottom:8,color:'#111'}}>{faq.question}</h3>
                <p style={{fontSize:14,lineHeight:1.75,color:'#4b5563'}}>{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{padding:'72px 24px',background:'#4f46e5',color:'#fff',textAlign:'center'}}>
          <h2 style={{fontSize:28,fontWeight:700,marginBottom:12}}>Ready in {loc.city}?</h2>
          <p style={{opacity:0.9,marginBottom:28,fontSize:16}}>Join {loc.region} businesses already seeing results.</p>
          <a href="/contact/" style={{background:'#fff',color:'#4f46e5',padding:'14px 36px',borderRadius:8,fontWeight:700,textDecoration:'none',fontSize:16}}>
            {c.cta}
          </a>
        </section>
      </main>
    </>
  )
}
`
}

function buildHubPage(strategy: Strategy, pages: PageContent[]): string {
  return `import locations from '@/data/locations.json'

const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com'

export default function HubPage() {
  return (
    <main>
      <section style={{padding:'80px 24px',textAlign:'center',background:'#f9fafb'}}>
        <h1 style={{fontSize:'clamp(2rem,5vw,3rem)',fontWeight:700,marginBottom:16}}>
          ${strategy.primaryKeyword} — All Locations
        </h1>
        <p style={{fontSize:18,color:'#6b7280',maxWidth:600,margin:'0 auto'}}>
          Serving businesses across ${strategy.targetCountry === 'UK' ? 'the United Kingdom' : strategy.targetCountry}
        </p>
      </section>
      <section style={{padding:'60px 24px'}}>
        <div style={{maxWidth:900,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12}}>
          {(locations as any[]).map((loc: any) => (
            <a key={loc.slug} href={\`${strategy.urlBase}\${loc.slug}/\`}
              style={{padding:'14px 16px',background:'#fff',border:'1px solid #e5e7eb',borderRadius:8,textDecoration:'none',color:'#111',fontSize:14,fontWeight:500}}>
              {loc.city}
              <span style={{display:'block',fontSize:12,color:'#9ca3af',marginTop:2}}>{loc.region}</span>
            </a>
          ))}
        </div>
      </section>
    </main>
  )
}
`
}

function buildReadme(strategy: Strategy, businessName: string, pageCount: number): string {
  return `# ${businessName} — Programmatic SEO Site
Generated by SEOflud · ${new Date().toLocaleDateString()}

## What's in this project
- **${pageCount} location pages** targeting ${strategy.targetCountry}
- **URL structure:** ${strategy.urlBase}[city-slug]/
- **Primary keyword:** ${strategy.primaryKeyword}
- **Estimated monthly searches:** ${strategy.searchVolume?.toLocaleString()}

## Deploy in 3 steps

### 1. Install & build
\`\`\`bash
npm install
npm run build
\`\`\`

### 2. Deploy to Vercel (free)
\`\`\`bash
npx vercel --prod
\`\`\`
Or drag the /out folder to vercel.com

### 3. Submit sitemap to Google
Go to search.google.com/search-console
Submit: https://yourdomain.com/sitemap.xml

## To add more locations
Edit \`src/data/locations.json\` — add more location objects.
Then add matching entries to \`src/data/content.json\`.
Or use the SEOflud dashboard to regenerate with more locations.

## Expected results
- Pages start appearing in Google within 2-4 weeks
- Ranking for location keywords within 8-12 weeks
- Full traffic growth visible within 3-6 months

Built with SEOflud · seoflud.com
`
}
