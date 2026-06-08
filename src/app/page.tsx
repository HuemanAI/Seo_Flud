'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import './homepage.css'

export default function HomePage() {
  const router = useRouter()
  const [prompt, setPromptValue] = useState('')
  const cursorRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const mxRef = useRef(0)
  const myRef = useRef(0)
  const rxRef = useRef(0)
  const ryRef = useRef(0)

  // ── Custom cursor ──
  useEffect(() => {
    const cursor = cursorRef.current
    const ring = ringRef.current
    if (!cursor || !ring) return

    const onMouseMove = (e: MouseEvent) => {
      mxRef.current = e.clientX
      myRef.current = e.clientY
      cursor.style.left = e.clientX + 'px'
      cursor.style.top = e.clientY + 'px'
    }
    document.addEventListener('mousemove', onMouseMove)

    let animId: number
    const animateRing = () => {
      rxRef.current += (mxRef.current - rxRef.current) * 0.12
      ryRef.current += (myRef.current - ryRef.current) * 0.12
      ring.style.left = rxRef.current + 'px'
      ring.style.top = ryRef.current + 'px'
      animId = requestAnimationFrame(animateRing)
    }
    animId = requestAnimationFrame(animateRing)

    const hoverEls = document.querySelectorAll('a, button, textarea, input')
    hoverEls.forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('hover'))
      el.addEventListener('mouseleave', () => cursor.classList.remove('hover'))
    })

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      cancelAnimationFrame(animId)
    }
  }, [])

  // ── Scroll reveal ──
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement
          el.style.opacity = '1'
          el.style.transform = 'translateY(0)'
        }
      })
    }, { threshold: 0.1 })

    document.querySelectorAll('.step-card, .proof-card, .price-col').forEach(el => {
      const h = el as HTMLElement
      h.style.opacity = '0'
      h.style.transform = 'translateY(20px)'
      h.style.transition = 'opacity 0.5s ease, transform 0.5s ease'
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  // ── Nav scroll effect ──
  useEffect(() => {
    const nav = document.querySelector('nav')
    const onScroll = () => {
      if (!nav) return
      nav.style.borderBottomColor = window.scrollY > 60 ? 'var(--ink)' : 'var(--rule)'
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleGenerate = useCallback(() => {
    if (!prompt.trim()) return
    router.push(`/generate?prompt=${encodeURIComponent(prompt.trim())}`)
  }, [prompt, router])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleGenerate()
    }
  }

  const setExample = (text: string) => {
    setPromptValue(text)
    document.getElementById('mainPrompt')?.focus()
  }

  return (
    <>
      <div className="cursor" ref={cursorRef} />
      <div className="cursor-ring" ref={ringRef} />

      {/* ── NAV ── */}
      <nav>
        <a href="#" className="nav-logo">SEOflud</a>
        <ul className="nav-links">
          <li><a href="#how">How it works</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#proof">Results</a></li>
        </ul>
        <a href="#try" className="nav-cta">Start free</a>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-bg-num">100K</div>

        <div className="hero-eyebrow">
          <div className="hero-eyebrow-line" />
          <span className="hero-eyebrow-text">Programmatic SEO Engine</span>
          <span className="hero-tag">Beta — Free to start</span>
        </div>

        <div className="hero-headline-wrap">
          <h1 className="hero-hed">
            One prompt.<br />
            <em>One hundred</em>
            <span className="acid-word"> thousand</span><br />
            <em>ranked pages.</em>
          </h1>
        </div>

        <div className="hero-desc-col">
          <p className="hero-desc">
            Describe your business. SEOflud builds a <strong>complete, deploy-ready website</strong>{' '}
            with a unique landing page for every city, town, and borough in the country —
            so Google finds you everywhere your customers are searching.
          </p>
          <div className="cta-row">
            <a href="#try" className="btn-primary">
              Generate your pages
              <span className="btn-arrow">→</span>
            </a>
            <button className="btn-secondary">Watch 2-minute demo</button>
          </div>
        </div>

        <div className="hero-stats-col">
          <div className="stat-item">
            <div className="stat-num">100<sup>K</sup></div>
            <div className="stat-label">pages generated<br />from one prompt</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">8<sup>wk</sup></div>
            <div className="stat-label">average time<br />to first ranking</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">£0</div>
            <div className="stat-label">to start —<br />100 pages free</div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="marquee-wrap">
        <div className="marquee-inner">
          {[
            'AI recruitment · London Shoreditch',
            'Voice agents · Manchester City Centre',
            'Plumbing services · Birmingham Digbeth',
            'Legal services · Edinburgh New Town',
            'Dental clinics · Leeds City Centre',
            'Accountancy SaaS · Bristol Clifton',
            'Estate agents · Glasgow Merchant City',
          ].concat([
            'AI recruitment · London Shoreditch',
            'Voice agents · Manchester City Centre',
            'Plumbing services · Birmingham Digbeth',
            'Legal services · Edinburgh New Town',
            'Dental clinics · Leeds City Centre',
            'Accountancy SaaS · Bristol Clifton',
            'Estate agents · Glasgow Merchant City',
          ]).map((item, i) => (
            <span key={i} className="marquee-item">
              <span className="marquee-dot">◆</span> {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section className="section-how" id="how">
        <div className="section-label-col">
          <div className="section-label-num">01</div>
          <div className="section-label">How it works</div>
        </div>
        <div className="steps-col">
          <div className="steps-grid">
            {[
              { n: 'Step 01', icon: '✍', title: 'Describe your business', desc: 'Type one sentence about what you do and where you want to rank. No spreadsheets. No templates. No technical knowledge needed.' },
              { n: 'Step 02', icon: '⚡', title: 'AI plans your strategy', desc: 'SEOflud analyses your market, plans your URL structure, and builds a location database for every city, town, and borough in your target country.' },
              { n: 'Step 03', icon: '✦', title: 'Unique content for every page', desc: 'Every location page gets genuinely unique content — local stats, industry context, FAQ rich snippets, and structured data. Not just city-name swapping.' },
              { n: 'Step 04', icon: '↗', title: 'Download and deploy', desc: 'Get a complete Next.js project. Deploy to Vercel in one click. Submit to Google. Pages start ranking within 8 weeks. Your competitors can\'t keep up.' },
            ].map((step) => (
              <div key={step.n} className="step-card">
                <div className="step-num">{step.n}</div>
                <span className="step-icon">{step.icon}</span>
                <div className="step-title">{step.title}</div>
                <div className="step-desc">{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRY IT ── */}
      <section className="section-prompt" id="try">
        <div className="prompt-left">
          <div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 20 }}>
              Try it now
            </div>
            <h2 className="prompt-title">Type.<br />Generate.<br />Rank.</h2>
            <p className="prompt-sub">Your first 100 pages are completely free. No credit card. No account needed. Just type and see what happens.</p>
          </div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: 'var(--muted)', lineHeight: 1.9, letterSpacing: '.03em' }}>
            → 100 pages free forever<br />
            → Full Next.js download<br />
            → Sitemap + schema included<br />
            → Deploy in one click
          </div>
        </div>
        <div className="prompt-right">
          <div className="prompt-label">Your business prompt</div>
          <div className="prompt-box">
            <textarea
              id="mainPrompt"
              value={prompt}
              onChange={e => setPromptValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. HuemanAI is an AI voice agent platform helping UK businesses with sales calls, 24/7 customer support, reservations, and inbound call handling..."
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: '↳ AI voice agents SaaS', prompt: 'HuemanAI — AI voice agents for UK businesses for sales and customer support' },
              { label: '↳ Plumbing services',    prompt: 'Emergency plumbing services for every London borough' },
              { label: '↳ Law firm',             prompt: 'Personal injury law firm targeting all UK cities and towns' },
              { label: '↳ Dental clinic',        prompt: 'Dental clinic franchise across all Australian suburbs and cities' },
            ].map(ex => (
              <button key={ex.label} className="example-btn" onClick={() => setExample(ex.prompt)}>
                {ex.label}
              </button>
            ))}
          </div>
          <div className="prompt-send">
            <span className="prompt-hint">Press Enter to generate · Shift+Enter for new line</span>
            <button className="send-btn" onClick={handleGenerate}>
              Generate pages →
            </button>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="section-pricing" id="pricing">
        <div className="pricing-header">
          <div className="pricing-title">Simple<br />pricing.</div>
          <p className="pricing-sub">Start free. Scale as your traffic grows. Cancel any time. Every plan includes the full Next.js project download, sitemap generation, and structured data markup.</p>
        </div>
        <div className="pricing-table">
          {[
            { tier: 'Free', price: '£0', period: 'forever', pages: '100 Pages / mo', features: ['Full Next.js download', 'Sitemap + schema', '3 sample pages preview', 'SEOflud watermark'], cta: 'Start free', href: '#try', featured: false },
            { tier: 'Starter', badge: 'Popular', price: '£29', period: 'per month', pages: '1,000 Pages / mo', features: ['Everything in Free', 'WordPress 1-click deploy', 'No watermark', '3 business projects', 'Email support'], cta: 'Get started', href: '#try', featured: true },
            { tier: 'Growth', price: '£99', period: 'per month', pages: '10,000 Pages / mo', features: ['Everything in Starter', 'Rank tracker dashboard', 'Webflow + Shopify deploy', '10 business projects', 'Custom templates'], cta: 'Start growing', href: '#try', featured: false },
            { tier: 'Agency', price: '£299', period: 'per month', pages: '100,000 Pages / mo', features: ['Everything in Growth', 'Full white-label', 'Unlimited projects', 'Client dashboard', 'API access'], cta: 'Talk to us', href: '#try', featured: false },
          ].map(plan => (
            <div key={plan.tier} className={`price-col${plan.featured ? ' featured' : ''}`}>
              <div className="price-tier">
                {plan.tier}
                {plan.badge && <span className="price-badge">{plan.badge}</span>}
              </div>
              <div className="price-amount">{plan.price}</div>
              <div className="price-period">{plan.period}</div>
              <div className="price-pages">{plan.pages}</div>
              <ul className="price-features">
                {plan.features.map(f => <li key={f} className="price-feature">{f}</li>)}
              </ul>
              <a href={plan.href} className="price-btn">{plan.cta}</a>
            </div>
          ))}
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="section-proof" id="proof">
        {[
          { initials: 'J', quote: 'We went from 400 to 68,000 monthly visitors in 11 weeks. SEOflud generated location pages for every borough in London overnight. Our agency competitors still haven\'t figured out what happened.', name: 'Johnson', role: 'Marketing Head · PrintMark' },
          { initials: 'JM', quote: 'I run a plumbing business. I don\'t know anything about SEO. I typed what I do and downloaded the zip. My developer deployed it. Now I rank on page one in 47 areas across Greater Manchester.', name: 'James M.', role: 'Director · Northern Plumbing Co.' },
          { initials: 'RK', quote: 'We use SEOflud for every SEO client. What used to take our team 3 months to build now takes 20 minutes. We\'re charging the same and doing 10x the volume. It\'s embarrassing how good this is.', name: 'Rachel K.', role: 'Founder · Bloom Digital Agency' },
        ].map(t => (
          <div key={t.initials} className="proof-card">
            <p className="proof-quote">{t.quote}</p>
            <div className="proof-author">
              <div className="proof-avatar">{t.initials}</div>
              <div>
                <span className="proof-name">{t.name}</span>
                <span className="proof-role">{t.role}</span>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ── FOOTER ── */}
      <footer>
        <div className="footer-col">
          <div className="footer-logo">SEOflud</div>
          <p className="footer-tagline">One prompt.<br />One hundred thousand<br />ranked pages.</p>
          <p className="footer-legal">© 2026 SEOflud Ltd.<br />All rights reserved.</p>
        </div>
        <div className="footer-col">
          <div className="footer-col-title">Product</div>
          <ul className="footer-links">
            {['How it works', 'Pricing', 'Case studies', 'Changelog', 'API docs'].map(l => <li key={l}><a href="#">{l}</a></li>)}
          </ul>
        </div>
        <div className="footer-col">
          <div className="footer-col-title">Company</div>
          <ul className="footer-links">
            {['About', 'Blog', 'Careers', 'Contact', 'Press kit'].map(l => <li key={l}><a href="#">{l}</a></li>)}
          </ul>
        </div>
        <div className="footer-col">
          <div className="footer-col-title">Legal</div>
          <ul className="footer-links">
            {['Privacy policy', 'Terms of service', 'Cookie policy', 'GDPR'].map(l => <li key={l}><a href="#">{l}</a></li>)}
          </ul>
        </div>
      </footer>

      <div className="scroll-hint">
        <span>Scroll to explore</span>
        <div className="scroll-line" />
      </div>
    </>
  )
}
