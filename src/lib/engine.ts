// src/lib/engine.ts
// THE CORE ENGINE — Strategy → Locations → Unique Content → Deployable Project
// Powered by Google Gemini (free tier: 1,500 requests/day)

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Shared helper — calls Gemini and always returns clean JSON
async function callGemini(systemPrompt: string, userPrompt: string, maxTokens = 2000): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash', // Fast, free tier, great for structured output
    systemInstruction: systemPrompt,
    generationConfig: {
      responseMimeType: 'application/json', // Forces valid JSON output — no markdown wrapping
      maxOutputTokens: maxTokens,
      temperature: 0.7,
    },
  })
  const result = await model.generateContent(userPrompt)
  return result.response.text()
}

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
  const text = await callGemini(
    `You are an expert programmatic SEO strategist.
Analyse a business description and create a complete SEO strategy.
Return ONLY valid JSON matching the exact structure requested. No explanation.`,
    `Analyse this business for programmatic SEO: "${prompt}"

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
}`,
    2000
  )

  return JSON.parse(text)
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

  const text = await callGemini(
    `You write concise, factual, SEO-optimised B2B landing page content.
Sound like a knowledgeable local business advisor. Never use buzzwords or hype.
Return ONLY valid JSON matching the exact structure requested.`,
    `Write unique landing page content for: "${originalPrompt}"

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
  "localInsight": "1-2 sentences about business challenges unique to this city",
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
}`,
    1200
  )

  const content = JSON.parse(text)

  // Build structured data (gets FAQ rich snippets in Google)
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
  const BATCH_SIZE = 5

  for (let i = 0; i < locations.length; i += BATCH_SIZE) {
    const batch = locations.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.all(
      batch.map(loc => generatePageContent(loc, strategy, prompt))
    )
    results.push(...batchResults)
    onProgress?.(Math.min(i + BATCH_SIZE, locations.length), locations.length)

    // Respect Gemini free tier rate limits (15 RPM)
    if (i + BATCH_SIZE < locations.length) {
      await new Promise(r => setTimeout(r, 400))
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
