'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, Send, CheckCircle, ArrowRight } from 'lucide-react'
import { GitHubIcon, LinkedInIcon } from '@/components/Icons'

const CARD = "bg-[#111113] border border-[#27272A] rounded-xl hover:border-[#0078D4]/40 hover:bg-[#18181B] transition-all duration-300"
const INPUT = "w-full bg-[#09090B] border border-[#27272A] rounded-lg px-4 py-3 text-sm text-[#FAFAFA] placeholder-[#52525B] focus:outline-none focus:border-[#0078D4] transition-colors"

const contactMethods = [
    { icon: <Mail size={20} />, label: 'Email', value: 'ragulm175@gmail.com', href: 'mailto:ragulm175@gmail.com', color: '#0078D4' },
    { icon: <Phone size={20} />, label: 'Phone', value: '+91 8072428283', href: 'tel:+918072428283', color: '#4ade80' },
    { icon: <GitHubIcon size={20} />, label: 'GitHub', value: 'github.com/ragulnn', href: 'https://github.com/ragulnn', color: '#FAFAFA' },
    { icon: <LinkedInIcon size={20} />, label: 'LinkedIn', value: 'linkedin.com/in/ragul-m-77b731297', href: 'https://linkedin.com/in/ragul-m-77b731297', color: '#0A66C2' },
]

export default function ContactPage() {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
    const [submitted, setSubmitted] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        await new Promise((r) => setTimeout(r, 1200))
        setSubmitted(true)
        setLoading(false)
    }

    return (
        <div className="min-h-screen pt-32 pb-28">
            <div className="max-w-6xl mx-auto px-6">
                {/* Header */}
                <div className="mb-16">
                    <span className="section-tag">Contact</span>
                    <h1 className="text-4xl sm:text-5xl font-black mb-5">Let&apos;s Connect</h1>
                    <p className="text-[#A1A1AA] text-lg max-w-2xl leading-relaxed">
                        Open to opportunities, collaborations, and conversations about DevOps, cloud infrastructure, and platform engineering.
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-16">
                    {/* Contact methods */}
                    <div className="flex flex-col gap-8">
                        <h2 className="font-semibold text-lg text-[#FAFAFA] mb-2">Reach me directly</h2>
                        {contactMethods.map((method, i) => (
                            <motion.a key={method.label} href={method.href}
                                target={method.href.startsWith('http') ? '_blank' : undefined}
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                                whileHover={{ x: 4 }}
                                className={`${CARD} p-5 flex items-center gap-8`}
                            >
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: `${method.color}15`, color: method.color, border: `1px solid ${method.color}30` }}>
                                    {method.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-[#A1A1AA] font-medium mb-1">{method.label}</p>
                                    <p className="text-sm text-[#FAFAFA] font-medium truncate">{method.value}</p>
                                </div>
                                <ArrowRight size={16} className="text-[#A1A1AA] flex-shrink-0" />
                            </motion.a>
                        ))}

                        {/* Availability */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }} transition={{ delay: 0.3 }}
                            className={`${CARD} p-6 mt-2`}
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-sm font-semibold text-green-400">Available for opportunities</span>
                            </div>
                            <p className="text-xs text-[#A1A1AA] leading-relaxed">
                                Currently looking for DevOps, Cloud Engineering, and Platform Engineering roles. Graduating in 2026.
                            </p>
                        </motion.div>
                    </div>

                    {/* Contact form */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.15 }}
                        className="bg-[#111113] border border-[#27272A] rounded-2xl p-8"
                    >
                        {submitted ? (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center h-full gap-8 py-16">
                                <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                                    <CheckCircle size={32} className="text-green-400" />
                                </div>
                                <h3 className="text-xl font-bold">Message Sent!</h3>
                                <p className="text-sm text-[#A1A1AA] text-center">Thanks for reaching out. I&apos;ll get back to you soon!</p>
                                <button onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }) }}
                                    className="mt-2 px-5 py-2.5 border border-[#27272A] hover:border-[#0078D4] text-[#FAFAFA] rounded-lg text-sm font-medium transition-all">
                                    Send another
                                </button>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                                <h2 className="font-semibold text-lg text-[#FAFAFA]">Send a message</h2>

                                <div className="grid sm:grid-cols-2 gap-8">
                                    <div>
                                        <label htmlFor="name" className="block text-xs font-medium text-[#A1A1AA] mb-2">Name</label>
                                        <input id="name" type="text" required placeholder="Your name"
                                            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            className={INPUT} />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-xs font-medium text-[#A1A1AA] mb-2">Email</label>
                                        <input id="email" type="email" required placeholder="your@email.com"
                                            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            className={INPUT} />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="subject" className="block text-xs font-medium text-[#A1A1AA] mb-2">Subject</label>
                                    <input id="subject" type="text" required placeholder="What's this about?"
                                        value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                        className={INPUT} />
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-xs font-medium text-[#A1A1AA] mb-2">Message</label>
                                    <textarea id="message" required rows={5} placeholder="Tell me about the opportunity or project..."
                                        value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                                        className={`${INPUT} resize-none`} />
                                </div>

                                <button type="submit" disabled={loading}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0078D4] hover:bg-[#106EBE] text-white rounded-lg font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                                    {loading ? (
                                        <>
                                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                                                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                                            Sending...
                                        </>
                                    ) : (
                                        <><Send size={16} /> Send Message</>
                                    )}
                                </button>
                            </form>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

