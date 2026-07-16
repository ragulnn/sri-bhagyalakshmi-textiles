'use client'

import { motion } from 'framer-motion'
import { GitHubIcon, LinkedInIcon } from '@/components/Icons'
import { Code2, Server, GitBranch, Activity } from 'lucide-react'

const CARD = "bg-[#111113] border border-[#27272A] rounded-2xl hover:border-[#0078D4]/40 hover:bg-[#18181B] transition-all duration-300"
const CHIP = "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-[#18181B] border border-[#27272A] text-[#A1A1AA] hover:border-[#0078D4]/50 hover:text-[#FAFAFA] transition-all duration-200"

const specializations = [
    { label: 'Azure', icon: <Server size={15} /> },
    { label: 'Kubernetes', icon: <Activity size={15} /> },
    { label: 'Terraform', icon: <Code2 size={15} /> },
    { label: 'Docker', icon: <Server size={15} /> },
    { label: 'DevOps', icon: <GitBranch size={15} /> },
    { label: 'Platform Engineering', icon: <Server size={15} /> },
    { label: 'GitHub Actions', icon: <GitBranch size={15} /> },
    { label: 'Prometheus', icon: <Activity size={15} /> },
    { label: 'Grafana', icon: <Activity size={15} /> },
    { label: 'Helm', icon: <Code2 size={15} /> },
]

const contactItems = [
    { label: 'Email', value: 'ragulm175@gmail.com', href: 'mailto:ragulm175@gmail.com' },
    { label: 'Phone', value: '+91 8072428283', href: 'tel:+918072428283' },
    { label: 'GitHub', value: 'github.com/ragulnn', href: 'https://github.com/ragulnn' },
    { label: 'LinkedIn', value: 'linkedin.com/in/ragul-m-77b731297', href: 'https://linkedin.com/in/ragul-m-77b731297' },
]

export default function AboutPage() {
    return (
        <div className="min-h-screen pt-32 pb-28">
            <div className="max-w-5xl mx-auto px-8">

                {/* Header */}
                <div className="mb-20">
                    <span className="section-tag">About</span>
                    <h1 className="text-5xl sm:text-6xl font-black mb-6 leading-tight">About Me</h1>
                    <p className="text-[#A1A1AA] text-xl max-w-2xl leading-relaxed">
                        DevOps and Cloud Engineer with hands-on experience in Microsoft Azure,
                        Kubernetes, CI/CD, Infrastructure as Code, and observability.
                    </p>
                </div>

                {/* Bio card — full width */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ duration: 0.5 }}
                    className={`${CARD} p-10 mb-16`}
                >
                    <div className="flex items-center gap-6 mb-8">
                        <div className="w-20 h-20 rounded-2xl bg-[#0078D4] flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                            RM
                        </div>
                        <div>
                            <h2 className="font-bold text-2xl text-[#FAFAFA]">Ragul M</h2>
                            <p className="text-[#0078D4] text-base font-medium mt-1">DevOps &amp; Cloud Engineer</p>
                            <p className="text-[#A1A1AA] text-sm mt-1">VIT-AP University · Amaravati, Andhra Pradesh</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-5 text-base leading-relaxed text-[#A1A1AA]">
                        <p>
                            I&apos;m an <span className="text-[#FAFAFA] font-medium">Integrated M.Tech</span> student at{' '}
                            <span className="text-[#0078D4] font-medium">VIT-AP University</span>, specializing in Computer Science and Engineering, graduating in 2026.
                        </p>
                        <p>
                            I built <span className="text-[#FAFAFA] font-medium">Kubepilot AI</span> — a multi-agent Kubernetes
                            troubleshooting platform that correlates Prometheus metrics, Loki logs, and Jaeger traces
                            for AI-assisted root cause analysis and automated remediation recommendations.
                        </p>
                        <p>
                            My passion is designing <span className="text-[#FAFAFA] font-medium">cloud-native systems</span> that
                            are reliable, observable, and fully automated — from infrastructure provisioning to
                            deployment pipelines and production monitoring.
                        </p>
                    </div>
                </motion.div>

                {/* Two columns: Specializations + Contact */}
                <div className="grid md:grid-cols-2 gap-10 mb-10">
                    {/* Specializations */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
                        className={`${CARD} p-8`}
                    >
                        <h3 className="font-bold text-lg text-[#FAFAFA] mb-6">I specialize in</h3>
                        <div className="flex flex-wrap gap-3">
                            {specializations.map((spec) => (
                                <motion.span key={spec.label} className={CHIP} whileHover={{ scale: 1.04 }}>
                                    {spec.icon}{spec.label}
                                </motion.span>
                            ))}
                        </div>
                    </motion.div>

                    {/* Contact */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.15 }}
                        className={`${CARD} p-8`}
                    >
                        <h3 className="font-bold text-lg text-[#FAFAFA] mb-6">Contact</h3>
                        <div className="flex flex-col gap-5">
                            {contactItems.map((item) => (
                                <div key={item.label} className="flex items-center justify-between gap-6">
                                    <span className="text-sm text-[#A1A1AA] w-16 flex-shrink-0">{item.label}</span>
                                    <a href={item.href}
                                        target={item.href.startsWith('http') ? '_blank' : undefined}
                                        rel="noopener noreferrer"
                                        className="text-sm text-[#FAFAFA] hover:text-[#0078D4] transition-colors truncate">
                                        {item.value}
                                    </a>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Find me online — full width */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}
                    className={`${CARD} p-8`}
                >
                    <h3 className="font-bold text-lg text-[#FAFAFA] mb-6">Find Me Online</h3>
                    <div className="flex flex-wrap gap-5">
                        <a href="https://github.com/ragulnn" target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-3 px-5 py-3 bg-[#18181B] border border-[#27272A] hover:border-[#FAFAFA]/30 text-[#A1A1AA] hover:text-[#FAFAFA] rounded-xl transition-all">
                            <GitHubIcon size={20} />
                            <span className="text-sm font-medium">github.com/ragulnn</span>
                        </a>
                        <a href="https://linkedin.com/in/ragul-m-77b731297" target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-3 px-5 py-3 bg-[#18181B] border border-[#27272A] hover:border-[#0078D4]/50 text-[#A1A1AA] hover:text-[#0078D4] rounded-xl transition-all">
                            <LinkedInIcon size={20} />
                            <span className="text-sm font-medium">linkedin.com/in/ragul-m-77b731297</span>
                        </a>
                    </div>
                </motion.div>

            </div>
        </div>
    )
}

