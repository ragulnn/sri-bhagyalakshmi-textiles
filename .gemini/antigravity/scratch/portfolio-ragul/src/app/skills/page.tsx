'use client'

import { motion } from 'framer-motion'

const CARD = "bg-[#111113] border border-[#27272A] rounded-xl hover:border-[#0078D4]/40 transition-all duration-300"
const CHIP = "inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-[#18181B] border border-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA] hover:border-[#0078D4]/50 transition-all duration-200"

const skillGroups = [
    {
        title: 'Cloud & Infrastructure',
        color: '#0078D4',
        skills: ['Microsoft Azure', 'AKS (Azure Kubernetes Service)', 'Virtual Machines', 'Azure Container Registry', 'Azure Monitor', 'Azure Blob Storage'],
    },
    {
        title: 'DevOps & CI/CD',
        color: '#7c3aed',
        skills: ['Azure DevOps Pipelines', 'GitHub Actions', 'Jenkins', 'Docker', 'Docker Compose', 'Helm Charts'],
    },
    {
        title: 'Orchestration & IaC',
        color: '#059669',
        skills: ['Kubernetes', 'Terraform', 'Ansible', 'kubectl', 'YAML / HCL', 'Kind (local K8s)'],
    },
    {
        title: 'Observability',
        color: '#d97706',
        skills: ['Prometheus', 'Grafana', 'Loki', 'Jaeger', 'OpenTelemetry', 'ELK Stack'],
    },
    {
        title: 'Programming',
        color: '#db2777',
        skills: ['Python', 'Bash / Shell', 'TypeScript', 'Go (basics)', 'REST APIs', 'YAML'],
    },
    {
        title: 'AI & Platform',
        color: '#0891b2',
        skills: ['LLM Integration', 'Ollama', 'Multi-agent Systems', 'Platform Engineering', 'SRE Practices', 'GitOps'],
    },
]

export default function SkillsPage() {
    return (
        <div className="min-h-screen pt-32 pb-28">
            <div className="max-w-6xl mx-auto px-6">
                {/* Header */}
                <div className="mb-20">
                    <span className="section-tag">Skills</span>
                    <h1 className="text-4xl sm:text-5xl font-black mb-5">Technical Skills</h1>
                    <p className="text-[#A1A1AA] text-lg max-w-2xl leading-relaxed">
                        A toolkit built through hands-on projects, production deployments, and continuous learning.
                    </p>
                </div>

                {/* Skill grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10 mb-20">
                    {skillGroups.map((group, i) => (
                        <motion.div key={group.title}
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}
                            className={`${CARD} p-7`}
                        >
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: group.color, boxShadow: `0 0 10px ${group.color}60` }} />
                                <h3 className="font-bold text-[#FAFAFA] text-sm">{group.title}</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {group.skills.map((skill) => (
                                    <motion.span key={skill} className={CHIP}
                                        whileHover={{ scale: 1.05 }}>
                                        {skill}
                                    </motion.span>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Certification card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ duration: 0.5 }}
                    className="relative bg-[#111113] border border-[#27272A] rounded-2xl overflow-hidden"
                >
                    {/* Microsoft color bar */}
                    <div className="h-1.5 flex">
                        <div className="flex-1 bg-[#f25022]" />
                        <div className="flex-1 bg-[#7fba00]" />
                        <div className="flex-1 bg-[#ffb900]" />
                        <div className="flex-1 bg-[#00a4ef]" />
                    </div>
                    <div className="p-8 sm:p-12">
                        <div className="flex flex-wrap items-start justify-between gap-10">
                            <div>
                                <p className="text-xs text-[#A1A1AA] uppercase tracking-widest mb-2">Microsoft Certified</p>
                                <h2 className="text-3xl font-black text-[#FAFAFA] mb-1">Azure Fundamentals</h2>
                                <p className="text-[#0078D4] font-semibold text-lg">AZ-900</p>
                                <p className="text-[#A1A1AA] text-sm mt-4 max-w-md leading-relaxed">
                                    Demonstrates foundational knowledge of cloud services and how those services are provided with Microsoft Azure.
                                    Covers cloud concepts, core Azure services, security, privacy, compliance, and trust.
                                </p>
                                <div className="flex flex-wrap gap-2 mt-5">
                                    {['Cloud Concepts', 'Azure Services', 'Security', 'Compliance', 'Pricing'].map((t) => (
                                        <span key={t} className={CHIP}>{t}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-shrink-0">
                                <div className="w-24 h-24 rounded-2xl border border-[#27272A] flex items-center justify-center"
                                    style={{ background: 'linear-gradient(135deg, #0078D4 0%, #00a4ef 100%)' }}>
                                    <span className="text-4xl">☁️</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Education */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
                    className={`${CARD} p-8 mt-10`}
                >
                    <h3 className="font-semibold text-[#FAFAFA] mb-6">Education</h3>
                    <div className="flex items-start gap-5">
                        <div className="w-12 h-12 rounded-xl bg-[#0078D4]/10 border border-[#0078D4]/20 flex items-center justify-center flex-shrink-0 text-2xl">
                            🎓
                        </div>
                        <div>
                            <h4 className="font-bold text-[#FAFAFA]">Integrated M.Tech — Computer Science & Engineering</h4>
                            <p className="text-[#0078D4] text-sm font-medium mt-1">VIT-AP University, Amaravati, Andhra Pradesh</p>
                            <p className="text-[#A1A1AA] text-xs mt-2">Graduating 2026</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

