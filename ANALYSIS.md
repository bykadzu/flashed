# Flashed Codebase Analysis

> AI-powered landing page generator — comprehensive technical audit

---

## 1. Generation Pipeline: Prompt → AI → HTML

The pipeline is a **two-phase streaming architecture**:

### Phase 1: Style Determination
- User provides: text prompt + optional URL context + optional reference image
- Input sanitized (instruction override removal, markdown stripping, 2000 char limit) — `index.tsx:35-41`
- AI determines 3–10 distinct visual styles via OpenRouter — `index.tsx:1359-1420`
- System prompt asks for styles like Retro, Brutalist, Playful, Corporate, etc.
- Fallback styles in `constants.ts:21-32` if parsing fails

### Phase 2: HTML Generation (per style)
- Batched in groups of 3 (`GENERATION_BATCH_SIZE`) via `Promise.all` — `index.tsx:1551-1554`
- Two prompt paths:
  - **Clone mode** (`index.tsx:1437-1455`): Pixel-perfect recreation from URL/screenshot
  - **Standard mode** (`index.tsx:1457-1486`): Full landing page from description
- Brand kit injected if selected (colors, font, logo) — `index.tsx:1424-1432`
- Streamed via `generateContentStream()` in `lib/openrouter.ts:199-254`
- HTML cleaned (markdown removal, structure validation) — `index.tsx:46-62`
- Rendered in sandboxed iframes via `ArtifactCard.tsx`

### Key Parameters
| Parameter | Value | Location |
|-----------|-------|----------|
| Temperature (style) | 0.7 | openrouter.ts |
| Temperature (variation) | 1.1 | openrouter.ts |
| Max tokens | 8192 | openrouter.ts:186 |
| Retry attempts | 3 | openrouter.ts:27-74 |
| Models available | 9 | openrouter.ts:76-90 |

---

## 2. Code Quality Issues & Bugs

### CRITICAL

**Session index race condition** — `index.tsx:1351`
```typescript
setSessions(prev => [...prev, newSession]);
setCurrentSessionIndex(sessions.length); // Uses STALE sessions.length
```
After adding a session, the index uses the old array length before React commits the state update. This causes off-by-one errors accessing undefined sessions.

**Unrestricted `postMessage('*')`** — `ArtifactCard.tsx:102-106`
```typescript
window.parent.postMessage({ type: 'SITE_NAVIGATE', artifactId: ARTIFACT_ID }, '*');
```
Wildcard origin means any iframe can intercept navigation data. Should use `window.location.origin`.

**Webhook URL injection** — `lib/supabase.ts:125-159`
User-provided webhook URLs injected directly into HTML without validation. Allows `javascript:` scheme injection (SSRF/XSS vector).

**Unsafe HTML parsing** — `lib/supabase.ts:38`
`DOMParser` used on AI-generated HTML without sanitization. Script injection possible in the builder context.

### HIGH

- **Multiple unguarded `JSON.parse` calls** — `index.tsx:233,243,252,462,1399` and `htmlLibrary.ts:13`. Corrupted localStorage crashes the app.
- **Streaming state thrashing** — `index.tsx:1508-1516`. Every chunk triggers `setSessions()` with deep cloning of the entire sessions array. Hundreds of re-renders per generation.
- **Missing useEffect dependencies** — `AnalyticsDashboard.tsx:65`. Stale closures from incomplete dependency arrays.
- **Non-null assertion on nullable** — `index.tsx:1929`. `focusedArtifactIndex!` bypasses null check.

### MEDIUM

- **100+ state variables in one component** — `index.tsx`. Monolithic 2000+ line file managing sessions, UI, brand kits, projects, and library state.
- **Weak ID generation** — `utils.ts:7`. `Math.random()` used instead of `nanoid` (which is installed).
- **Unused imports** — `index.tsx:10`. `validateEnv` and `ENV` imported but never called.
- **Blob URLs never revoked** — `ShareModal.tsx:74-76`. Memory leak from `URL.createObjectURL` without cleanup.
- **Babel script never removed from DOM** — `jsxCompiler.ts:40-51`. `<script>` tag appended but never cleaned up.
- **CORS wildcard on tracking endpoint** — `supabase/functions/track/index.ts:16`. `Access-Control-Allow-Origin: '*'` opens tracking to any origin.

---

## 3. Missing Features vs Competitors

| Feature | Flashed | Unbounce | Leadpages | Instapage |
|---------|---------|----------|-----------|-----------|
| AI Generation | **Yes (unique)** | No | Limited | No |
| Drag-Drop Builder | No | Yes | Yes | Yes |
| Templates | 30 | 100+ | 200+ | 500+ |
| A/B Testing | No | Yes | Yes | Yes |
| Advanced Analytics | Basic views | Heatmaps, funnels | Full suite | Full suite |
| Team Collaboration | No | Yes | Yes | Yes |
| CMS Integration | No | Yes | Yes | Yes |
| Custom Domains | Backend-ready, no UI | Yes | Yes | Yes |
| Mobile Editor | No | Yes | Yes | Yes |
| API Access | No | Yes | Yes | Yes |

### Biggest Gaps (by business impact)
1. **No visual/drag-drop editor** — AI-only editing limits non-technical users
2. **No A/B testing** — Cannot optimize conversion rates
3. **No team collaboration** — Blocks agency/enterprise adoption
4. **30 templates vs 200+** — Thin coverage across industries
5. **No heatmaps/funnels** — Cannot measure what matters

### Flashed's Unique Advantages
- AI-first generation (no competitor has this at this depth)
- Multi-model support (9 models across 5 providers)
- Clone mode from screenshots/URLs
- Full HTML export (competitors lock you in)
- Self-hostable architecture

---

## 4. Performance & Scaling Concerns

### CRITICAL

**Streaming re-render storm** — `index.tsx:1504-1516`
Every chunk from the AI stream triggers:
```typescript
setSessions(prev => prev.map(sess =>
    sess.id === sessionId ? {
        ...sess,
        artifacts: sess.artifacts.map(art =>
            art.id === artifact.id ? { ...art, html: accumulatedHtml } : art
        )
    } : sess
));
```
This deep-clones the entire sessions array hundreds of times per generation. With 10 variants generating simultaneously, this creates thousands of unnecessary re-renders.

**Fix**: Debounce/throttle state updates (e.g., `requestAnimationFrame`) or store streaming HTML in a ref, only committing to state on completion.

### HIGH

- **No request queuing** — All batches fire `Promise.all()` without client-side rate limiting. Can exhaust OpenRouter quotas.
- **No streaming timeout** — `openrouter.ts:199-254`. Hung streams block indefinitely.
- **Analytics query fetches ALL rows** — `AnalyticsDashboard.tsx:83-87`. No pagination or limit on `page_views` query.
- **localStorage quota bomb** — `htmlLibrary.ts:25`. HTML library saves without size limits. Large pages exhaust the 5-10MB quota with no recovery.
- **88KB main bundle + 81KB CSS** — No code splitting. Modals loaded upfront even when hidden.

### MEDIUM

- **Base64 image bloat** — `index.tsx:1381-1386`. 1MB image = 1.3MB base64 in every API request.
- **N+1 in analytics** — `AnalyticsDashboard.tsx:83-95`. Two separate queries for views + submissions per page.
- **View count race condition** — `track/index.ts:94-104`. Non-atomic two-step increment loses counts under load.
- **Placeholder AI call on every mount** — `index.tsx:445-473`. Wastes API calls generating placeholder suggestions without caching.
- **Loose version pinning** — `package.json`: `react-easy-crop: "latest"`, `tslib: "latest"`. Breaking changes possible.

---

## 5. Recommended Improvements (Priority Order)

### Tier 1 — Highest Impact

1. **Throttle streaming state updates**
   - Store accumulating HTML in a `useRef`, flush to state via `requestAnimationFrame`
   - Eliminates thousands of wasted re-renders per generation
   - Files: `index.tsx:1504-1516`, `index.tsx:1099-1115`

2. **Fix session index race condition**
   - Use `setSessions` callback to derive the new index: `setSessions(prev => { const next = [...prev, newSession]; setCurrentSessionIndex(next.length - 1); return next; })`
   - File: `index.tsx:1351`

3. **Wrap all `JSON.parse` in try-catch**
   - Create a `safeParse` utility
   - Files: `index.tsx:233,243,252,462,1399`, `htmlLibrary.ts:13`

4. **Restrict `postMessage` origins**
   - Replace `'*'` with `window.location.origin`
   - File: `ArtifactCard.tsx:102-106`

5. **Validate webhook URLs**
   - Use `new URL()` constructor, reject non-https schemes
   - File: `lib/supabase.ts:125-159`

### Tier 2 — High Value

6. **Extract `index.tsx` into hooks/reducers** — Split 2000+ line monolith into `useSessionManager`, `useGeneration`, `useBrandKit`, etc.
7. **Add code splitting** — `React.lazy()` for modals (PublishModal, AnalyticsDashboard, HTMLLibrary, BrandKitEditor)
8. **Add streaming timeouts** — AbortController with configurable timeout on all fetch streams
9. **Paginate analytics queries** — Add `.limit(100)` and date range filters
10. **Migrate HTML library to IndexedDB** — Handles larger datasets than localStorage

### Tier 3 — Strategic

11. Add A/B testing infrastructure (variant assignment + conversion tracking)
12. Build visual section editor (drag-drop for generated sections)
13. Add team workspaces with role-based access
14. Expand template library to 100+ across all verticals
15. Implement custom domain UI (backend already supports it)

---

## 6. New Industry Template Recommendations

### Currently Missing Verticals (highest demand first)

| Vertical | Templates to Add | Rationale |
|----------|------------------|-----------|
| **E-Commerce** | Product page, Store homepage, Checkout landing | Largest landing page market segment |
| **SaaS B2B** | Pricing page, Feature comparison, Enterprise landing | High-value, high-volume use case |
| **Creator Economy** | Podcast page, Digital product, Membership | Fastest-growing segment |
| **Financial Services** | Fintech app, Insurance product, Investment firm | High conversion value |
| **Non-Profit** | Donation page, Mission page, Fundraiser | Underserved, high social impact |
| **Automotive** | Dealership, Repair shop, Rental service | Local business demand |
| **Travel & Tourism** | Tour operator, Vacation rental, Travel guide | Seasonal but high volume |
| **Local Services** | Pet grooming, Cleaning, Landscaping, Moving | SMB bread-and-butter |
| **Hospitality** | Hotel landing, Event venue, Reservation portal | High booking conversion |
| **Manufacturing/B2B** | Industrial services, Trade show, Product catalog | Niche but high-ticket |

Adding these 30 templates would double coverage and address the biggest competitive gap.

---

## Highest-Impact Single Fix

**Throttle the streaming state updates in `index.tsx:1504-1516`.**

This is the single change with the largest performance payoff. Currently, every AI response chunk (potentially hundreds per generation) triggers a full state update that deep-clones the entire sessions array and causes React to diff and re-render the complete component tree. With 3-10 variants generating in parallel, this compounds into thousands of wasted renders.

The fix is straightforward:
1. Store accumulating HTML in a `useRef` (zero re-renders)
2. Flush to actual state on a throttled schedule (`requestAnimationFrame` or 100ms debounce)
3. Commit final state only on stream completion

This would reduce re-renders during generation by ~95% and make the UI noticeably more responsive, especially on lower-end devices.
