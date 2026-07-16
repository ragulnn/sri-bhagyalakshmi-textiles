'use client'

import { motion } from 'framer-motion'
import { ExternalLink, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { GitHubIcon } from '@/components/Icons'

const CARD = "bg-[#111113] border border-[#27272A] rounded-xl hover:border-[#0078D4]/40 hover:bg-[#18181B] transition-all duration-300"
const CHIP = "inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-[#18181B] border border-[#27272A] text-[#A1A1AA]"

const techBadge = (label: string) => (
    <span key={label} className={CHIP}>{label}</span>
)

const agentFlow = ['Discovery Agent', 'Planner Agent', 'Prometheus', 'Loki', 'Jaeger', 'Aggregator', 'Analyzer', 'Remediation']

const otherProjects = [
    {
        title: 'Azure DevOps CI/CD',
        desc: 'Automated AKS deployments with Azure DevOps Pipelines. Build, test, deploy workflows for containerized workloads.',
        tags: ['Azure DevOps', 'AKS', 'Docker', 'YAML'],
        icon: '⚙️',
    },
    {
        title: 'Terraform Azure IaC',
        desc: 'Infrastructure as Code using Terraform with reusable modules and workspaces for Azure resource provisioning.',
        tags: ['Terraform', 'Azure', 'IaC', 'HCL'],
        icon: '🏗️',
    },
    {
        title: 'Monitoring Stack',
        desc: 'Full observability stack with Prometheus metrics collection, Grafana dashboards, and Azure Monitor integration.',
        tags: ['Prometheus', 'Grafana', 'Azure Monitor'],
        icon: '📊',
    },
    {
        title: 'Logging & Observability',
        desc: 'Centralized logging using ELK Stack, Loki log aggregation, and distributed tracing with Jaeger.',
        tags: ['ELK Stack', 'Loki', 'Jaeger', 'OpenTelemetry'],
        icon: '📋',
    },
]

export default function ProjectsPage() {
    return (
        <div className="min-h-screen pt-32 pb-28">
            <div className="max-w-6xl mx-auto px-6">
                <div className="mb-16">
                    <span className="section-tag">Projects</span>
                    <h1 className="text-4xl sm:text-5xl font-black mb-5">What I&apos;ve Built</h1>
                    <p className="text-[#A1A1AA] text-lg max-w-2xl">
                        Cloud-native systems, AI-powered tooling, and production-grade DevOps infrastructure.
                    </p>
                </div>

                {/* Featured Project */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ duration: 0.5 }}
                    className="relative bg-[#111113] border border-[#0078D4]/30 rounded-2xl p-8 sm:p-12 overflow-hidden mb-16"
                >
                    <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(0,120,212,0.05)' }} />
                    <div className="relative">
                        <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
                            <div>
                                <span className="section-tag">Featured Project</span>
                                <h2 className="text-3xl sm:text-4xl font-black text-[#FAFAFA]">Kubepilot AI</h2>
                                <p className="text-[#0078D4] font-semibold mt-2 text-lg">AI-powered Kubernetes Incident Investigation Platform</p>
                            </div>
                            <div className="flex gap-3 flex-wrap">
                                <a href="https://github.com/ragulnn/kubepilot-ai" target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-transparent border border-[#27272A] hover:border-[#0078D4] text-[#FAFAFA] rounded-lg text-sm font-semibold transition-all">
                                    <GitHubIcon size={16} /> GitHub
                                </a>
                                <a href="https://github.com/ragulnn/kubepilot-ai" target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0078D4] hover:bg-[#106EBE] text-white rounded-lg text-sm font-semibold transition-all">
                                    <ExternalLink size={16} /> Documentation
                                </a>
                            </div>
                        </div>

                        <hr className="border-0 h-px bg-gradient-to-r from-transparent via-[#27272A] to-transparent mb-12" />

                        <div className="grid md:grid-cols-2 gap-14">
                            <div>
                                <p className="text-[#A1A1AA] leading-relaxed text-sm mb-8">
                                    A multi-agent system for Kubernetes troubleshooting that correlates Prometheus metrics,
                                    Loki logs, and Jaeger traces to perform AI-assisted root cause analysis and remediation
                                    recommendations. Built with confidence-based evidence collection and an adaptive investigation workflow.
                                </p>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-[#A1A1AA] mb-5">Agent Pipeline</h3>
                                <div className="flex flex-col gap-1">
                                    {agentFlow.map((agent, i) => (
                                        <div key={agent}>
                                            <motion.div
                                                initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                                                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#09090B] border border-[#27272A]"
                                            >
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#0078D4] flex-shrink-0" />
                                                <span className="font-mono text-xs text-[#FAFAFA]">{agent}</span>
                                            </motion.div>
                                            {i < agentFlow.length - 1 && (
                                                <div className="flex justify-center my-0.5"><div className="w-px h-3 bg-[#27272A]" /></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-[#A1A1AA] mb-5">Key Features</h3>
                                <ul className="space-y-4 text-sm text-[#A1A1AA] mb-12">
                                    {[
                                        'Designed multi-agent system with Discovery, Planner, Prometheus, Loki, Jaeger, Aggregator, Analyzer, and Remediation agents',
                                        'Integrated Prometheus, Loki, Jaeger and Kubernetes connectors to collect metrics, logs, traces and cluster evidence',
                                        'Built adaptive investigation workflow with confidence-based evidence collection and AI-driven root cause analysis',
                                    ].map((f, i) => (
                                        <li key={i} className="flex gap-3">
                                            <span className="text-[#0078D4] mt-0.5 flex-shrink-0">•</span>
                                            <span className="leading-relaxed">{f}</span>
                                        </li>
                                    ))}
                                </ul>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-[#A1A1AA] mb-5">Tech Stack</h3>
                                <div className="flex flex-wrap gap-2">
                                    {['Python', 'Docker', 'Kubernetes', 'Prometheus', 'Jaeger', 'OpenTelemetry', 'Ollama', 'Kind', 'Loki'].map(techBadge)}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Other Projects Grid */}
                <h2 className="text-2xl font-bold mb-8">Other Projects</h2>
                <div className="grid sm:grid-cols-2 gap-6 mb-20">
                    {otherProjects.map((proj, i) => (
                        <motion.div key={proj.title}
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                            className={`${CARD} p-8 flex flex-col gap-4 group`}
                        >
                            <div className="text-4xl">{proj.icon}</div>
                            <h3 className="font-bold text-[#FAFAFA] text-lg group-hover:text-[#0078D4] transition-colors">{proj.title}</h3>
                            <p className="text-sm text-[#A1A1AA] leading-relaxed flex-1">{proj.desc}</p>
                            <div className="flex flex-wrap gap-2 pt-2">
                                {proj.tags.map((tag) => <span key={tag} className={CHIP}>{tag}</span>)}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* CTA */}
                <div className="text-center">
                    <p className="text-[#A1A1AA] mb-5">Want to see more or collaborate?</p>
                    <div className="flex justify-center gap-4 flex-wrap">
                        <a href="https://github.com/ragulnn" target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 border border-[#27272A] hover:border-[#0078D4] text-[#FAFAFA] rounded-lg font-semibold text-sm transition-all">
                            <GitHubIcon size={16} /> View GitHub
                        </a>
                        <Link href="/contact"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0078D4] hover:bg-[#106EBE] text-white rounded-lg font-semibold text-sm transition-all">
                            Let&apos;s Connect <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

