<div align="center">

# 🌌 kranthikiran.com

**A 3D interactive portfolio that turns my life into a solar system.**

[![Live Site](https://img.shields.io/badge/live-kranthikiran.com-fbbf24?style=for-the-badge&logo=vercel&logoColor=white)](https://kranthikiran.com)
[![Release](https://img.shields.io/github/v/release/kranthi0003/kranthi-kiran-site?style=for-the-badge&color=10b981)](https://github.com/kranthi0003/kranthi-kiran-site/releases)
[![Stars](https://img.shields.io/github/stars/kranthi0003/kranthi-kiran-site?style=for-the-badge&color=8b5cf6)](https://github.com/kranthi0003/kranthi-kiran-site/stargazers)

</div>

---

## 🪐 What is this?

Three experiences in one site:

1. **2D Portfolio** — the main scroll-through site with all the sections (hero, workspace, experience, projects, travel, guestbook).
2. **3D Gamer Workspace** — a fully interactive 3D desk scene with LED strips, monitors showing live GitHub feed, neon bars, a walking soldier NPC (`WASD`), clock, and sticky notes.
3. **🚀 Solar System Explorer** — NASA Eyes-style orbital orrery where each real planet (Mercury → Neptune) is a portfolio section. Real NASA 2K textures, real axial tilts, Earth has rotating clouds, Saturn has textured rings.

---

## ✨ Features

| Category | What |
|---|---|
| 🌌 **3D Solar System** | Real planet textures, fly-to camera, orbiting moons, Saturn rings, NASA Eyes-style UI |
| 🎮 **3D Gamer Workspace** | Walkable desk scene, soldier NPC, LED strips, live GitHub feed on monitors |
| 🤖 **AI Chatbot** | Trained on my bio — ask it anything. Groq + Llama 3.1 |
| 🔍 **60+ Spotlight Actions** | Press `/` for macOS-style command palette |
| 🎮 **4 Terminal Games** | Snake, Tic-Tac-Toe, Wordle (tech words), Memory |
| 🌍 **3D Travel Globe** | Interactive globe (`react-globe.gl`) with cities visited |
| 📋 **Live GitHub Feed** | Real-time commits via GitHub REST API |
| 📸 **Share Card Generator** | 1200×630 branded cards in 4 themes |
| 📝 **Guestbook** | Realtime via Supabase — leave a note |
| ⚡ **Collab Editor** | Multiplayer Monaco editor with Supabase sync |
| 🎵 **Audio FX** | Spatial sound in workspace, ambient drone in space mode |

---

## 🛠️ Tech Stack

**Frontend** · React 18 · Vite 5 · Tailwind 3 · Framer Motion
**3D** · Three.js 0.184 · `@react-three/fiber` 8 · `@react-three/drei` 9
**Backend** · Supabase (realtime, DB, auth) · GitHub REST API · Groq AI
**Editor** · Monaco Editor · `jszip` for project downloads
**Globe** · `react-globe.gl`
**Hosting** · GitHub Pages (custom domain · auto deploy from `main`)

---

## 🚀 Quick Start

```bash
git clone https://github.com/kranthi0003/kranthi-kiran-site.git
cd kranthi-kiran-site
npm install --legacy-peer-deps
npm run dev          # vite dev server
npm run build        # production build → dist/
```

> **Note:** `--legacy-peer-deps` is required because `@react-three/fiber@8` declares a peer-dep mismatch with `@react-three/drei@9`. This is intentional — drei 9 still works fine with fiber 8.

---

## 📁 Project Structure

```
src/
├── App.jsx                 # Hash-based router + lazy routes
├── components/
│   ├── SpaceExplorer.jsx   # 🪐 NASA Eyes-style solar system
│   ├── Workspace.jsx       # 🎮 3D gamer desk scene
│   ├── Hero.jsx            # Landing hero
│   ├── WorkspaceSection.jsx
│   ├── Experience.jsx
│   ├── Projects.jsx
│   ├── TravelMap.jsx       # 3D globe
│   ├── Terminal.jsx        # CLI + games
│   ├── CollabEditor.jsx    # Multiplayer Monaco
│   ├── Guestbook.jsx       # Supabase realtime
│   └── ...
public/
├── models/soldier.glb      # Rigged NPC for workspace
└── textures/planets/       # 🌎 NASA 2K planet textures
    ├── sun.jpg
    ├── mercury.jpg
    ├── venus.jpg
    ├── earth.jpg
    ├── earth_clouds.jpg
    ├── mars.jpg
    ├── jupiter.jpg
    ├── saturn.jpg
    ├── saturn_ring.png
    ├── uranus.jpg
    ├── neptune.jpg
    └── moon.jpg
```

---

## 🪐 Solar System Map

The Space Explorer (`#/space`) maps each portfolio section to a real planet:

| Planet | Section | Special |
|--------|---------|---------|
| ☿ Mercury | About — Kranthi | Closest to the sun |
| ♀ Venus | Workspace — Station Alpha | Yellow atmosphere haze |
| 🌍 Earth | Experience — Experia | **Rotating clouds + moon** |
| ♂ Mars | Tech — Techyon | Red planet, 2 moons |
| ♃ Jupiter | Projects — Projectis | Largest, 4 moons |
| ♄ Saturn | Travel — Wanderer | **Alpha-mapped rings** |
| ♅ Uranus | Connect — Signalis | Tilted 97° + faint ring |
| ♆ Neptune | Guestbook — Beacon Prime | Farthest blue |

Click any planet → smooth camera fly-to + info drawer → EXPLORE button takes you to that section.

---

## 🛣️ Routes

| Hash | What |
|------|------|
| `#` (or none) | Main 2D portfolio |
| `#/space` | 🪐 Solar System Explorer |
| `#/workspace` | 🎮 3D Gamer Workspace |
| `#/battle` | Battle minigame |
| `#/collab` | Multiplayer Monaco editor |
| `#/transformation` | Image transformation page |
| `#/stranger` | Stranger chat |

---

## 🌟 Credits

- **Planet textures**: [solarsystemscope.com](https://www.solarsystemscope.com/textures/) (CC-BY 4.0)
- **3D NPC**: Mixamo soldier rig
- **Globe**: [react-globe.gl](https://github.com/vasturiano/react-globe.gl)
- **Inspiration**: [eyes.nasa.gov](https://eyes.nasa.gov/apps/solar-system/) for the orrery UX

---

## 📦 Releases

| Version | Title | Highlights |
|---------|-------|------------|
| **v1.0.0** | The Gamer Workspace | 3D walkable workspace, soldier NPC, LED strips, live GitHub feed |

See [all releases →](https://github.com/kranthi0003/kranthi-kiran-site/releases)

---

## 📜 License

MIT — fork it, build your own portfolio. Just don't claim my face.

---

<div align="center">

**Built with ☕ + 🧠 + ❤️ by [@kranthi0003](https://github.com/kranthi0003)**

[Website](https://kranthikiran.com) · [Twitter](https://twitter.com/kranthikiran03) · [LinkedIn](https://linkedin.com/in/akkiran003) · [Instagram](https://instagram.com/kranthi.kiran)

</div>
