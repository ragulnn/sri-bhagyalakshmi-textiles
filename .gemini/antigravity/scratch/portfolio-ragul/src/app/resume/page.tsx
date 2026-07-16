'use client'

import { motion } from 'framer-motion'
import { Download, Eye } from 'lucide-react'

export default function ResumePage() {
    return (
        <div className="min-h-screen pt-32 pb-28">
            <div className="max-w-4xl mx-auto px-6">
                {/* Header */}
                <div className="mb-12">
                    <span className="section-tag">Resume</span>
                    <h1 className="text-4xl sm:text-5xl font-black mb-5">My Resume</h1>
                    <p className="text-[#A1A1AA] text-lg max-w-2xl leading-relaxed">
                        Download my resume or view it directly in the browser.
                    </p>
                </div>

                {/* Action buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-wrap gap-4 mb-10"
                >
                    <a href="/resume.pdf" download
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#0078D4] hover:bg-[#106EBE] text-white rounded-lg font-semibold text-sm transition-all hover:shadow-[0_4px_20px_rgba(0,120,212,0.4)] hover:-translate-y-0.5">
                        <Download size={16} /> Download PDF
                    </a>
                    <a href="/resume.pdf" target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 border border-[#27272A] hover:border-[#0078D4] text-[#FAFAFA] rounded-lg font-semibold text-sm transition-all hover:-translate-y-0.5">
                        <Eye size={16} /> Open in New Tab
                    </a>
                </motion.div>

                {/* PDF Preview */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="bg-[#111113] border border-[#27272A] rounded-2xl overflow-hidden"
                >
                    {/* Header bar */}
                    <div className="px-6 py-4 border-b border-[#27272A] flex items-center gap-3">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                        </div>
                        <span className="text-xs text-[#A1A1AA] font-mono ml-2">resume.pdf</span>
                    </div>

                    {/* PDF embed */}
                    <div className="bg-[#1a1a1a]">
                        <iframe
                            src="/resume.pdf"
                            className="w-full"
                            style={{ height: '80vh', border: 'none' }}
                            title="Ragul M — Resume"
                        />
                    </div>
                </motion.div>

                {/* Note */}
                <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                    className="text-center text-xs text-[#A1A1AA] mt-6"
                >
                    If the preview doesn&apos;t load, use the buttons above to open or download.
                </motion.p>
            </div>
        </div>
    )
}
