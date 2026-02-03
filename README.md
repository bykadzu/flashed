# Flashed

**AI-powered web design generator** - Go from prompt to production-ready websites in seconds.

Generate beautiful, responsive HTML designs using multiple AI models. Iterate, refine, and publish instantly.

## Features

- **Multi-Model Support** - Choose between Gemini 3 Flash, Claude Sonnet/Opus, Grok, DeepSeek, Kimi K2.5, and more via OpenRouter
- **3 Style Variations** - Every prompt generates 3 distinct design directions
- **Brand Kits** - Save and apply your brand colors, fonts, and logos
- **Project Management** - Organize designs into projects
- **Template Library** - Quick-start templates for common use cases
- **Live Refinement** - Iterate on designs with natural language ("make it more minimal", "change to dark theme")
- **Image Context** - Upload reference images to guide the AI
- **Clone Mode** - Recreate existing websites from screenshots or URLs
- **One-Click Publish** - Deploy to Supabase-hosted URLs instantly
- **Share & Export** - Share links or download HTML

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **AI**: OpenRouter (multi-model gateway)
- **Backend**: Supabase (auth, database, hosting)
- **Styling**: Custom CSS with glassmorphism design

## Setup

### Prerequisites
- Node.js 18+
- OpenRouter API key ([get one here](https://openrouter.ai/keys))
- Supabase project (optional, for auth/publishing)

### Local Development

1. Clone the repo:
   ```bash
   git clone https://github.com/bykadzu/flashed.git
   cd flashed
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` from the example:
   ```bash
   cp .env.example .env.local
   ```

4. Add your API keys to `.env.local`:
   ```
   OPENROUTER_API_KEY=sk-or-v1-xxxxx
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. Run the dev server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import repo in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

## Available Models

| Model | Provider | Best For |
|-------|----------|----------|
| Gemini 3 Flash | Google | Fast, creative UI generation |
| Claude Sonnet 4.5 | Anthropic | Balanced quality/speed |
| Claude Opus 4.5 | Anthropic | Highest quality |
| Grok Code Fast | xAI | Quick iterations |
| DeepSeek V3.2 | DeepSeek | Cost-effective |
| Kimi K2.5 | Moonshot | Creative designs |
| GLM 4.7 | Zhipu | Alternative option |

## License

See [LICENSE](LICENSE) for details.

---

Built by [@bykadzu](https://github.com/bykadzu)
