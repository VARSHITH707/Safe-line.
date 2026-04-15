import { useEffect, useRef, useState } from 'react';
import ARScene        from '../three/ARScene.jsx';
import TicketOverlay  from './TicketOverlay.jsx';
import { useGuidanceEngine } from '../utils/guidanceEngine.js';

/**
 * ARViewport — SafeLine
 *
 * - Dual-mode camera: WebXR native passthrough OR CSS getUserMedia fallback
 * - Runs guidance engine on mount (accepts full ticket object)
 * - Computes journey progress from ticket.totalDistance
 * - Passes progress to ARScene for camera curve-following
 */
export default function ARViewport({ ticket, onExit }) {
  const videoRef  = useRef(null);
  const streamRef = useRef(null);

  const [camStatus,   setCamStatus]   = useState('requesting');
  const [xrSupported, setXrSupported] = useState(false);
  const [showHUD,     setShowHUD]     = useState(true);

  // Guidance engine — ticket object contains all path data
  const { guidance, directionIcon } = useGuidanceEngine(ticket);

  // Journey progress (0 = start, 1 = arrived) — drives camera along spline
  const progress = ticket.totalDistance
    ? Math.max(0, Math.min(1, 1 - guidance.distance / ticket.totalDistance))
    : 0;

  // WebXR check
  useEffect(() => {
    navigator.xr?.isSessionSupported('immersive-ar')
      .then((ok) => setXrSupported(ok))
      .catch(() => setXrSupported(false));
  }, []);

  // Camera request (CSS fallback)
  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); }
        setCamStatus('active');
      })
      .catch(() => setCamStatus('denied'));
    return () => { cancelled = true; streamRef.current?.getTracks().forEach((t) => t.stop()); };
  }, []);

  if (camStatus === 'requesting') return (
    <div className="h-full flex flex-col items-center justify-center gap-6 bg-aura-bg px-8 text-center">
      <div className="text-5xl animate-pulse">📷</div>
      <div>
        <h2 className="text-xl font-bold text-aura-neon glow-neon mb-2">Camera Access Required</h2>
        <p className="text-sm text-aura-muted">SafeLine needs your camera to project the AR navigation path.</p>
      </div>
      <div className="w-48 h-1 bg-aura-border rounded-full overflow-hidden">
        <div className="h-full bg-aura-neon rounded-full animate-pulse" style={{ width: '60%' }} />
      </div>
    </div>
  );

  if (camStatus === 'denied') return (
    <div className="h-full flex flex-col items-center justify-center gap-6 bg-aura-bg px-8 text-center">
      <div className="text-5xl">🚫</div>
      <div>
        <h2 className="text-xl font-bold text-red-400 mb-2">Camera Access Denied</h2>
        <p className="text-sm text-aura-muted mb-4">Allow camera access in browser settings and reload.</p>
      </div>
      <button onClick={onExit} className="px-6 py-3 rounded-xl border border-aura-border text-aura-muted hover:text-aura-text hover:border-aura-neon transition-colors">
        ← Go Back
      </button>
    </div>
  );

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <video ref={videoRef} id="ar-camera-feed" className="camera-feed" playsInline muted autoPlay aria-label="Live camera feed" />

      <div className="ar-canvas" aria-hidden="true">
        <ARScene ticket={ticket} progress={progress} />
      </div>

      {showHUD && (
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-4 pb-3"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,8,0.75), transparent)' }}>
          <button id="back-from-ar-btn" onClick={onExit}
            className="glass rounded-xl px-3 py-2 text-xs text-aura-muted hover:text-aura-text flex items-center gap-2 transition-colors">
            ← Back
          </button>
          <div className="glass rounded-xl px-3 py-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: ticket.color, boxShadow: `0 0 8px ${ticket.color}` }} />
            <span className="font-mono text-xs text-aura-text">{ticket.destination}</span>
          </div>
          <button onClick={() => setShowHUD(false)}
            className="glass rounded-xl px-3 py-2 text-xs text-aura-muted hover:text-aura-text transition-colors">⊡</button>
        </div>
      )}

      {!showHUD && (
        <button onClick={() => setShowHUD(true)}
          className="absolute top-4 right-4 z-20 glass rounded-full w-10 h-10 flex items-center justify-center text-aura-neon">
          ✦
        </button>
      )}

      {xrSupported && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20">
          <div className="glass rounded-full px-3 py-1 text-xs font-mono text-aura-cyan flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-aura-cyan animate-pulse" />WebXR Active
          </div>
        </div>
      )}

      <TicketOverlay ticket={ticket} onExit={onExit} guidance={guidance} directionIcon={directionIcon} />
    </div>
  );
}
