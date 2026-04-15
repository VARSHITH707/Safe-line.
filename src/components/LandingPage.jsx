import { useState, useEffect } from 'react';
import { generateTicket }      from '../utils/pathGenerator.js';

/**
 * LandingPage — SafeLine
 * Demo Mode – Simulated Navigation
 *
 * Auto-triggers a scan after ~900ms. Each scan generates a new
 * random route via generateTicket() (different color + path every time).
 * Manual "SCAN TICKET" button also works for re-scanning.
 */

// ── Auto-scan overlay ─────────────────────────────────────────────────────
function AutoScanOverlay({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [phase,    setPhase]    = useState('scanning');

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setPhase('verified');
          setTimeout(onComplete, 500);
          return 100;
        }
        return p + 5;
      });
    }, 35);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-aura-bg animate-fade-in">
      <div className="relative w-64 h-64 mb-8">
        {['top-0 left-0', 'top-0 right-0 rotate-90', 'bottom-0 right-0 rotate-180', 'bottom-0 left-0 -rotate-90'].map((cls, i) => (
          <div key={i} className={`absolute ${cls} w-8 h-8 border-l-2 border-t-2 border-aura-neon`} />
        ))}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-6xl">{phase === 'verified' ? '✅' : '🎫'}</div>
        </div>
        {phase === 'scanning' && <div className="scan-line" />}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'linear-gradient(#39ff14 1px, transparent 1px), linear-gradient(90deg, #39ff14 1px, transparent 1px)', backgroundSize: '20px 20px' }}
        />
      </div>
      <p className="font-mono text-sm text-aura-neon glow-neon mb-4">
        {phase === 'scanning' ? 'GENERATING ROUTE…' : '✓ ROUTE GENERATED'}
      </p>
      <div className="w-64 h-1 bg-aura-border rounded-full overflow-hidden">
        <div className="h-full bg-aura-neon rounded-full transition-all duration-75"
          style={{ width: `${progress}%`, boxShadow: '0 0 12px #39ff14' }} />
      </div>
      <p className="font-mono text-xs text-aura-muted mt-2">{progress}%</p>
    </div>
  );
}

// ── Main LandingPage ──────────────────────────────────────────────────────
export default function LandingPage({ onScanSuccess }) {
  const [scanning, setScanning] = useState(false);
  const [pending,  setPending]  = useState(null);

  // Auto-trigger on mount — generates a fresh dynamic ticket each time
  useEffect(() => {
    const ticket = generateTicket();
    setPending(ticket);
    const timer = setTimeout(() => setScanning(true), 900);
    return () => clearTimeout(timer);
  }, []);

  const handleScanClick = () => {
    if (scanning) return;
    const ticket = generateTicket();
    setPending(ticket);
    setScanning(true);
  };

  const handleScanComplete = () => {
    setScanning(false);
    onScanSuccess(pending);
  };

  return (
    <div className="relative h-full w-full flex flex-col bg-aura-bg overflow-hidden select-none">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(#00f5ff 1px, transparent 1px), linear-gradient(90deg, #00f5ff 1px, transparent 1px)', backgroundSize: '60px 60px' }}
      />
      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 60%, #39ff1410 0%, transparent 70%)' }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-10 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight glow-neon text-aura-neon">✦ SafeLine</h1>
          <p className="text-xs text-aura-muted tracking-widest uppercase mt-0.5">AR Safety Navigator</p>
        </div>
        <div className="glass rounded-xl px-3 py-1.5">
          <span className="flex items-center gap-1.5 text-xs text-aura-neon font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-aura-neon animate-pulse" />
            DEMO MODE
          </span>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex flex-col flex-1 items-center justify-center px-6 gap-8">
        {/* Ticket card */}
        <div className="border-neon-gradient glass rounded-2xl w-full max-w-sm p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-aura-muted font-mono uppercase tracking-widest">Transit Hub · Demo Mode</p>
              <p className="text-lg font-bold text-aura-text mt-1">Central Station</p>
              <p className="text-xs text-aura-muted mt-1">Simulated Navigation</p>
            </div>
            <span className="text-3xl">🚉</span>
          </div>
          <div className="relative w-full aspect-square max-w-[140px] mx-auto mb-4 rounded-xl overflow-hidden bg-aura-surface flex items-center justify-center">
            <div className="text-5xl">◼</div>
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'linear-gradient(#39ff14 1px, transparent 1px), linear-gradient(90deg, #39ff14 1px, transparent 1px)', backgroundSize: '12px 12px' }}
            />
          </div>
          <div className="flex justify-between text-xs text-aura-muted font-mono">
            <span>AUTO-SCAN</span>
            <span>DEMO ACTIVE</span>
          </div>
        </div>

        {/* Scan button */}
        <button
          id="scan-ticket-btn"
          onClick={handleScanClick}
          className="relative group w-full max-w-sm rounded-2xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-aura-neon focus:ring-offset-2 focus:ring-offset-aura-bg"
          aria-label="Generate new route and start AR navigation"
        >
          <div className="absolute inset-0 bg-aura-neon opacity-10 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl" />
          <div className="absolute inset-0 rounded-2xl border border-aura-neon opacity-60 group-hover:opacity-100 transition-opacity" style={{ boxShadow: '0 0 30px #39ff1430' }} />
          <div className="relative flex items-center justify-center gap-3 py-5 px-8">
            <span className="text-2xl group-hover:scale-110 transition-transform">🎟</span>
            <span className="text-lg font-bold text-aura-neon glow-neon group-hover:tracking-widest transition-all duration-300">
              NEW ROUTE
            </span>
          </div>
        </button>

        {/* Stats */}
        <div className="flex gap-10">
          {[['∞', 'Routes'], ['AR', 'Mode'], ['SAFE', 'Line']].map(([v, l]) => (
            <div key={l} className="flex flex-col items-center">
              <span className="font-mono text-xl font-bold text-aura-neon glow-neon">{v}</span>
              <span className="text-xs text-aura-muted uppercase tracking-widest mt-1">{l}</span>
            </div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 text-center pb-8">
        <p className="text-xs text-aura-muted font-mono">SafeLine · Demo Mode – Simulated Navigation · WebAR</p>
      </footer>

      {scanning && <AutoScanOverlay onComplete={handleScanComplete} />}
    </div>
  );
}
