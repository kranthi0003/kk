# kranthikiran.com

Personal portfolio site with AI-powered features, built with React + Tailwind CSS + Vite.

**🌐 Live at [kranthikiran.com](https://kranthikiran.com)**

## Features

### AI-Powered
- **AI Chatbot** — Ask anything about me, powered by Groq/Llama 3.1. Typing effect, rotating suggestions, response caching
- **AI Shell Translator** — Type plain English in the terminal, get the exact bash/docker/k8s command back
- **Command Palette** — Press `/` or `⌘K` to search and navigate everything instantly

### Interactive
- **Terminal Arcade** — 4 mini games: Snake, Tic-Tac-Toe, Wordle (tech words), Memory (icon pairs)
- **3D Travel Globe** — Interactive globe showing places I've been, built with react-globe.gl + Three.js
- **Boot Sequence** — Detects real visitor hardware (CPU, GPU, RAM, browser, network) and displays it in a Linux-style boot animation
- **Matrix Easter Egg** — 5x rapid-click the theme toggle. You'll know when you find it

### Social & Live Data
- **Bitcoin Wallet Tracker** — Live balance from blockchain.info + BTC price from CoinGecko
- **Spotify Player** — Embedded playlist in navbar dropdown
- **Site Status Monitor** — Real-time response time, TTFB, DOM load, resource count
- **Guestbook** — Visitors leave messages, stored in Supabase. Admin mode for moderation

### Design
- **Light/Dark Mode** — System-aware with manual toggle
- **Apple-Style Bento Grid** — About section with LinkedIn card, live clock, currently status, Spotify, Instagram
- **OS-Styled Project Cards** — macOS window chrome with traffic lights and status badges
- **Scroll Progress Bar** — Gradient accent bar at top of page

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | React 18 |
| Styling | Tailwind CSS v3 + PostCSS |
| Build | Vite 5 |
| 3D | react-globe.gl (Three.js) |
| AI | Groq API (Llama 3.1 8B) |
| Database | Supabase (guestbook) |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |
| Domain | kranthikiran.com |

## Project Structure

```
src/
├── components/
│   ├── AIChatbot.jsx        # AI chatbot with Groq/Llama
│   ├── Terminal.jsx          # AI shell translator + games
│   ├── CommandPalette.jsx    # ⌘K search palette
│   ├── BootLoader.jsx        # System-detecting boot sequence
│   ├── TravelMap.jsx         # 3D globe with react-globe.gl
│   ├── Navbar.jsx            # Nav with status/wallet/spotify dropdowns
│   ├── Guestbook.jsx         # Supabase-backed guestbook
│   ├── KonamiEasterEgg.jsx   # Matrix rain easter egg
│   ├── Hero.jsx              # Hero with satellite backdrop
│   ├── Experience.jsx        # Career timeline
│   ├── TechStack.jsx         # Skills bento + certifications
│   ├── About.jsx             # Apple-style bento grid
│   ├── Projects.jsx          # OS-styled project cards
│   ├── Contact.jsx           # Connect section with QR vCard
│   └── ...
├── lib/
│   └── supabase.js           # Supabase client
└── index.css                 # Theme variables + animations
```

## Quick Start

```bash
git clone https://github.com/kranthi0003/kranthi-kiran-site.git
cd kranthi-kiran-site
npm install
npm run dev
```

### Environment Variables

Set these as GitHub Actions secrets for production builds:

| Variable | Purpose |
|----------|---------|
| `VITE_GROQ_API_KEY` | Groq API key for AI chatbot + terminal |

Supabase credentials are in `src/lib/supabase.js` (anon/public key — safe for client-side).

## Deployment

Automatic via GitHub Actions on push to `main`:

1. Builds with Vite (`npm run build`)
2. Injects `VITE_GROQ_API_KEY` from secrets
3. Deploys to GitHub Pages via `peaceiris/actions-gh-pages`
4. CNAME configured for `kranthikiran.com`

## License

Personal portfolio — code available for reference. Not for commercial use without permission.
