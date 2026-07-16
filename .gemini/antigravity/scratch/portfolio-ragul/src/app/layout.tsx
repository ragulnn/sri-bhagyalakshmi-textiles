import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Ragul M — DevOps & Cloud Engineer',
  description: 'DevOps and Cloud Engineer with hands-on experience in Microsoft Azure, Kubernetes, CI/CD, Infrastructure as Code, and observability. Builder of Kubepilot AI.',
  keywords: ['DevOps', 'Cloud Engineer', 'Kubernetes', 'Azure', 'Terraform', 'Docker', 'Ragul M'],
  authors: [{ name: 'Ragul M' }],
  creator: 'Ragul M',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ragulm.dev',
    title: 'Ragul M — DevOps & Cloud Engineer',
    description: 'Building reliable cloud infrastructure, AI-powered Kubernetes tooling, and production-ready DevOps pipelines.',
    siteName: 'Ragul M Portfolio',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ragul M — DevOps & Cloud Engineer',
    description: 'Building reliable cloud infrastructure, AI-powered Kubernetes tooling, and production-ready DevOps pipelines.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bg text-[#FAFAFA] antialiased">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
