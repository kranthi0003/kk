<div align="center">

# 🌌 kranthikiran.com

**A 3D interactive portfolio that turns my life into a solar system — plus a whole arcade of experiments, tools, and easter eggs.**

[![Live Site](https://img.shields.io/badge/live-kranthikiran.com-fbbf24?style=for-the-badge&logo=vercel&logoColor=white)](https://kranthikiran.com)
[![Stars](https://img.shields.io/github/stars/kranthi0003/kk?style=for-the-badge&color=8b5cf6)](https://github.com/kranthi0003/kk/stargazers)

</div>

---

## 🪐 What is this?

A single React + Vite site that packs several distinct experiences behind hash routes:

1. **2D Portfolio** — the main scroll-through site (hero, experience, tech stack, projects, about, terminal, travel, guestbook, contact).
2. **🚀 Solar System Explorer** — NASA Eyes-style orbital orrery where each real planet maps to a portfolio section. Real textures, axial tilts, orbiting moons, Saturn rings.
3. **🎮 3D Gamer Workspace** — a walkable 3D desk scene with LED strips, monitors, neon bars, a soldier NPC (`WASD`), and live GitHub feed.
4. **Mini-apps & games** — battle, collab editor, stranger chat, AstroDither, truth-or-dare, and more.
5. **Content pages** — blog, now, uses, timeline, knowledge base, music.
6. **Floating tools & widgets** — AI chatbot, share cards, calculators, crypto/dev dashboards, meme generator, and a spotlight command palette.

---

## ✨ Features

| Category | What |
|---|---|
| 🌌 **3D Solar System** | Real planet textures, fly-to camera, orbiting moons, Saturn rings, NASA Eyes-style HUD (`#/space`) |
| 🎮 **3D Gamer Workspace** | Walkable desk scene, soldier NPC (`WASD`), LED strips, live GitHub feed on monitors (`#/workspace`) |
| 🎨 **AstroDither** | Dithered astro/generative visual experience (`#/astro`) |
| 🤖 **AI Chatbot** | Floating assistant trained on my bio |
| ⚔️ **Battle & Collab** | Battle minigame (`#/battle`) + multiplayer Monaco editor (`#/collab`) |
| 💬 **Stranger Chat** | Anonymous realtime chat (`#/stranger`) |
| 🃏 **Truth or Dare** | Party game (`#/tod`) |
| 🌍 **3D Travel Globe** | Interactive globe of cities visited |
| 💻 **Terminal + Games** | In-browser CLI with games |
| 📋 **Live GitHub Feed** | Real-time commits via GitHub REST API |
| 📸 **Share Card Generator** | Branded cards via `html2canvas` |
| 📇 **QR vCard** | Scannable contact card via `qrcode.react` |
| 🧮 **Calculators** | Dev calc, carbon calc, salary calc |
| 📈 **Dashboards** | Crypto dashboard, DevNet, service/system status, weather |
| 📝 **Guestbook** | Realtime via Supabase |
| 📰 **Content** | Blog, Now, Uses, Timeline, Knowledge Base, Music pages |
| 🔒 **Private pages** | Password-protected Vegas & Europe trip plans |
| 🥚 **Easter eggs** | Konami/matrix effect, dopamine teaser, hidden `#/skota` & `#/allthebest` notes |
| 📱 **PWA** | Installable via `vite-plugin-pwa`, offline-ready |

---

## 🛠️ Tech Stack

**Frontend** · React 18 · Vite 5 · Tailwind CSS 3 · PostCSS + Autoprefixer
**3D** · Three.js 0.184 · `@react-three/fiber` 8 · `@react-three/drei` 9
**Editor** · `@monaco-editor/react` · `jszip` (project downloads)
**Backend / Realtime** · Supabase (`@supabase/supabase-js`) · GitHub REST API
**Utilities** · `html2canvas` (share cards) · `qrcode.react` (vCard) · `web-vitals`
**PWA** · `vite-plugin-pwa`
**Hosting** · GitHub Pages (custom domain via `CNAME`, auto-deploy from `main`)

---

## 🚀 Quick Start

```bash
git clone https://github.com/kranthi0003/kk.git
cd kk
npm install --legacy-peer-deps
npm run dev          # vite dev server
npm run build        # production build → dist/ (runs postbuild feed/movies/news generators)
npm run preview      # preview the production build
```

> **Note:** `--legacy-peer-deps` is required because `@react-three/fiber@8` declares a peer-dep mismatch with `@react-three/drei@9`. This is intentional — drei 9 works fine with fiber 8.

### npm scripts

| Script | What it does |
|--------|--------------|
| `dev` | Vite dev server |
| `build` | Production build to `dist/` |
| `preview` | Serve the built `dist/` locally |
| `postbuild` | Copies `index.html`→`404.html` (SPA fallback) and runs `gen-feed`, `gen-movies`, `gen-news` generators in `scripts/` |

---

## 🛣️ Routes

Routing is hash-based (SPA, reload-free). Most sub-pages are lazy-loaded.

| Hash | What |
|------|------|
| `#` (or none) | Main 2D portfolio |
| `#/space` | 🪐 Solar System Explorer |
| `#/workspace` | 🎮 3D Gamer Workspace |
| `#/astro` | AstroDither visual experience |
| `#/battle` | Battle minigame |
| `#/collab` | Multiplayer Monaco editor |
| `#/stranger` | Stranger chat |
| `#/transformation` | Transformation HQ |
| `#/tod` | Truth or Dare |
| `#/blog`, `#/blog/:slug` | Blog index & posts (`#/dopamine` → `cheap-dopamine`) |
| `#/now` | What I'm doing now |
| `#/uses` | Tools & gear |
| `#/timeline` | Certifications & learning journey |
| `#/notes` | Knowledge base / TILs |
| `#/music` | Music library & playlists |
| `#/reliability` | Reliability Lab (observability dashboard) |
| `#/vegas` | 🔒 Private, password-protected trip plan |
| `#/europe` | 🔒 Private, password-protected winter-trip plan |
| `#/allthebest`, `#/skota` | Private unlisted notes (shared by link) |

---

## 📁 Project Structure

```
├── index.html                # Vite entry
├── vite.config.js            # Vite + PWA config
├── tailwind.config.js        # Tailwind theme
├── postcss.config.js
├── package.json              # scripts & deps
├── CNAME                     # custom domain for GitHub Pages
├── scripts/                  # postbuild generators (feed, movies, news)
├── supabase/                 # Supabase config / functions
├── public/                   # static assets, models, planet textures, PWA assets
├── assets/
└── src/
    ├── App.jsx               # Hash router + lazy routes + homepage layout
    └── components/           # 100+ components: sections, pages, tools, widgets
        ├── SpaceExplorer.jsx     # 🪐 solar system
        ├── Workspace.jsx         # 🎮 3D desk scene
        ├── AstroDither.jsx       # dithered astro visuals
        ├── Hero.jsx / Experience.jsx / TechStack.jsx / Projects.jsx / About.jsx
        ├── Terminal.jsx / TravelMap.jsx / Guestbook.jsx / Contact.jsx
        ├── AIChatbot.jsx / ShareCard.jsx / QRvCard.jsx / MemeGenerator.jsx
        ├── CryptoDashboard.jsx / DevNet.jsx / ServiceStatus.jsx / WeatherWidget.jsx
        ├── Blog.jsx / NowPage.jsx / UsesPage.jsx / Timeline.jsx / KnowledgeBase.jsx / MusicPage.jsx
        └── battle/               # BattlePage, CollabEditor, ...
```

---

## 🪐 Solar System Map

The Space Explorer (`#/space`) maps each portfolio section to a real planet:

| Planet | Section | Special |
|--------|---------|---------|
| ☿ Mercury | About | Closest to the sun |
| ♀ Venus | Workspace | Yellow atmosphere haze |
| 🌍 Earth | Experience | **Rotating clouds + moon** |
| ♂ Mars | Tech | Red planet, 2 moons |
| ♃ Jupiter | Projects | Largest, 4 moons |
| ♄ Saturn | Travel | **Alpha-mapped rings** |
| ♅ Uranus | Connect | Tilted 97° + faint ring |
| ♆ Neptune | Guestbook | Farthest blue |

Click any planet → smooth camera fly-to + info drawer → EXPLORE takes you to that section.

---

## 🌟 Credits

- **Planet textures**: [solarsystemscope.com](https://www.solarsystemscope.com/textures/) (CC-BY 4.0)
- **3D NPC**: Mixamo soldier rig
- **Orrery UX inspiration**: [eyes.nasa.gov](https://eyes.nasa.gov/apps/solar-system/)

---

## 📜 License

MIT — fork it, build your own portfolio. Just don't claim my face.

---

<div align="center">

**Built with ☕ + 🧠 + ❤️ by [@kranthi0003](https://github.com/kranthi0003)**

[Website](https://kranthikiran.com) · [Twitter](https://twitter.com/kranthikiran03) · [LinkedIn](https://linkedin.com/in/akkiran003) · [Instagram](https://instagram.com/kranthi.kiran)

</div>
