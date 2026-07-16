'use client'

import Link from 'next/link'
import { GitHubIcon, LinkedInIcon } from '@/components/Icons'

const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/projects', label: 'Projects' },
    { href: '/skills', label: 'Skills' },
    { href: '/resume', label: 'Resume' },
    { href: '/contact', label: 'Contact' },
]

export default function Footer() {
    return (
        <footer className="border-t border-[#27272A] bg-[#0A0A0C]">
            <div className="max-w-6xl mx-auto px-6 py-12">
                <div className="grid sm:grid-cols-3 gap-10 mb-10">
                    {/* Brand */}
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-[#0078D4] flex items-center justify-center text-white font-bold text-sm">
                                RM
                            </div>
                            <span className="font-bold text-[#FAFAFA]">Ragul M</span>
                        </div>
                        <p className="text-xs text-[#A1A1AA] leading-relaxed max-w-xs">
                            DevOps &amp; Cloud Engineer building reliable, observable, and automated cloud-native systems.
                        </p>
                    </div>

                    {/* Navigation */}
                    <div>
                        <h4 className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-widest mb-4">Navigation</h4>
                        <div className="flex flex-col gap-2.5">
                            {navLinks.map((link) => (
                                <Link key={link.href} href={link.href}
                                    className="text-sm text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors w-fit animated-underline">
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Social */}
                    <div>
                        <h4 className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-widest mb-4">Connect</h4>
                        <div className="flex flex-col gap-3">
                            <a href="https://github.com/ragulnn" target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2.5 text-sm text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors">
                                <GitHubIcon size={16} />GitHub
                            </a>
                            <a href="https://linkedin.com/in/ragul-m-77b731297" target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2.5 text-sm text-[#A1A1AA] hover:text-[#0078D4] transition-colors">
                                <LinkedInIcon size={16} />LinkedIn
                            </a>
                            <a href="mailto:ragulm175@gmail.com"
                                className="flex items-center gap-2.5 text-sm text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                </svg>
                                ragulm175@gmail.com
                            </a>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-[#27272A] to-transparent mb-6" />

                <div className="flex flex-wrap items-center justify-between gap-4">
                    <p className="text-xs text-[#A1A1AA]">
                        © {new Date().getFullYear()} Ragul M — All rights reserved.
                    </p>
                    <p className="text-xs text-[#A1A1AA]">
                        Built with Next.js · TypeScript · Tailwind · Framer Motion
                    </p>
                </div>
            </div>
        </footer>
    )
}
