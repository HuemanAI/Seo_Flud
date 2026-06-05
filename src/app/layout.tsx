import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'SEOflud — AI Programmatic SEO Generator',
    template: '%s | SEOflud',
  },
  description: 'One prompt. 100,000 ranked pages. Describe your business and get a complete, deploy-ready website that ranks on Google for every city, town, and area.',
  keywords: ['programmatic SEO', 'AI SEO', 'location pages', 'SEO generator'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://seoflud.vercel.app'),
  openGraph: {
    title: 'SEOflud — AI Programmatic SEO Generator',
    description: 'One prompt. 100,000 ranked pages.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#08090c' }}>
        {children}
      </body>
    </html>
  )
}
