# ✦ AuraLine Web — WebAR Indoor Navigator

> Scan a transit ticket → Follow a glowing neon AR line to your platform.
> Built with Vite · React · React-Three-Fiber · Tailwind CSS · Web Speech API.

---

## 🚀 Quick Start

> **Prerequisite:** Node.js 18+ must be installed. Download from [nodejs.org](https://nodejs.org).

```bash
cd i:\PROMT\auraline-web

# Install all dependencies (~60 seconds)
npm install

# Start dev server
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 📁 Project Structure

```
auraline-web/
├── index.html                  # App shell — dark bg, viewport meta
├── vite.config.js              # Vite + React plugin config
├── tailwind.config.js          # Neon color palette + glow animations
├── postcss.config.js
├── package.json                # All dependencies pinned
│
├── public/
│   └── favicon.svg             # Neon ✦ icon
│
└── src/
    ├── main.jsx                # React entry point
    ├── App.jsx                 # State machine: 'landing' | 'ar'
    ├── index.css               # Tailwind + glow/glass utilities
    │
    ├── components/
    │   ├── LandingPage.jsx     # Futuristic scan UI with animated overlay
    │   ├── TicketOverlay.jsx   # Slide-up AR info card  
    │   └── ARViewport.jsx      # Camera + Three.js canvas mount
    │
    ├── three/
    │   ├── ARScene.jsx         # R3F Canvas + Bloom post-processing
    │   └── GlowingPath.jsx     # Neon TubeGeometry along hardcoded waypoints
    │
    └── utils/
        └── audioGuide.js       # Web Speech API wrapper
```

---

## 🔮 How It Works

### 1. Landing Page
- Futuristic dark-mode UI with neon grid background
- **"SCAN TICKET"** button → triggers simulated scan animation (progress bar + scan line)
- Randomly assigns one of 3 demo tickets (Neon Green / Cyan / Amber)

### 2. AR Viewport (dual-mode)
| Mode | Condition | How |
|------|-----------|-----|
| **WebXR native** | Android Chrome / Safari 17+ on HTTPS | `navigator.xr.isSessionSupported('immersive-ar')` |
| **CSS fallback** | All other devices (localhost, iOS) | `getUserMedia` → `<video>` background + transparent canvas |

### 3. Glowing Path (Three.js)
- `CatmullRomCurve3` through 6 hardcoded waypoints (Z-axis, floor level)
- **Dual-layer tube**: inner solid emissive + outer additive-blend halo
- **Bloom** post-processing (`@react-three/postprocessing`) amplifies the glow
- Start ring (torus) at origin marks the user's position

### 4. Audio Guide
- Fires `announceTicket()` on AR mount via **Web Speech API**
- > *"Ticket confirmed. Follow the glowing green line to Platform 6."*

---

## 📱 Mobile Testing (WebXR camera)

WebXR camera passthrough requires **HTTPS**. For localhost mobile testing:

```bash
# Option A: cloudflared (free, no signup)
cloudflared tunnel --url http://localhost:5173

# Option B: ngrok
ngrok http 5173
```

Then open the HTTPS URL on your phone.

---

## 🧱 Tech Stack

| | Package | Purpose |
|---|---|---|
| ⚡ | `vite` + `@vitejs/plugin-react` | Dev server + HMR |
| ⚛️ | `react` + `react-dom` | UI framework |
| 🎨 | `tailwindcss` v3 | Utility CSS |
| 🔷 | `three` | 3D engine |
| 🎯 | `@react-three/fiber` | React renderer for Three.js |
| 🌐 | `@react-three/xr` | WebXR session management |
| ✨ | `@react-three/postprocessing` | Bloom glow effect |
| 🛠️ | `@react-three/drei` | Camera helpers |
| 🔊 | Web Speech API | Voice navigation (built-in) |

---

## 🗺️ Extending the Path (Phase 2)

To use **real** route coordinates from the FastAPI backend:

```js
// In ARScene.jsx, replace the static ticket prop with:
const { data: route } = useSWR(`/api/route/${ticket.id}`, fetcher);
// Pass route.waypoints to <GlowingPath waypoints={route.waypoints} />

// In GlowingPath.jsx, accept waypoints as a prop:
export default function GlowingPath({ color, waypoints }) { ... }
```

---

## ✅ Checklist

- [x] Vite + React scaffold
- [x] Tailwind v3 with neon palette
- [x] Futuristic landing page with scan animation
- [x] Dual-mode camera (WebXR + CSS fallback)
- [x] Neon TubeGeometry with Bloom glow
- [x] Slide-up ticket info overlay
- [x] Web Speech API audio announcement
- [ ] HTTPS tunnel for mobile WebXR
- [ ] Real route data from FastAPI backend
- [ ] WebXR hit-testing for floor-plane alignment
