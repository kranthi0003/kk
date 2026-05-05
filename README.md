# kranthikiran.com

A feature-packed interactive portfolio with AI, real-time data, mini games, and 60+ searchable actions — all in a single-page React app.

**🌐 Live at [kranthikiran.com](https://kranthikiran.com)**

---

## ✨ Highlights

| What | Details |
|------|---------|
| 🤖 AI Chatbot | Knows everything about me — ask anything. Powered by Groq/Llama 3.1 |
| 🔍 60+ Searchable Actions | Press `/` — macOS Spotlight-style palette finds every feature |
| 🎮 4 Terminal Games | Snake, Tic-Tac-Toe, Wordle (tech words), Memory |
| 🌍 3D Travel Globe | Interactive globe with cities I've visited |
| 📋 Live Changelog | Pulls latest commits from GitHub API in real-time |
| 📸 Share Card Generator | Branded 1200×630 cards for Twitter/LinkedIn with 4 themes |

---

## 🛠️ Feature List

### Two-Line Navbar
**Line 1** — Logo, centered nav links, search bar (`Type / to search`), Bitcoin wallet, Spotify, status monitor, theme toggle

**Line 2 — Action Bar** (9 icon buttons, tooltips on hover):

| Icon | Feature | What it does |
|------|---------|-------------|
| 📋 | Changelog | Full commit history modal with tags (New/Fix/Update/Remove) |
| 💬 | AI Chat | Opens the AI chatbot |
| 📄 | Resume | Opens CV/PDF viewer |
| 📱 | QR vCard | Scannable QR code + downloadable `.vcf` contact file |
| 🎲 | Surprise Me | Random action — starts a game, opens a feature, scrolls somewhere |
| 📖 | Reading Mode | Strips animations, narrows to 720px for clean reading/printing |
| ⚡ | Speed Test | Performance modal with grade (A+–D), visual bars for FCP/TTFB/DOM |
| 📸 | Share Card | Generates branded social card (Dark/Ocean/Purple/Minimal themes) |
| ✉️ | Hire Me | Pre-filled recruiter email template |

### AI-Powered
- **AI Chatbot** — Groq/Llama 3.1 8B with comprehensive system prompt covering every site detail. Typing effect, rotating suggestion pills, sessionStorage cache, rate limit handling
- **AI Shell Translator** — Type English in the terminal → get the exact bash/docker/k8s command. Cached per session
- **Architecture Diagram Generator** — Type `design twitter` in terminal → ASCII system design diagram
- **Command Palette** — 60+ actions across Navigate, Features, Quick Info, Actions, AI Tools, Games, Links, Projects. Keyboard nav, grouped results, admin mode

### Interactive
- **Terminal Arcade** — Snake 🐍, Tic-Tac-Toe ❌, Wordle 🟩 (tech words), Memory 🃏
- **3D Travel Globe** — react-globe.gl with arcs, labels, lazy loaded (~300KB)
- **Boot Sequence** — Neofetch-style boot detecting real hardware (CPU, GPU, RAM, browser, network, connection speed). Shows once per session
- **Matrix Easter Egg** — 5x rapid-click theme toggle → Matrix code rain

### Live Data
- **Bitcoin Wallet Tracker** — Live BTC balance + USD value from blockchain.info + CoinGecko
- **Spotify Player** — Embedded playlist dropdown
- **Status Monitor** — ECG heartbeat canvas + real-time metrics (FCP, TTFB, DOM load, heap memory, resource count). Pings every 750ms
- **Live Visitor Counter** — Supabase Realtime Presence. Shows "X viewing now" when 2+ visitors online
- **Changelog Feed** — Inline section showing last 4 commits from GitHub API

### Admin Features
Unlock by typing `kk2026` in the search bar + Enter:
- **Visitor Dashboard** — Live geo tracking: country/city (IP geolocation), device, browser, OS, referrer, current section, time on site
- **Guestbook Moderation** — Delete messages
- **Admin Badge** — Green 🔓 badge in search bar when active

### Social & Content
- **Guestbook** — Supabase-backed visitor messages (280 char limit)
- **QR vCard** — Scannable QR + downloadable .vcf contact file
- **Share Card** — 1200×630 branded cards with 4 color themes for social sharing

### Design
- **Light/Dark Mode** — System-aware with manual toggle
- **Apple-Style Bento Grid** — Profile, Spotify, live clock, "Currently" status, Instagram, rotating quotes, stats
- **OS-Styled Project Cards** — macOS window chrome with traffic light dots, status badges (ACTIVE/WIP)
- **Reading Mode** — Clean document layout, no distractions, print-friendly
- **Grid Background** — Faint engineering paper grid (different opacity per theme)
- **Scroll Progress Bar** — Thin accent bar at top

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` or `⌘K` | Open command palette |
| `Esc` | Close any modal/palette |
| `↑↓` + `Enter` | Navigate command palette results |
| `Ctrl+Shift+V` | Toggle visitor dashboard (admin) |

---

## 🏗️ Tech Stack

| Layer | Tech |
|-------|------|
| Framework | React 18 |
| Styling | Tailwind CSS v3 + PostCSS |
| Build | Vite 5 |
| 3D | react-globe.gl (Three.js) |
| AI | Groq API (Llama 3.1 8B Instant) |
| Backend | Supabase (Postgres + Realtime Presence) |
| Screenshots | html2canvas |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |
| Domain | kranthikiran.com (CNAME) |

---

## 📁 Project Structure

```
src/
├── components/
│   ├── AIChatbot.jsx         # AI chatbot — Groq/Llama with full site knowledge
│   ├── Terminal.jsx           # AI shell translator + architecture diagrams + 4 games
│   ├── CommandPalette.jsx     # macOS Spotlight search — 60+ actions, admin mode
│   ├── Navbar.jsx             # Two-line nav: links + action bar with 9 features
│   ├── BootLoader.jsx         # Neofetch boot sequence with hardware detection
│   ├── TravelMap.jsx          # 3D globe with react-globe.gl
│   ├── Changelog.jsx          # Full commit history modal (30 commits)
│   ├── ChangelogFeed.jsx      # Inline 4-commit feed (GitHub sidebar style)
│   ├── ShareCard.jsx          # Branded social card generator (4 themes)
│   ├── SpeedTest.jsx          # Performance modal with grades + visual bars
│   ├── QRvCard.jsx            # QR code + vCard download
│   ├── AdminDashboard.jsx     # Live visitor geo dashboard (admin)
│   ├── VisitorTracker.jsx     # Supabase Presence with geolocation
│   ├── VisitorCount.jsx       # "X viewing now" badge
│   ├── Guestbook.jsx          # Supabase-backed guestbook
│   ├── Heartbeat.jsx          # Canvas ECG waveform
│   ├── Hero.jsx               # Hero section with satellite backdrop
│   ├── Experience.jsx         # Career timeline
│   ├── TechStack.jsx          # Skills bento + certification pills
│   ├── About.jsx              # Apple-style bento grid
│   ├── Projects.jsx           # OS-styled project cards
│   ├── Contact.jsx            # Connect section
│   ├── Footer.jsx             # 3-column footer
│   ├── KonamiEasterEgg.jsx    # Matrix rain easter egg
│   ├── ScrollProgress.jsx     # Scroll progress bar
│   └── ThemeToggle.jsx        # Dark/light toggle
├── lib/
│   └── supabase.js            # Supabase client singleton
├── App.jsx                    # Main app — section ordering, component wiring
└── index.css                  # Theme variables, grid bg, reading mode, animations
```

---

## 🚀 Quick Start

```bash
git clone https://github.com/kranthi0003/kranthi-kiran-site.git
cd kranthi-kiran-site
npm install
npm run dev
```

### Environment Variables

| Variable | Purpose | Where |
|----------|---------|-------|
| `VITE_GROQ_API_KEY` | Groq API key for AI chatbot + terminal | GitHub Actions secret |

Supabase uses a publishable anon key (in `src/lib/supabase.js`) — safe for client-side.

---

## 📦 Deployment

Automatic via GitHub Actions on push to `main`:

1. `npm run build` — Vite production build
2. Injects `VITE_GROQ_API_KEY` from GitHub secrets
3. Copies `index.html` → `404.html` for SPA routing
4. Deploys via `peaceiris/actions-gh-pages`
5. CNAME: `kranthikiran.com`

---

## 📊 By the Numbers

| Metric | Count |
|--------|-------|
| React components | 25+ |
| Searchable actions | 60+ |
| Terminal commands | 16+ |
| Mini games | 4 |
| API integrations | 5 (Groq, Supabase, GitHub, Blockchain.info, CoinGecko) |
| Nav icon buttons | 9 |
| Share card themes | 4 |
| Keyboard shortcuts | 4 |

---

## 📄 License

Personal portfolio — code available for reference and inspiration. Not for commercial use without permission.
