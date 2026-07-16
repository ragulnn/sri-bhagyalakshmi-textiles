'use client'

import { useState, useEffect } from 'react'

const TEXTS = [
    'building cloud-native systems.',
    'automating Kubernetes workflows.',
    'designing DevOps pipelines.',
    'crafting AI-powered tooling.',
]

export default function TypingAnimation() {
    const [textIdx, setTextIdx] = useState(0)
    const [displayed, setDisplayed] = useState('')
    const [phase, setPhase] = useState<'typing' | 'pause' | 'deleting'>('typing')

    useEffect(() => {
        const current = TEXTS[textIdx]
        let timeout: NodeJS.Timeout

        if (phase === 'typing') {
            if (displayed.length < current.length) {
                timeout = setTimeout(() => {
                    setDisplayed(current.slice(0, displayed.length + 1))
                }, 60)
            } else {
                timeout = setTimeout(() => setPhase('pause'), 2000)
            }
        } else if (phase === 'pause') {
            timeout = setTimeout(() => setPhase('deleting'), 200)
        } else if (phase === 'deleting') {
            if (displayed.length > 0) {
                timeout = setTimeout(() => {
                    setDisplayed(displayed.slice(0, -1))
                }, 35)
            } else {
                setTextIdx((i) => (i + 1) % TEXTS.length)
                setPhase('typing')
            }
        }

        return () => clearTimeout(timeout)
    }, [displayed, phase, textIdx])

    return (
        <span className="text-[#A1A1AA]">
            I&apos;m passionate about{' '}
            <span className="text-accent font-medium">
                {displayed}
                <span className="inline-block w-[2px] h-5 align-middle bg-accent ml-0.5 animate-blink" />
            </span>
        </span>
    )
}
