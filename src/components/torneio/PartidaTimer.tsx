import { useState, useEffect, useRef } from 'react'
import { X, Play, Pause, RotateCcw, Timer } from 'lucide-react'

interface PartidaTimerProps {
  onClose: () => void
  defaultMinutes?: number
}

export function PartidaTimer({ onClose, defaultMinutes = 3 }: PartidaTimerProps) {
  const [totalSeconds, setTotalSeconds] = useState(defaultMinutes * 60)
  const [remaining, setRemaining] = useState(defaultMinutes * 60)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) {
            setRunning(false)
            setFinished(true)
            return 0
          }
          return r - 1
        })
      }, 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  function reset() {
    setRunning(false)
    setRemaining(totalSeconds)
    setFinished(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  function setDuration(mins: number) {
    const s = mins * 60
    setTotalSeconds(s)
    setRemaining(s)
    setRunning(false)
    setFinished(false)
  }

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const pct = totalSeconds > 0 ? remaining / totalSeconds : 0
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - pct)

  const color = pct > 0.5 ? '#22c55e' : pct > 0.2 ? '#f59e0b' : '#ef4444'

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 600,
      background: 'var(--color-bg-secondary)',
      border: `1px solid ${finished ? '#ef4444' : 'var(--color-border)'}`,
      borderRadius: 16, padding: '20px 24px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      width: 220,
      animation: finished ? 'timer-pulse 0.4s ease-in-out 3' : 'none',
    }}>
      <style>{`
        @keyframes timer-pulse { 0%,100%{box-shadow:0 8px 32px rgba(0,0,0,0.4)} 50%{box-shadow:0 0 0 6px #ef444444} }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'DM Sans', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>
          <Timer size={14} /> Timer de Partida
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 2 }}>
          <X size={16} />
        </button>
      </div>

      {/* SVG circle countdown */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <svg width={128} height={128} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={64} cy={64} r={radius} fill="none" stroke="var(--color-border)" strokeWidth={8} />
          <circle
            cx={64} cy={64} r={radius} fill="none"
            stroke={finished ? '#ef4444' : color}
            strokeWidth={8} strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.5s' }}
          />
          <text x={64} y={68} textAnchor="middle" dominantBaseline="middle"
            style={{ transform: 'rotate(90deg) translate(0px, -128px)', fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 28, fill: finished ? '#ef4444' : 'var(--color-text-primary)' }}>
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </text>
        </svg>
      </div>

      {finished && (
        <div style={{ textAlign: 'center', fontFamily: 'DM Sans', fontSize: 13, fontWeight: 700, color: '#ef4444', marginBottom: 12 }}>
          ⏰ Tempo esgotado!
        </div>
      )}

      {/* Duration presets */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 14 }}>
        {[1, 2, 3, 5].map(m => (
          <button key={m} onClick={() => setDuration(m)} style={{
            background: totalSeconds === m * 60 ? 'var(--color-blue-primary)' : 'var(--color-bg-tertiary)',
            border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer',
            fontFamily: 'DM Sans', fontSize: 11, fontWeight: 600,
            color: totalSeconds === m * 60 ? '#fff' : 'var(--color-text-muted)',
          }}>
            {m}m
          </button>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setRunning(r => !r)} disabled={finished} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          background: running ? '#f59e0b22' : 'var(--color-blue-primary)',
          border: running ? '1px solid #f59e0b' : 'none',
          color: running ? '#f59e0b' : '#fff',
          borderRadius: 8, padding: '9px', cursor: finished ? 'not-allowed' : 'pointer',
          fontFamily: 'DM Sans', fontWeight: 600, fontSize: 13, opacity: finished ? 0.5 : 1,
        }}>
          {running ? <><Pause size={14} /> Pausar</> : <><Play size={14} /> Iniciar</>}
        </button>
        <button onClick={reset} style={{
          background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)',
          color: 'var(--color-text-muted)', borderRadius: 8, padding: '9px 12px', cursor: 'pointer',
        }}>
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  )
}
