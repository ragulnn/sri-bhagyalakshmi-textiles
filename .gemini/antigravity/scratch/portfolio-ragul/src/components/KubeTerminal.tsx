'use client'

import { useEffect, useState } from 'react'

const lines = [
    { delay: 0, text: '$ kubectl get pods -n kubepilot', color: '#FAFAFA' },
    { delay: 800, text: 'NAME                          READY   STATUS    AGE', color: '#A1A1AA' },
    { delay: 1000, text: 'discovery-agent-7d9b8c-x4k2p  1/1     Running   2m', color: '#4ade80' },
    { delay: 1200, text: 'planner-agent-5f6b7d-m9n3q    1/1     Running   2m', color: '#4ade80' },
    { delay: 1400, text: 'analyzer-agent-8c9d0e-p1r4s   1/1     Running   2m', color: '#4ade80' },
    { delay: 1600, text: 'prometheus-6d7e8f-t5u6v       1/1     Running   1h', color: '#4ade80' },
    { delay: 1800, text: 'loki-stack-9a0b1c-w7x8y       1/1     Running   1h', color: '#4ade80' },
    { delay: 2000, text: '$ kubectl describe pod discovery-agent-7d9b8c-x4k2p', color: '#FAFAFA' },
    { delay: 2600, text: 'Status: Running', color: '#4ade80' },
    { delay: 2900, text: 'Events: Investigation started...', color: '#60a5fa' },
    { delay: 3200, text: '  Correlating Prometheus metrics ⚡', color: '#f59e0b' },
    { delay: 3600, text: '  Fetching Loki logs 📋', color: '#f59e0b' },
    { delay: 4000, text: '  Tracing with Jaeger 🔍', color: '#f59e0b' },
    { delay: 4400, text: '✅ Root cause identified: OOMKilled', color: '#4ade80' },
    { delay: 4800, text: '💡 Recommendation: Increase memory limit', color: '#60a5fa' },
    { delay: 5200, text: '$ █', color: '#FAFAFA' },
]

export default function KubeTerminal() {
    const [visibleCount, setVisibleCount] = useState(0)

    useEffect(() => {
        const timers: NodeJS.Timeout[] = []
        lines.forEach((line, i) => {
            const t = setTimeout(() => {
                setVisibleCount(i + 1)
            }, line.delay)
            timers.push(t)
        })
        // Loop
        const loop = setTimeout(() => {
            setVisibleCount(0)
            // restart effect by re-mounting? We'll just reset state
        }, 7000)
        timers.push(loop)

        return () => timers.forEach(clearTimeout)
    }, [visibleCount === 0 ? 0 : null])

    useEffect(() => {
        if (visibleCount !== 0) return
        const timers: NodeJS.Timeout[] = []
        lines.forEach((line, i) => {
            const t = setTimeout(() => {
                setVisibleCount(i + 1)
            }, line.delay)
            timers.push(t)
        })
        return () => timers.forEach(clearTimeout)
    }, [visibleCount])

    return (
        <div className="terminal glow-blue animate-float relative overflow-hidden" style={{ minHeight: 380 }}>
            {/* Terminal header */}
            <div className="terminal-header">
                <div className="terminal-dot bg-[#FF5F57]" />
                <div className="terminal-dot bg-[#FFBD2E]" />
                <div className="terminal-dot bg-[#28CA41]" />
                <span className="ml-2 text-xs text-[#A1A1AA]">kubepilot — zsh</span>
            </div>

            {/* Terminal body */}
            <div className="p-4 text-xs leading-6 min-h-[320px] overflow-hidden">
                {lines.slice(0, visibleCount).map((line, i) => (
                    <div key={i} style={{ color: line.color }} className="whitespace-pre">
                        {line.text}
                    </div>
                ))}
            </div>

            {/* Scan line effect */}
            <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent/30 to-transparent pointer-events-none animate-scan opacity-60" />
        </div>
    )
}
