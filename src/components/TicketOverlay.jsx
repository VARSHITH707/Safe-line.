/**
 * TicketOverlay.jsx — SafeLine
 * Slide-up guidance card pinned to the bottom of the AR view.
 *
 * Displays:
 *  - Live guidance: direction icon, distance, instruction
 *  - Predictive prepare message
 *  - System messages + micro-correction flashes
 *  - Destination info: color swatch, gate, time, seat
 *  - Mode label: "Demo Mode – Simulated Navigation"
 */

const DIRECTION_LABELS = {
  straight:     'Straight',
  slight_left:  'Slight Left',
  slight_right: 'Slight Right',
  left:         'Turn Left',
  right:        'Turn Right',
};

export default function TicketOverlay({ ticket, onExit, guidance, directionIcon }) {
  const { id, destination, color, gate, time, seat, mode } = ticket;
  const {
    distance          = 0,
    direction         = 'straight',
    instruction       = '',
    prepareInstruction,
    systemMessage,
    microCorrection,
    reached,
  } = guidance ?? {};

  const distDisplay = reached
    ? '0.0 m'
    : `${Math.max(0, distance).toFixed(1)} m`;

  const dirLabel = DIRECTION_LABELS[direction] ?? 'Straight';

  return (
    <div id="ticket-overlay" className="absolute bottom-0 left-0 right-0 z-30 animate-slide-up">
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full bg-aura-border opacity-60" />
      </div>

      <div className="glass rounded-t-3xl px-5 pt-3 pb-8">

        {/* Top row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full animate-pulse-neon"
              style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
            <span className="font-mono text-xs text-aura-muted tracking-widest">{id}</span>
          </div>
          <button id="exit-ar-btn" onClick={onExit}
            className="text-xs text-aura-muted hover:text-aura-text transition-colors px-2 py-1 rounded-lg hover:bg-aura-border">
            ✕ Exit
          </button>
        </div>

        {/* Mode badge */}
        {mode && (
          <div className="mb-3">
            <span className="font-mono text-xs px-2 py-0.5 rounded-full border"
              style={{ borderColor: `${color}50`, color: `${color}cc`, background: `${color}10` }}>
              {mode}
            </span>
          </div>
        )}

        {/* Live guidance panel */}
        <div className="rounded-2xl mb-4 overflow-hidden"
          style={{ border: `1px solid ${color}40`, background: `${color}08` }}>

          {/* Direction + distance bar */}
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: `1px solid ${color}20` }}>
            <div className="flex items-center gap-2">
              <div className="text-4xl font-bold leading-none"
                style={{ color, textShadow: `0 0 16px ${color}` }}>
                {directionIcon}
              </div>
              <div>
                <p className="text-xs text-aura-muted uppercase tracking-widest font-mono">Direction</p>
                <p className="text-sm font-bold text-aura-text">{dirLabel}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-aura-muted uppercase tracking-widest font-mono">Remaining</p>
              <p className="text-2xl font-black font-mono"
                style={{ color, textShadow: `0 0 12px ${color}80` }}>
                {distDisplay}
              </p>
            </div>
          </div>

          {/* Main instruction */}
          <div className="px-4 py-3">
            <p className="text-xs text-aura-muted uppercase tracking-widest font-mono mb-1">SafeLine Navigation</p>
            <p className="text-sm font-semibold text-aura-text leading-snug min-h-[18px]">
              {instruction}
            </p>
          </div>

          {/* Prepare instruction */}
          {prepareInstruction && (
            <div className="px-4 pb-3 flex items-center gap-2">
              <span className="text-xs" style={{ color }}>⚡</span>
              <p className="text-xs font-mono italic" style={{ color: `${color}cc` }}>
                {prepareInstruction}
              </p>
            </div>
          )}

          {/* System message */}
          {systemMessage && (
            <div className="px-4 pb-3 flex items-center gap-2">
              <span className="text-xs text-aura-cyan">⬡</span>
              <p className="text-xs font-mono text-aura-cyan animate-pulse">{systemMessage}</p>
            </div>
          )}

          {/* Micro-correction */}
          {microCorrection && (
            <div className="px-4 pb-3 flex items-center gap-2">
              <span className="text-xs" style={{ color: '#f59e0b' }}>△</span>
              <p className="text-xs font-mono" style={{ color: '#f59e0bcc' }}>{microCorrection}</p>
            </div>
          )}

          {/* Arrival */}
          {reached && (
            <div className="px-4 pb-3 flex items-center gap-2">
              <span className="text-lg">✅</span>
              <p className="text-sm font-bold text-aura-neon glow-neon">Destination Reached!</p>
            </div>
          )}
        </div>

        {/* Destination headline */}
        <div className="mb-4">
          <p className="text-xs text-aura-muted uppercase tracking-widest font-mono mb-0.5">Destination</p>
          <h2 className="text-2xl font-black tracking-tight"
            style={{ color, textShadow: `0 0 20px ${color}80` }}>
            {destination}
          </h2>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Gate',    value: gate, icon: '🚪' },
            { label: 'Departs', value: time, icon: '🕐' },
            { label: 'Seat',    value: seat, icon: '💺' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-aura-bg rounded-xl p-3 flex flex-col gap-1">
              <span className="text-base">{icon}</span>
              <span className="text-xs text-aura-muted uppercase tracking-wider">{label}</span>
              <span className="text-xs font-semibold text-aura-text truncate">{value}</span>
            </div>
          ))}
        </div>

        {/* Color line legend */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full"
            style={{ background: `linear-gradient(90deg, ${color}20, ${color}, ${color}20)`, boxShadow: `0 0 10px ${color}` }} />
          <span className="text-xs text-aura-muted font-mono whitespace-nowrap">Follow the line</span>
          <div className="flex-1 h-2 rounded-full"
            style={{ background: `linear-gradient(90deg, ${color}20, ${color}, ${color}20)`, boxShadow: `0 0 10px ${color}` }} />
        </div>
      </div>
    </div>
  );
}
