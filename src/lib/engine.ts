// src/lib/engine.ts
// THE CORE ENGINE — this is what makes SEOflud valuable
// Strategy → Locations → Unique Content → Deployable Project

import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── TYPES ────────────────────────────────────────────────────────────
export interface Strategy {
  businessName: string
  businessType: string
  primaryKeyword: string
  urlBase: string
  targetCountry: 'UK' | 'US' | 'AU' | 'CA' | 'Global'
  valueProposition: string
  topIndustries: string[]
  urlExamples: { path: string; type: string; description: string }[]
  sampleLocations: Location[]
  estimatedPages: number
  searchVolume: number
  competitionLevel: string
  timeToRank: string
}

export interface Location {
  slug: string
  city: string
  parent: string
  region: string
  country: string
  type: string
  population: number
  topIndustries: string[]
  avgSalary: number
  timeToHire?: number
  majorEmployers: string[]
}

export interface PageContent {
  slug: string
  city: string
  region: string
  metaTitle: string
  metaDescription: string
  h1: string
  heroSubheadline: string
  introParagraph: string
  localInsight: string
  stats: { label: string; value: string; context: string }[]
  faqs: { question: string; answer: string }[]
  cta: string
  testimonialQuote: string
  testimonialAuthor: string
  structuredData: object
}

// ── STEP 1: GENERATE STRATEGY ────────────────────────────────────────
export async function generateStrategy(prompt: string): Promise<Strategy> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001', // Fast + cheap for strategy
    max_tokens: 2000,
    system: `You are an expert programmatic SEO strategist. 
Analyse a business description and create a complete SEO strategy.
Return ONLY valid JSON. No markdown, no explanation.`,
    messages: [{
      role: 'user',
      content: `Analyse this business for programmatic SEO: "${prompt}"

Return this exact JSON structure:
{
  "businessName": "extract or infer from prompt",
  "businessType": "SaaS/Services/Retail/etc",
  "primaryKeyword": "main keyword phrase e.g. 'AI recruitment software'",
  "urlBase": "/service-slug/",
  "targetCountry": "UK or US or AU or CA or Global",
  "valueProposition": "one sentence what they do",
  "topIndustries": ["industry1", "industry2", "industry3"],
  "urlExamples": [
    {"path": "/service/", "type": "hub", "description": "Country hub"},
    {"path": "/service/london/", "type": "city-hub", "description": "City hub"},
    {"path": "/service/london-shoreditch/", "type": "location", "description": "Borough page"},
    {"path": "/service/manchester-city-centre/", "type": "location", "description": "City page"},
    {"path": "/service/birmingham/", "type": "city-hub", "description": "Midlands hub"},
    {"path": "/service/edinburgh-city-centre/", "type": "location", "description": "Scottish city"}
  ],
  "sampleLocations": [
    {
      "slug": "london-shoreditch",
      "city": "Shoreditch", "parent": "London", "region": "Greater London",
      "country": "England", "type": "borough",
      "population": 84000,
      "topIndustries": ["Tech", "Creative"],
      "avgSalary": 62000, "timeToHire": 28,
      "majorEmployers": ["Deliveroo", "Monzo"]
    },
    {
      "slug": "manchester-city-centre",
      "city": "Manchester", "parent": "Manchester", "region": "Greater Manchester",
      "country": "England", "type": "city",
      "population": 563000,
      "topIndustries": ["Tech", "Media"],
      "avgSalary": 42000, "timeToHire": 26,
      "majorEmployers": ["AutoTrader", "Bupa"]
    },
    {
      "slug": "birmingham-digbeth",
      "city": "Digbeth", "parent": "Birmingham", "region": "West Midlands",
      "country": "England", "type": "district",
      "population": 1140000,
      "topIndustries": ["Manufacturing", "Tech"],
      "avgSalary": 38000, "timeToHire": 23,
      "majorEmployers": ["JLR", "Deutsche Bank"]
    }
  ],
  "estimatedPages": 95000,
  "searchVolume": 180000,
  "competitionLevel": "Medium",
  "timeToRank": "8-12 weeks"
}`
    }]
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return JSON.parse(text.replace(/```json|```/g, '').trim())
}

// ── STEP 2: GENERATE PAGE CONTENT ────────────────────────────────────
export async function generatePageContent(
  location: Location,
  strategy: Strategy,
  originalPrompt: string
): Promise<PageContent> {
  const locationLabel = location.parent !== location.city
    ? `${location.city}, ${location.parent}`
    : location.city

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1200,
    system: `You write concise, factual, SEO-optimised B2B landing page content.
Sound like a knowledgeable local business advisor. Never use buzzwords or hype.
Return ONLY valid JSON. No markdown, no explanation.`,
    messages: [{
      role: 'user',
      content: `Write unique landing page content for: "${originalPrompt}"

Business: ${strategy.businessName}
Primary keyword: ${strategy.primaryKeyword}  
Location: ${locationLabel}, ${location.region}
Industries: ${location.topIndustries.join(', ')}
Population: ${location.population.toLocaleString()}
Avg salary: £${Math.round(location.avgSalary / 1000)}K
Major employers: ${location.majorEmployers.slice(0, 2).join(', ')}

Return JSON:
{
  "metaTitle": "under 60 chars, include keyword + city",
  "metaDescription": "under 155 chars, include keyword + city + CTA",
  "h1": "keyword for city businesses",
  "heroSubheadline": "2 sentences, specific to this city's market",
  "introParagraph": "3 sentences, specific local market context, NO generic fluff",
  "localInsight": "1-2 sentences about hiring/business challenges unique to this city",
  "stats": [
    {"label": "stat name", "value": "number", "context": "short context"},
    {"label": "stat name", "value": "number", "context": "short context"},
    {"label": "stat name", "value": "number", "context": "short context"},
    {"label": "stat name", "value": "number", "context": "short context"}
  ],
  "faqs": [
    {"question": "How does ${strategy.businessName} work for ${location.city} businesses?", "answer": "specific 2-sentence answer"},
    {"question": "Is ${strategy.businessName} available in ${location.region}?", "answer": "specific 2-sentence answer"},
    {"question": "How quickly can a ${location.city} business get started?", "answer": "specific 2-sentence answer"},
    {"question": "What does it cost for a ${location.city} business?", "answer": "specific 2-sentence answer"},
    {"question": "Which ${location.city} industries use ${strategy.businessName} most?", "answer": "specific 2-sentence answer"}
  ],
  "cta": "short CTA button text e.g. 'Start free in ${location.city}'",
  "testimonialQuote": "realistic 1-sentence quote from a ${location.city} customer",
  "testimonialAuthor": "${location.topIndustries[0]} business, ${location.region}"
}`
    }]
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const content = JSON.parse(text.replace(/```json|```/g, '').trim())

  // Build structured data (this is what gets FAQ rich snippets in Google)
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'FAQPage',
        mainEntity: content.faqs.map((faq: any) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer }
        }))
      },
      {
        '@type': 'Service',
        name: `${strategy.primaryKeyword} - ${location.city}`,
        description: content.metaDescription,
        areaServed: {
          '@type': 'City',
          name: location.city,
          containedInPlace: { '@type': 'AdministrativeArea', name: location.region }
        }
      }
    ]
  }

  return {
    slug: location.slug,
    city: location.city,
    region: location.region,
    structuredData,
    ...content
  }
}

// ── BATCH GENERATION (for large sets) ────────────────────────────────
export async function generateBatchPages(
  locations: Location[],
  strategy: Strategy,
  prompt: string,
  onProgress?: (done: number, total: number) => void
): Promise<PageContent[]> {
  const results: PageContent[] = []
  const BATCH_SIZE = 5 // parallel requests

  for (let i = 0; i < locations.length; i += BATCH_SIZE) {
    const batch = locations.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.all(
      batch.map(loc => generatePageContent(loc, strategy, prompt))
    )
    results.push(...batchResults)
    onProgress?.(Math.min(i + BATCH_SIZE, locations.length), locations.length)

    // Rate limit pause between batches
    if (i + BATCH_SIZE < locations.length) {
      await new Promise(r => setTimeout(r, 300))
    }
  }

  return results
}

// ── PAGE COUNT BY TIER ───────────────────────────────────────────────
export const TIER_LIMITS = {
  FREE: 100,
  STARTER: 1000,
  GROWTH: 10000,
  AGENCY: 100000
} as const

export const TIER_PRICES = {
  FREE: 0,
  STARTER: 29,
  GROWTH: 99,
  AGENCY: 299
} as const
