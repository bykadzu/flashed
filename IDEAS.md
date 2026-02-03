# Flashed - Ideas & Roadmap

## v2 Feature Ideas

### Export & Delivery
- [ ] **Export to HTML/ZIP** - Download complete website packages
- [ ] **Export to React/Vue components** - Framework-specific output
- [ ] **Custom domain connection** - Premium feature for clients
- [ ] **Netlify/Vercel direct deploy** - One-click to hosting platforms

### Collaboration
- [ ] **Team workspaces** - Multiple users per project
- [ ] **Comments & annotations** - Feedback on specific designs
- [ ] **Version history** - Full revision tracking with restore
- [ ] **Client preview links** - Share for approval without login

### Monetization
- [ ] **White-label option** - Let agencies rebrand it
- [ ] **API access** - Programmatic generation for integrations
- [ ] **Subscription tiers** - Free/Pro/Agency pricing
- [ ] **Credits system** - Pay-per-generation model

### AI Enhancements
- [ ] **Multi-page sites** - Generate full websites, not just single pages
- [ ] **Component extraction** - Break designs into reusable parts
- [ ] **A/B variant generation** - Create test versions automatically
- [ ] **SEO optimization pass** - Auto-add meta tags, structure

---

## HTML Library Feature (Merge Candidate)

A separate app concept that could integrate with Flashed:

### Core Concept
Visual library for managing HTML files - like Instagram for websites.

### Features
- **HTML Input**: Upload .html files or paste raw HTML
- **Auto-extraction**: Pull title, meta description, favicon
- **Preview Cards**: Grid layout with live iframe previews
- **Safe Rendering**: Sandboxed iframes, disable scripts by default
- **Detail View**: Full interactive preview with viewport toggles
- **Library Management**: Search, sort, tags, folders/collections

### Integration Ideas
- Generated designs from Flashed auto-save to library
- Library becomes the "portfolio" view
- Drag designs from library into new projects
- Compare before/after versions side-by-side

### Technical Notes
- Sandboxed iframes for security
- No external network requests from uploaded HTML (unless trusted)
- Local storage or Supabase for persistence

---

## Business Model Ideas

### Target Markets
1. **Freelance web designers** - Speed up mockup phase
2. **Marketing agencies** - Quick landing page generation
3. **Startups** - MVP website in minutes
4. **No-code builders** - Visual-first users

### Pricing Thoughts
- Free tier: 10 generations/month, Gemini only
- Pro ($19/mo): Unlimited, all models, brand kits
- Agency ($49/mo): Team features, white-label, API

### Free Gemini Glitch
Google AI Studio offers free Gemini 3 Flash - could be leveraged for free tier without API costs.

---

## Technical Debt / Polish

- [ ] Improve mobile responsiveness
- [ ] Add loading skeletons
- [ ] Better error messages
- [ ] Keyboard shortcuts
- [ ] Undo/redo support
- [ ] Auto-save drafts

---

*Last updated: February 2026*
