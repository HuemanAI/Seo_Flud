// src/app/api/generate/route.ts
// Main generation endpoint - streams progress back to client
// Called when user submits their business prompt

import { NextRequest, NextResponse } from 'next/server'
import { generateStrategy, generatePageContent, TIER_LIMITS } from '@/lib/engine'

export async function POST(req: NextRequest) {
  const { prompt, tier = 'FREE', email } = await req.json()

  if (!prompt || prompt.trim().length < 10) {
    return NextResponse.json({ error: 'Please describe your business in more detail' }, { status: 400 })
  }

  const pageLimit = TIER_LIMITS[tier as keyof typeof TIER_LIMITS] || 100

  // Use streaming so client sees real-time progress
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        // Step 1: Strategy
        send({ step: 'strategy', status: 'loading', message: 'Analysing your business...' })
        const strategy = await generateStrategy(prompt)
        send({ step: 'strategy', status: 'done', data: strategy })

        // Step 2: Generate pages (up to tier limit)
        const locations = strategy.sampleLocations.slice(0, Math.min(pageLimit, strategy.sampleLocations.length))
        send({ step: 'pages', status: 'loading', message: `Generating ${locations.length} location pages...`, total: locations.length })

        const pages = []
        for (let i = 0; i < locations.length; i++) {
          const page = await generatePageContent(locations[i], strategy, prompt)
          pages.push(page)
          send({ step: 'pages', status: 'progress', done: i + 1, total: locations.length })
        }

        send({ step: 'pages', status: 'done', count: pages.length })

        // Step 3: Build zip
        send({ step: 'zip', status: 'loading', message: 'Building your project...' })
        const { buildProjectZip } = await import('@/lib/zip-builder')
        const zipBuffer = await buildProjectZip(strategy, pages, strategy.businessName)
        const zipBase64 = zipBuffer.toString('base64')
        send({ step: 'zip', status: 'done' })

        // Final result
        send({
          step: 'complete',
          status: 'done',
          result: {
            strategy,
            pages,
            zipBase64,
            filename: `${strategy.businessName.toLowerCase().replace(/\s+/g, '-')}-seo.zip`
          }
        })

      } catch (error: any) {
        send({ step: 'error', status: 'error', message: error.message || 'Generation failed' })
      } finally {
        controller.close()
      }
    }
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}
