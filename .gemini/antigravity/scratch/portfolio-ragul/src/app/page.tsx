'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Download, ChevronDown } from 'lucide-react'
import dynamic from 'next/dynamic'
import KubeTerminal from '@/components/KubeTerminal'
import { GitHubIcon, LinkedInIcon } from '@/components/Icons'

const TypingAnimation = dynamic(() => import('@/components/TypingAnimation'), { ssr: false })

const skills = ['Azure', 'Kubernetes', 'Terraform', 'Docker', 'DevOps', 'Platform Engineering']

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
}

export default function HomePage() {
  return (
    <div className="relative min-h-screen grid-bg overflow-hidden">
      <div className="hero-glow animate-glow-pulse" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(0,120,212,0.05)' }} />

      <div className="relative max-w-6xl mx-auto px-6 pt-36 pb-24 min-h-screen flex items-center">
        <div className="grid lg:grid-cols-2 gap-20 w-full items-center">
          {/* Left */}
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-8">
            <motion.div variants={itemVariants}>
              <span className="section-tag">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0078D4] animate-pulse inline-block" />
                Open to Opportunities
              </span>
            </motion.div>

            <motion.div variants={itemVariants}>
              <p className="text-[#A1A1AA] text-lg mb-3">Hi, I&apos;m</p>
              <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-none">
                <span className="glow-text gradient-text">Ragul M</span>
              </h1>
              <p className="text-2xl font-semibold text-[#0078D4] mt-3">
                DevOps &amp; Cloud Engineer
              </p>
            </motion.div>

            <motion.p variants={itemVariants} className="text-[#A1A1AA] text-base leading-relaxed max-w-lg">
              Building reliable cloud infrastructure, AI-powered Kubernetes tooling,
              and production-ready DevOps pipelines.
            </motion.p>

            <motion.div variants={itemVariants} className="text-sm">
              <TypingAnimation />
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s} className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-[#18181B] border border-[#27272A] text-[#A1A1AA] hover:border-[#0078D4]/50 hover:text-[#FAFAFA] transition-all duration-200">
                  {s}
                </span>
              ))}
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4 mt-2">
              <Link href="/projects" className="inline-flex items-center gap-2 px-6 py-3 bg-[#0078D4] hover:bg-[#106EBE] text-white rounded-lg font-semibold text-sm transition-all duration-200 hover:shadow-[0_4px_20px_rgba(0,120,212,0.4)] hover:-translate-y-0.5">
                View Projects <ArrowRight size={16} />
              </Link>
              <a href="/resume" className="inline-flex items-center gap-2 px-6 py-3 bg-transparent hover:bg-[#18181B] text-[#FAFAFA] border border-[#27272A] hover:border-[#0078D4] rounded-lg font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5">
                <Download size={16} /> Download Resume
              </a>
            </motion.div>

            <motion.div variants={itemVariants} className="flex items-center gap-5">
              <a href="https://github.com/ragulnn" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors">
                <GitHubIcon size={18} />
                <span className="animated-underline">ragulnn</span>
              </a>
              <span className="w-px h-4 bg-[#27272A]" />
              <a href="https://linkedin.com/in/ragul-m-77b731297" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-[#0078D4] transition-colors">
                <LinkedInIcon size={18} />
                <span className="animated-underline">Ragul M</span>
              </a>
            </motion.div>
          </motion.div>

          {/* Right — Terminal */}
          <motion.div
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
            className="hidden lg:block"
          >
            <KubeTerminal />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-[#A1A1AA]"
        >
          <span className="text-xs">Scroll</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <ChevronDown size={16} />
          </motion.div>
        </motion.div>
      </div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1 }}
        className="relative border-t border-[#27272A] bg-[#111113]/60 backdrop-blur-xl"
      >
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 'AZ-900', label: 'Certified' },
              { value: '6+', label: 'Projects Built' },
              { value: 'M.Tech', label: 'Integrated Degree' },
              { value: '2026', label: 'Graduating' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold text-[#FAFAFA]">{stat.value}</p>
                <p className="text-xs text-[#A1A1AA] mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
