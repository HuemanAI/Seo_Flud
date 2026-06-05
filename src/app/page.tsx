'use client'
// src/app/page.tsx
// THE SEOFLUD PRODUCT — complete UI
// Prompt → Strategy → Pages → Preview → Download

import { useState, useRef, useEffect } from 'react'

type Step = 'home' | 'generating' | 'results'
type Tier = 'FREE' | 'STARTER' | 'GROWTH' | 'AGENCY'

const TIERS = {
  FREE:    { pages: 100,    price: 0,   label: 'Free' },
  STARTER: { pages: 1000,  price: 29,  label: 'Starter · £29/mo' },
  GROWTH:  { pages: 10000, price: 99,  label: 'Growth · £99/mo' },
  AGENCY:  { pages: 100000,price: 299, label: 'Agency · £299/mo' },
}

interface GenStep { id: string; label: string; status: 'idle'|'loading'|'done'|'error' }

export default function Home() {
  const [screen, setScreen] = useState<Step>('home')
  const [prompt, setPrompt] = useState('')
  const [tier, setTier] = useState<Tier>('FREE')
  const [email, setEmail] = useState('')
  const [steps, setSteps] = useState<GenStep[]>([
    { id: 'strategy', label: 'Analysing your business', status: 'idle' },
    { id: 'locations', label: 'Planning location hierarchy', status: 'idle' },
    { id: 'pages', label: 'Writing unique page content', status: 'idle' },
    { id: 'zip', label: 'Building your Next.js project', status: 'idle' },
    { id: 'complete', label: 'Finalising and packaging', status: 'idle' },
  ])
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [result, setResult] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('urls')
  const [previewIdx, setPreviewIdx] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')
  const [genMsg, setGenMsg] = useState('Preparing your strategy...')
  const taRef = useRef<HTMLTextAreaElement>(null)

  const updateStep = (id: string, status: GenStep['status']) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s))
  }

  async function generate() {
    if (!prompt.trim() || prompt.length < 15) {
      setError('Please describe your business in at least 15 characters')
      return
    }
    setError('')
    setScreen('generating')
    setProgress({ done: 0, total: 0 })
    setSteps(prev => prev.map(s => ({ ...s, status: 'idle' })))

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, tier, email })
      })

      if (!res.ok) throw new Error('Generation failed')

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split('\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6))

            if (data.step === 'strategy') {
              if (data.status === 'loading') { updateStep('strategy', 'loading'); setGenMsg(data.message) }
              if (data.status === 'done') { updateStep('strategy', 'done'); updateStep('locations', 'done') }
            }
            if (data.step === 'pages') {
              if (data.status === 'loading') { updateStep('pages', 'loading'); setGenMsg(data.message) }
              if (data.status === 'progress') setProgress({ done: data.done, total: data.total })
              if (data.status === 'done') updateStep('pages', 'done')
            }
            if (data.step === 'zip') {
              if (data.status === 'loading') { updateStep('zip', 'loading'); setGenMsg('Building your project...') }
              if (data.status === 'done') { updateStep('zip', 'done'); updateStep('complete', 'done') }
            }
            if (data.step === 'complete') {
              setResult(data.result)
              setScreen('results')
            }
            if (data.step === 'error') {
              throw new Error(data.message)
            }
          } catch (e) { /* skip malformed lines */ }
        }
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
      setScreen('home')
    }
  }

  function downloadZip() {
    if (!result?.zipBase64) return
    const blob = new Blob([Uint8Array.from(atob(result.zipBase64), c => c.charCodeAt(0))], { type: 'application/zip' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = result.filename || 'seoflud-project.zip'
    a.click()
  }

  const s = result?.strategy
  const pages = result?.pages || []
  const currentPage = pages[previewIdx]

  return (
    <div style={{ minHeight: '100vh', background: '#08090c', color: '#f2f0ff', fontFamily: "'Syne', -apple-system, sans-serif" }}>

      {/* ── NAV ── */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', borderBottom: '1px solid #1e2130', position: 'sticky', top: 0, background: 'rgba(8,9,12,0.9)', backdropFilter: 'blur(12px)', zIndex: 100 }}>
        <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.03em' }}>
          Pages<span style={{ color: '#e8ff47' }}>well</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {screen === 'results' && (
            <button onClick={() => { setScreen('home'); setResult(null) }}
              style={{ background: 'transparent', border: '1px solid #2a2d3e', borderRadius: 8, padding: '8px 16px', color: '#8a8da8', cursor: 'pointer', fontSize: 13 }}>
              + New strategy
            </button>
          )}
          <div style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'rgba(232,255,71,0.1)', color: '#e8ff47', border: '1px solid rgba(232,255,71,0.2)', fontWeight: 700, letterSpacing: '0.05em' }}>BETA</div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════
          SCREEN: HOME
      ══════════════════════════════════════════ */}
      {screen === 'home' && (
        <div style={{ minHeight: 'calc(100vh - 65px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>

          <div style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#e8ff47', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 32, height: 1, background: '#e8ff47', opacity: 0.4, display: 'inline-block' }} />
            AI Programmatic SEO Generator
            <span style={{ width: 32, height: 1, background: '#e8ff47', opacity: 0.4, display: 'inline-block' }} />
          </div>

          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(2.8rem,7vw,5.5rem)', lineHeight: 1.05, textAlign: 'center', letterSpacing: '-0.02em', marginBottom: 20, maxWidth: 800 }}>
            One prompt.<br />
            <em style={{ fontStyle: 'italic', color: '#7c6dfa' }}>100,000 ranked pages.</em>
          </h1>

          <p style={{ fontSize: 18, color: '#8a8da8', textAlign: 'center', maxWidth: 540, lineHeight: 1.65, marginBottom: 16 }}>
            Describe your business. Get a complete, deploy-ready website that ranks on Google for every city, town, and area in the country.
          </p>

          {/* Tier selector */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
            {(Object.keys(TIERS) as Tier[]).map(t => (
              <button key={t} onClick={() => setTier(t)}
                style={{
                  fontSize: 12, padding: '6px 14px', borderRadius: 20,
                  border: `1px solid ${tier === t ? '#7c6dfa' : '#2a2d3e'}`,
                  background: tier === t ? 'rgba(124,109,250,0.15)' : 'transparent',
                  color: tier === t ? '#a99cff' : '#5a5d72',
                  cursor: 'pointer', fontFamily: 'inherit'
                }}>
                {TIERS[t].label} · {TIERS[t].pages.toLocaleString()} pages
              </button>
            ))}
          </div>

          {/* Prompt box */}
          <div style={{ width: '100%', maxWidth: 720, background: '#0f1117', border: `1px solid ${error ? '#ff4d6d' : '#2a2d3e'}`, borderRadius: 20, padding: '6px 6px 6px 24px', display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 12 }}>
            <textarea ref={taRef}
              value={prompt}
              onChange={e => { setPrompt(e.target.value); setError('') }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generate() } }}
              placeholder="e.g. HuemanAI is an AI voice agent platform helping UK businesses with sales calls, customer support, 24/7 answering, and inbound call handling..."
              rows={2}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#f2f0ff', fontFamily: 'inherit', fontSize: 16, lineHeight: 1.6, resize: 'none', padding: '14px 0', minHeight: 56, maxHeight: 200 }}
            />
            <button onClick={generate}
              style={{ width: 52, height: 52, borderRadius: 14, background: '#e8ff47', border: 'none', cursor: 'pointer', fontSize: 20, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ▶
            </button>
          </div>

          {error && <p style={{ color: '#ff4d6d', fontSize: 13, marginBottom: 12 }}>{error}</p>}

          {/* Email field */}
          <div style={{ width: '100%', maxWidth: 720, marginBottom: 24 }}>
            <input value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Your email (to receive your project download)"
              style={{ width: '100%', background: '#0f1117', border: '1px solid #2a2d3e', borderRadius: 12, padding: '12px 16px', color: '#f2f0ff', fontFamily: 'inherit', fontSize: 14, outline: 'none' }} />
          </div>

          {/* Example chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 720, marginBottom: 40 }}>
            {[
              'HuemanAI — AI voice agents for UK businesses for sales, support and 24/7 answering',
              'Plumbing services targeting every London borough and surrounding areas',
              'Personal injury law firm targeting all UK cities and towns',
              'Dental clinic franchise across all Australian suburbs',
            ].map(ex => (
              <button key={ex} onClick={() => setPrompt(ex)}
                style={{ fontSize: 12, padding: '7px 14px', borderRadius: 20, border: '1px solid #2a2d3e', color: '#8a8da8', cursor: 'pointer', background: 'transparent', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                {ex.length > 50 ? ex.slice(0, 50) + '...' : ex}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['100K pages from one prompt', 'Unique AI content per location', 'FAQ rich snippets', 'Deploy-ready Next.js', 'Full sitemap + schema'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#5a5d72' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e5a0' }} />
                {f}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          SCREEN: GENERATING
      ══════════════════════════════════════════ */}
      {screen === 'generating' && (
        <div style={{ minHeight: 'calc(100vh - 65px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 38, marginBottom: 10 }}>Building your strategy...</h2>
          <p style={{ color: '#8a8da8', fontSize: 16, marginBottom: 48 }}>{genMsg}</p>

          {progress.total > 0 && (
            <div style={{ width: '100%', maxWidth: 400, marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#5a5d72', marginBottom: 8 }}>
                <span>Generating pages</span>
                <span>{progress.done} / {progress.total}</span>
              </div>
              <div style={{ background: '#1e2130', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                <div style={{ background: '#7c6dfa', height: '100%', width: `${(progress.done / progress.total) * 100}%`, transition: 'width 0.3s', borderRadius: 4 }} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 440, textAlign: 'left' }}>
            {steps.map(step => (
              <div key={step.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '13px 18px', borderRadius: 12,
                background: '#0f1117',
                border: `1px solid ${step.status === 'done' ? '#00e5a0' : step.status === 'loading' ? '#7c6dfa' : '#1e2130'}`,
                fontSize: 14,
                color: step.status === 'idle' ? '#5a5d72' : '#f2f0ff',
                transition: 'all 0.3s'
              }}>
                <div style={{ width: 20, height: 20, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {step.status === 'done' && <span style={{ color: '#00e5a0', fontSize: 16 }}>✓</span>}
                  {step.status === 'loading' && (
                    <div style={{ width: 16, height: 16, border: '2px solid #2a2d3e', borderTopColor: '#7c6dfa', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  )}
                  {step.status === 'idle' && <span style={{ color: '#2a2d3e', fontSize: 14 }}>○</span>}
                </div>
                {step.label}
              </div>
            ))}
          </div>

          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {/* ══════════════════════════════════════════
          SCREEN: RESULTS
      ══════════════════════════════════════════ */}
      {screen === 'results' && s && (
        <div style={{ padding: '40px 24px 100px', maxWidth: 1060, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 36, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 32, marginBottom: 6 }}>{s.businessName} — SEO Strategy</h2>
              <p style={{ color: '#8a8da8', fontSize: 14 }}>{s.primaryKeyword} · {s.targetCountry} · {s.estimatedPages?.toLocaleString()} pages</p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => setShowModal(true)}
                style={{ fontSize: 13, padding: '10px 20px', borderRadius: 10, border: '1px solid #2a2d3e', background: 'transparent', color: '#f2f0ff', cursor: 'pointer' }}>
                📦 Download project
              </button>
              <button onClick={downloadZip}
                style={{ fontSize: 13, padding: '10px 20px', borderRadius: 10, background: '#e8ff47', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                ⬇ Download zip
              </button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 12, marginBottom: 32 }}>
            {[
              { label: 'Total pages', val: s.estimatedPages?.toLocaleString() || '95,000' },
              { label: 'Monthly searches', val: s.searchVolume?.toLocaleString() || '180,000' },
              { label: 'Time to rank', val: s.timeToRank || '8-12 wks' },
              { label: 'Competition', val: s.competitionLevel || 'Medium' },
            ].map(stat => (
              <div key={stat.label} style={{ background: '#0f1117', borderRadius: 12, padding: '18px 20px', border: '1px solid #1e2130' }}>
                <div style={{ fontSize: 11, color: '#5a5d72', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{stat.label}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#e8ff47' }}>{stat.val}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#0f1117', borderRadius: 12, padding: 4, width: 'fit-content' }}>
            {['urls', 'preview', 'deploy'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ fontFamily: 'inherit', fontSize: 13, fontWeight: 500, padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', background: activeTab === tab ? '#161820' : 'transparent', color: activeTab === tab ? '#f2f0ff' : '#5a5d72', textTransform: 'capitalize' }}>
                {tab}
              </button>
            ))}
          </div>

          {/* Tab: URLs */}
          {activeTab === 'urls' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(s.urlExamples || []).map((u: any) => (
                <div key={u.path} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 10, background: '#0f1117', border: '1px solid #1e2130', fontFamily: 'monospace', fontSize: 13 }}>
                  <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: u.type === 'hub' ? 'rgba(232,255,71,0.1)' : u.type === 'city-hub' ? 'rgba(124,109,250,0.1)' : 'rgba(0,229,160,0.1)', color: u.type === 'hub' ? '#e8ff47' : u.type === 'city-hub' ? '#a99cff' : '#00e5a0', fontWeight: 700, flexShrink: 0 }}>
                    {u.type.toUpperCase()}
                  </span>
                  <span style={{ color: '#5a5d72', flex: 1 }}>yourdomain.com<span style={{ color: '#a99cff' }}>{u.path}</span></span>
                  <span style={{ fontSize: 11, color: '#3a3d52' }}>{u.description}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tab: Preview */}
          {activeTab === 'preview' && (
            <div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                {pages.map((p: any, i: number) => (
                  <button key={p.slug} onClick={() => setPreviewIdx(i)}
                    style={{ fontSize: 12, padding: '6px 14px', borderRadius: 20, border: `1px solid ${i === previewIdx ? '#7c6dfa' : '#2a2d3e'}`, background: i === previewIdx ? 'rgba(124,109,250,0.15)' : 'transparent', color: i === previewIdx ? '#a99cff' : '#5a5d72', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {p.city}
                  </button>
                ))}
              </div>
              {currentPage && (
                <div style={{ border: '1px solid #2a2d3e', borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ background: '#161820', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #1e2130' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {['#ff5f57','#febc2e','#28c840'].map(c => <span key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
                    </div>
                    <div style={{ flex: 1, background: '#1e2130', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontFamily: 'monospace', color: '#5a5d72' }}>
                      yourdomain.com{s.urlBase}{currentPage.slug}/
                    </div>
                  </div>
                  <div style={{ background: '#fff', minHeight: 480 }} dangerouslySetInnerHTML={{ __html: buildPreviewHTML(currentPage, s) }} />
                </div>
              )}
            </div>
          )}

          {/* Tab: Deploy */}
          {activeTab === 'deploy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { n: '1', title: 'Download and install', cmd: 'npm install', note: 'Unzip your download, then run this in the folder. Requires Node.js 18+.' },
                { n: '2', title: 'Add your domain', cmd: 'echo "NEXT_PUBLIC_BASE_URL=https://yourdomain.com" > .env.local', note: 'Replace with your actual domain.' },
                { n: '3', title: 'Build all pages', cmd: 'npm run build', note: 'Generates all HTML files in the /out folder. Takes 2-5 minutes.' },
                { n: '4', title: 'Deploy to Vercel (free)', cmd: 'npx vercel --prod', note: 'Or drag the /out folder to vercel.com. Free tier handles any scale.' },
                { n: '5', title: 'Submit to Google', cmd: '# Go to search.google.com/search-console\n# Submit: https://yourdomain.com/sitemap.xml', note: 'Pages start appearing in Google within 24-48 hours. Rankings in 8-12 weeks.' },
              ].map(step => (
                <div key={step.n} style={{ display: 'flex', gap: 16, padding: '18px 20px', background: '#0f1117', border: '1px solid #1e2130', borderRadius: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e8ff47', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0, marginTop: 2 }}>{step.n}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{step.title}</div>
                    <pre style={{ background: '#08090c', border: '1px solid #1e2130', borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, color: '#8a8da8', overflow: 'auto', marginBottom: 8, whiteSpace: 'pre-wrap' }}>{step.cmd}</pre>
                    <p style={{ fontSize: 13, color: '#5a5d72', lineHeight: 1.55 }}>{step.note}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── BOTTOM REFINE BAR ── */}
      {screen === 'results' && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(8,9,12,0.95)', backdropFilter: 'blur(16px)', borderTop: '1px solid #1e2130', padding: '14px 24px', display: 'flex', gap: 12, alignItems: 'center', zIndex: 99 }}>
          <input
            placeholder="Refine: change industry focus, add more cities, adjust tone..."
            style={{ flex: 1, maxWidth: 600, background: '#0f1117', border: '1px solid #2a2d3e', borderRadius: 10, padding: '11px 16px', color: '#f2f0ff', fontFamily: 'inherit', fontSize: 14, outline: 'none' }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                setPrompt((e.target as HTMLInputElement).value);
                generate();
                (e.target as HTMLInputElement).value = '';
              }
            }}
          />
          <button onClick={generate}
            style={{ fontSize: 13, padding: '11px 20px', borderRadius: 10, background: '#7c6dfa', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
            Regenerate ↗
          </button>
        </div>
      )}

      {/* ── DOWNLOAD MODAL ── */}
      {showModal && (
        <div onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#0f1117', border: '1px solid #2a2d3e', borderRadius: 20, padding: 36, maxWidth: 480, width: '100%', margin: 20, position: 'relative' }}>
            <button onClick={() => setShowModal(false)}
              style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', color: '#5a5d72', fontSize: 20, cursor: 'pointer' }}>✕</button>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 26, marginBottom: 8 }}>Your project is ready</h2>
            <p style={{ color: '#8a8da8', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Complete Next.js project with {pages.length} location pages. Deploy to Vercel in one click.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {['src/app/[slug]/page.tsx — page template', 'src/data/locations.json — location database', 'src/data/content.json — all page content', 'src/app/sitemap.ts — auto sitemap', 'next.config.js + tsconfig', 'README.md — deploy guide'].map(f => (
                <div key={f} style={{ display: 'flex', gap: 10, padding: '9px 12px', background: '#161820', borderRadius: 8, fontSize: 12, fontFamily: 'monospace', color: '#8a8da8' }}>
                  📄 {f}
                </div>
              ))}
            </div>
            <button onClick={() => { downloadZip(); setShowModal(false) }}
              style={{ width: '100%', padding: 14, background: '#e8ff47', color: '#000', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              ⬇ Download {result?.filename || 'project.zip'}
            </button>
            <p style={{ textAlign: 'center', fontSize: 12, color: '#3a3d52', marginTop: 12 }}>Includes README with full deploy instructions</p>
          </div>
        </div>
      )}
    </div>
  )
}

function buildPreviewHTML(page: any, strategy: any): string {
  const accent = '#4f46e5'
  return `<div style="font-family:-apple-system,sans-serif;margin:0">
    <div style="background:linear-gradient(135deg,#0f0c29,#302b63);color:#fff;padding:48px 28px;text-align:center">
      <p style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;opacity:.6;margin-bottom:10px">${page.region}</p>
      <h1 style="font-size:clamp(1.5rem,4vw,2.4rem);font-weight:700;line-height:1.2;margin-bottom:12px">${page.h1}</h1>
      <p style="font-size:14px;opacity:.85;max-width:500px;margin:0 auto 24px;line-height:1.6">${page.heroSubheadline}</p>
      <a href="#" style="background:${accent};color:#fff;padding:11px 24px;border-radius:8px;font-weight:600;text-decoration:none;font-size:14px;display:inline-block">${page.cta}</a>
    </div>
    <div style="padding:28px 24px;background:#f9fafb">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;max-width:700px;margin:0 auto">
        ${(page.stats || []).map((s: any) => `<div style="background:#fff;border-radius:10px;padding:14px;border:1px solid #e5e7eb;text-align:center">
          <div style="font-size:10px;color:#9ca3af;margin-bottom:3px">${s.label}</div>
          <div style="font-size:20px;font-weight:700;color:#111">${s.value}</div>
          <div style="font-size:10px;color:#d1d5db;margin-top:2px">${s.context}</div>
        </div>`).join('')}
      </div>
    </div>
    <div style="padding:28px 24px;max-width:700px;margin:0 auto">
      <h2 style="font-size:18px;font-weight:700;margin-bottom:10px">Why ${page.city} businesses choose us</h2>
      <p style="font-size:13px;line-height:1.75;color:#374151">${page.introParagraph}</p>
    </div>
    <div style="padding:0 24px 28px;max-width:700px;margin:0 auto">
      <h2 style="font-size:18px;font-weight:700;margin-bottom:16px">FAQs — ${page.city}</h2>
      ${(page.faqs || []).slice(0, 3).map((f: any) => `<div style="padding:12px 0;border-bottom:1px solid #f3f4f6">
        <p style="font-size:13px;font-weight:600;color:#111;margin-bottom:5px">${f.question}</p>
        <p style="font-size:12px;color:#4b5563;line-height:1.6">${f.answer}</p>
      </div>`).join('')}
    </div>
    <div style="background:${accent};color:#fff;padding:40px 24px;text-align:center">
      <h2 style="font-size:20px;font-weight:700;margin-bottom:8px">Ready in ${page.city}?</h2>
      <a href="#" style="background:#fff;color:${accent};padding:11px 24px;border-radius:8px;font-weight:700;text-decoration:none;font-size:14px;display:inline-block;margin-top:12px">${page.cta}</a>
    </div>
  </div>`
}
