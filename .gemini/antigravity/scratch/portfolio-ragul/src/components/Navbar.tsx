'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'

const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/projects', label: 'Projects' },
    { href: '/skills', label: 'Skills' },
    { href: '/resume', label: 'Resume' },
    { href: '/contact', label: 'Contact' },
]

export default function Navbar() {
    const pathname = usePathname()
    const [scrolled, setScrolled] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', onScroll)
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    return (
        <>
            <motion.header
                initial={{ y: -60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled
                        ? 'bg-[#09090B]/90 backdrop-blur-xl border-b border-[#27272A] shadow-lg shadow-black/20'
                        : 'bg-transparent'
                    }`}
            >
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#0078D4] flex items-center justify-center text-white font-bold text-sm">
                            RM
                        </div>
                        <span className="font-bold text-[#FAFAFA] hidden sm:block">Ragul M</span>
                    </Link>

                    {/* Desktop nav */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => {
                            const active = pathname === link.href
                            return (
                                <Link key={link.href} href={link.href}
                                    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${active ? 'text-[#FAFAFA]' : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B]'
                                        }`}
                                >
                                    {active && (
                                        <motion.div layoutId="nav-pill"
                                            className="absolute inset-0 bg-[#18181B] border border-[#27272A] rounded-lg"
                                            transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                                        />
                                    )}
                                    <span className="relative z-10">{link.label}</span>
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Right — CTA + hamburger */}
                    <div className="flex items-center gap-3">
                        <Link href="/contact"
                            className="hidden sm:inline-flex items-center px-4 py-2 bg-[#0078D4] hover:bg-[#106EBE] text-white rounded-lg text-sm font-semibold transition-all">
                            Hire Me
                        </Link>
                        <button onClick={() => setMenuOpen((o) => !o)}
                            className="md:hidden w-9 h-9 rounded-lg border border-[#27272A] flex items-center justify-center text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B] transition-all">
                            {menuOpen ? <X size={18} /> : <Menu size={18} />}
                        </button>
                    </div>
                </div>
            </motion.header>

            {/* Mobile menu */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="fixed top-16 inset-x-0 z-40 bg-[#09090B]/95 backdrop-blur-xl border-b border-[#27272A] md:hidden"
                    >
                        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-1">
                            {navLinks.map((link) => (
                                <Link key={link.href} href={link.href}
                                    onClick={() => setMenuOpen(false)}
                                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${pathname === link.href
                                            ? 'bg-[#18181B] text-[#FAFAFA] border border-[#27272A]'
                                            : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B]'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <Link href="/contact" onClick={() => setMenuOpen(false)}
                                className="mt-2 px-4 py-3 bg-[#0078D4] hover:bg-[#106EBE] text-white rounded-lg text-sm font-semibold text-center transition-all">
                                Hire Me
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
