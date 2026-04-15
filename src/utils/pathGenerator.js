/**
 * pathGenerator.js — SafeLine Dynamic Path Generator
 *
 * Generates a unique navigation path on every call:
 *  - 3 segments of random length (10–15m each)
 *  - 2 turns, each randomly LEFT or RIGHT (90° only)
 *  - Waypoints computed by accumulating direction vectors in 3D space
 *  - Guidance instructions timed to turn distances for predictive voice
 *
 * Math conventions (Three.js XZ plane):
 *   Initial forward direction: (dx=0, dz=-1) = -Z axis
 *   Left  turn formula: [dx, dz] → [dz,  -dx]  (+90° Y rotation)
 *   Right turn formula: [dx, dz] → [-dz,  dx]  (-90° Y rotation)
 */

// ── Color palette ─────────────────────────────────────────────────────────
const COLORS = [
  { hex: '#39ff14', name: 'Neon Green' },
  { hex: '#00f5ff', name: 'Cyan'       },
  { hex: '#f59e0b', name: 'Amber'      },
  { hex: '#ff6ef7', name: 'Magenta'    },
];

// ── Random destination names ───────────────────────────────────────────────
const DESTINATIONS = [
  'Platform 3', 'Platform 6', 'Platform 9', 'Platform 11',
  'Gate A4', 'Gate B7', 'Gate C2',
  'Exit North', 'Exit West', 'Terminal 2',
];

const TIMES = ['11:42', '11:55', '12:10', '12:25', '12:40', '13:05'];
const SEATS = [
  'Coach 3 · Seat 14A', 'Coach 1 · Seat 8C',
  'Coach 5 · Seat 22B', 'Coach 2 · Seat 3D',
  'N/A',
];

// Prevent repeating exact same color consecutively
let _lastColorHex = null;

// ── Path geometry generation ───────────────────────────────────────────────
/**
 * Generates a randomized segmented 3D path with 90° turns.
 *
 * @returns {{
 *   waypoints:     number[][]   — [[x, y, z], ...]
 *   instructions:  object[]     — guidance steps ordered high→low distance
 *   totalDistance: number       — simulated real-world metres
 *   turnDirs:      string[]     — ['left'|'right', ...]  (NUM_SEGS-1 entries)
 * }}
 */
export function generatePath() {
  const NUM_SEGS   = 3;
  const SEG_MIN_M  = 10;  // min real-world metres per segment
  const SEG_MAX_M  = 15;  // max real-world metres per segment
  const SEG_MIN_V  = 4;   // min visual units (Three.js)
  const SEG_MAX_V  = 8;   // max visual units

  // ── 1. Random segment lengths ────────────────────────────────────────────
  const segments = Array.from({ length: NUM_SEGS }, () => ({
    visualLen: SEG_MIN_V + Math.random() * (SEG_MAX_V - SEG_MIN_V),
    realDist:  SEG_MIN_M + Math.random() * (SEG_MAX_M - SEG_MIN_M),
  }));
  const totalDistance = Math.round(segments.reduce((a, s) => a + s.realDist, 0));

  // ── 2. Random turn directions ────────────────────────────────────────────
  const turnDirs = Array.from({ length: NUM_SEGS - 1 }, () =>
    Math.random() < 0.5 ? 'left' : 'right'
  );

  // ── 3. Build waypoints via direction-vector accumulation ─────────────────
  let cx = 0, cz = 0;
  let dx = 0, dz = -1;       // initial forward: -Z

  const waypoints = [[0, -0.5, 0]]; // start at origin

  for (let seg = 0; seg < NUM_SEGS; seg++) {
    const len = segments[seg].visualLen;

    // 3 intermediate points per segment → smooth CatmullRom curve
    for (let step = 1; step <= 3; step++) {
      const t = step / 3;
      waypoints.push([
        parseFloat((cx + dx * len * t).toFixed(4)),
        -0.5,
        parseFloat((cz + dz * len * t).toFixed(4)),
      ]);
    }

    cx += dx * len;
    cz += dz * len;

    // Apply turn between segments
    if (seg < NUM_SEGS - 1) {
      if (turnDirs[seg] === 'left') {
        [dx, dz] = [dz, -dx];             // +90° Y rotation
      } else {
        [dx, dz] = [-dz, dx];             // -90° Y rotation
      }
    }
  }

  // ── 4. Build guidance instructions timed to turn points ──────────────────
  const instructions = [];
  let remainingDist = totalDistance;

  // Opening instruction
  instructions.push({
    atDistance: totalDistance,
    direction:  'straight',
    text:       'Go straight — follow the glowing path',
    prepare:    null,
  });

  // Mid-segment straight
  const midFront = Math.round(totalDistance * 0.65);
  instructions.push({
    atDistance: midFront,
    direction:  'straight',
    text:       'Continue straight ahead',
    prepare:    null,
  });

  // Turn-related instructions
  for (let i = 0; i < turnDirs.length; i++) {
    remainingDist -= Math.round(segments[i].realDist);

    const isLeft   = turnDirs[i] === 'left';
    const prepDir  = isLeft ? 'slight_left'  : 'slight_right';
    const prepText = isLeft ? 'Prepare to turn left'  : 'Prepare to turn right';
    const turnText = isLeft ? 'Turn left now'          : 'Turn right now';

    // Prepare ~4m before turn
    const prepAt = Math.max(remainingDist + 1, Math.round(remainingDist + 4));
    instructions.push({ atDistance: prepAt, direction: prepDir,               text: prepText, prepare: prepText });
    instructions.push({ atDistance: Math.max(1, Math.round(remainingDist)),   direction: isLeft ? 'left' : 'right', text: turnText, prepare: null });

    // Post-turn straight
    const postAt = Math.max(2, Math.round(remainingDist) - 2);
    instructions.push({ atDistance: postAt, direction: 'straight', text: 'Good — continue straight', prepare: null });
  }

  // Arrival
  instructions.push({ atDistance: 4,   direction: 'straight', text: 'Almost there — destination just ahead', prepare: null });
  instructions.push({ atDistance: 0.5, direction: 'straight', text: 'Destination reached',                   prepare: null });

  // Sort high → low, deduplicate
  instructions.sort((a, b) => b.atDistance - a.atDistance);
  const seen = new Set();
  const uniqueInstructions = instructions.filter(inst => {
    const key = inst.atDistance;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { waypoints, instructions: uniqueInstructions, totalDistance, turnDirs };
}

// ── Full ticket generator ──────────────────────────────────────────────────
/**
 * Generates a complete randomized ticket + path for one navigation session.
 * Guarantees a different color from the previous call.
 */
export function generateTicket() {
  const path = generatePath();

  // Pick color (avoid consecutive repeat)
  let color;
  do { color = COLORS[Math.floor(Math.random() * COLORS.length)]; }
  while (color.hex === _lastColorHex && COLORS.length > 1);
  _lastColorHex = color.hex;

  const destination = DESTINATIONS[Math.floor(Math.random() * DESTINATIONS.length)];
  const gate = `${String.fromCharCode(65 + Math.floor(Math.random() * 5))}${Math.floor(Math.random() * 9 + 1)}`;

  return {
    // Display info
    id:          `TK-${Math.floor(Math.random() * 9000) + 1000}`,
    destination,
    color:       color.hex,
    colorName:   color.name,
    gate,
    time:        TIMES[Math.floor(Math.random() * TIMES.length)],
    seat:        SEATS[Math.floor(Math.random() * SEATS.length)],
    // Dynamic path data (consumed by ARScene + guidanceEngine)
    waypoints:     path.waypoints,
    instructions:  path.instructions,
    totalDistance: path.totalDistance,
    turnDirs:      path.turnDirs,
    // Mode label for UI
    mode:        'Demo Mode – Simulated Navigation',
  };
}
