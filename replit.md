# Marketingstuffs — AI Content & Growth Platform

## Overview

pnpm workspace monorepo. Two active artifacts: Marketingstuffs frontend + API server.
Zero Replit credits — uses 5 user-provided OpenRouter API keys (OPENROUTER_KEY_1–5) with an 8-model free-tier fallback chain. Images via Pollinations.ai (free).

## Navigation Structure (Navbar)

Blog Writer | Website Builder | Writing Tools | Social Media | **AI Image ✨** | **AI Video 🎬** | AI Tools | Resources | Pricing

- **AI Image** → `#ai-image` → `ImageGeneratorSection.tsx` (4 tabs: Text to Image, Social Media Images, Thumbnail Maker, Logo Studio)
- **AI Video** → `#ai-video` → `VideoGeneratorSection.tsx` (6 platforms: YouTube, Shorts, Reels, TikTok, Facebook, Twitter)
- **Resources** → `#resources` → `ResourcesSection.tsx` (tabs: Image Library, Content Library — merges ImageLibrary + MediaLibrary)

## Stack

- **Monorepo**: pnpm workspaces, TypeScript 5.9, Node.js 24
- **Frontend**: React + Vite + Tailwind + shadcn/ui + Framer Motion (`artifacts/gravitywrite-clone`)
- **API**: Express 5 (`artifacts/api-server`) — all AI routes in `src/routes/ai.ts`
- **AI models**: 8 confirmed free OpenRouter models with key-rotation fallback
- **Images**: Pollinations.ai (`https://image.pollinations.ai/prompt/{encoded}?...`)

## Free AI Models (FREE_MODELS in ai.ts)

```
google/gemma-4-26b-a4b-it:free
google/gemma-4-31b-it:free
qwen/qwen3-coder:free
nvidia/nemotron-3-super-120b-a12b:free
openai/gpt-oss-120b:free
nousresearch/hermes-3-llama-3.1-405b:free
google/gemma-3-27b-it:free
meta-llama/llama-3.3-70b-instruct:free
```

`streamWithFallback(messages, onChunk, onHeartbeat?, maxTokens=8192)` iterates all 5 keys × 8 models until one succeeds.

## API Endpoints (all in `src/routes/ai.ts`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/ai/generate-blog` | SSE — blog post generation (6-step wizard output) |
| POST | `/api/ai/improve-blog` | SSE — inline blog editing |
| POST | `/api/ai/suggest-titles` | JSON — 5 AI title suggestions |
| POST | `/api/ai/generate-website` | SSE — full single-page HTML website (legacy) |
| POST | `/api/ai/generate-website-section` | SSE — one section at a time (homepage/about/services/contact) |
| POST | `/api/ai/improve-website` | SSE — AI edits to generated website |
| POST | `/api/ai/auto-generate-business-info` | JSON — AI auto-fills tagline, description, services, audience |
| POST | `/api/ai/generate-social-post` | JSON — social media posts for selected platforms |
| POST | `/api/ai/instagram-caption` | SSE — caption with hook + story + CTA + 25 hashtags |
| POST | `/api/ai/generate-hooks` | JSON — 6 different hook types for any topic |
| POST | `/api/ai/generate-reply` | SSE — reply to comment/message (platform-aware) |
| POST | `/api/ai/reel-script` | SSE — scene-by-scene Reel/TikTok script |
| POST | `/api/ai/hashtag-suggestions` | JSON — 3 sets of hashtags (high-vol/niche/trending) |
| POST | `/api/ai/content-calendar` | JSON — 4-week AI content plan |
| POST | `/api/ai/repurpose-post` | SSE — adapt post for a different platform |
| POST | `/api/ai/tiktok-caption` | SSE — punchy TikTok caption + tips |
| POST | `/api/ai/pinterest-post` | SSE — SEO-rich pin title + description |

All SSE endpoints: `res.flushHeaders()` immediately + `: ping` heartbeat every 8s to prevent proxy timeout.

## Frontend Features (updated April 2026)

### Image Library (`ImageLibrary.tsx`)
- 10 categories × 12 curated prompts = 120 pre-defined Pollinations.ai images
- Categories: Business & Marketing, Social Media, Blog & Content, Product Photography, People & Portraits, Nature & Travel, Technology & AI, Abstract & Backgrounds, Food & Lifestyle, Education & Learning
- Custom image generator (free-text prompt → Pollinations.ai → displayed inline)
- Image lightbox: view full-size, edit prompt, regenerate with new seed, copy URL, download
- Search across all images by label or prompt text
- Lazy-loaded image cards with hover overlay (copy URL / download buttons)
- Mounted in Home.tsx at `<ImageLibrary />` with nav anchor `#image-library`

### Media Library (`MediaLibrary.tsx`)
- localStorage-based saved content hub (`marketingstuffs_media_library`, max 200 items)
- Exported helper: `saveToMediaLibrary(toolName, toolEmoji, category, content)` called from WritingToolsSection
- Features: search, star/unstar, filter starred, bulk export (TXT download), delete individual, clear all
- Full-screen view modal for any saved item with copy-all and delete
- Mounted in Home.tsx at `<MediaLibrary />` with nav anchor `#media-library`

### Writing Tools — Template Examples
- `TEMPLATES` record in `WritingToolsSection.tsx` with 2–3 quick-fill examples for 30+ key tools
- Each tool modal shows a "Quick examples" bar (below header, above form) with clickable template pills
- Clicking a template auto-fills all form fields so users can generate with one more click
- "Save to Library" button appears in the output panel after content is generated → calls `saveToMediaLibrary()`
- "Save" button shows green "Saved!" confirmation for 2.5s after clicking



### Blog Writer (6-step wizard)
1. Template (4 templates with mini-previews)
2. Idea + AI title suggestions
3. Style (tone/format)
4. Voice (1st/2nd/3rd person)
5. Images (0–6 Pollinations images, 6 styles)
6. Details (keywords, word count, etc.)
→ Output: streaming preview + copy/download HTML/MD/share

### Website Builder (27-step flow adapted for web app)
**Welcome** → "Create New Website" button
**4-step wizard:**
1. Business Type (18 categories) + Business Name
2. Content (tagline, description, services, audience, CTA) + AI Auto-Fill button
3. Contact Info (email, phone, address, socials) — optional/skippable
4. Style (6 styles) + Template (6 layouts) + Font Pairing (4) + Color Scheme (6)
→ "Start Building" button

**Building phase** (page-by-page generation):
- Generates 4 sections sequentially: Homepage → About Us → Services → Contact+Footer
- Each section: live iframe preview + "Keep & Next" / "Regenerate" / "Skip" buttons
- Progress tracker showing all 4 pages with status indicators

**Done phase:**
- Combined HTML (homepage + kept sections merged)
- Device preview toggle: Desktop / Tablet / Mobile
- "Edit with AI" sidebar (quick suggestions + custom prompt)
- Copy HTML / Download HTML buttons

### Social Media Manager (full 8-phase platform, `SocialMediaSection.tsx`)
8 tabs matching GrowBiz's full workflow:
1. **Connect Accounts** (Phase 1) — Toggle connect for 6 platforms, set @handle + timezone per account; persisted in localStorage
2. **Create Post** (Phase 2) — Campaign name, 8 content types, summary, 6 platforms, 6 tones, schedule picker, "Add to Queue", AI generate → per-platform editable previews → Save Draft / Schedule / Publish
3. **Calendar** (Phase 4) — Monthly grid with scheduled post chips (color by platform), prev/next month, AI 4-week calendar generator (business name + industry → structured weekly plan)
4. **Dashboard** (Phase 5) — Search bar + platform filter + status tabs (All/Published/Scheduled/Draft/Failed); expand post → inline edit, Publish Now, Duplicate, Copy, Delete
5. **Hashtag Manager** — AI generate 3 hashtag sets (high-vol/niche/trending) + manual create + copy all; saved sets in localStorage
6. **AI Tools Hub** — 11 tool cards (All-in-One Post, Instagram Caption, Hooks Generator, Facebook/Twitter/LinkedIn Responder, TikTok Caption, Reel Script, Pinterest Tool, Repurpose Content, Content Calendar); each card opens a form with streaming output
7. **Media Library** (Phase 5) — Drag-and-drop or click upload; images stored as base64 in localStorage; grid with download/delete
8. **Analytics** (Phase 6) — Published post stats (impressions/engagement/clicks per platform with bar chart), best posting times by platform, total impressions callout

All data (posts, hashtag sets, media, accounts) persisted via `useLS<T>()` custom hook (localStorage JSON).

## Key Implementation Notes

- `generate-website-section` prompts: homepage gets full HTML doc; about/services/contact get `<section>` blocks only
- Combining pages: strip `</body></html>` from homepage, append other sections, re-add closing tags
- SSE `maxTokens` is 6000 per section (smaller focused prompts), 8192 for full website (legacy)
- `combinePages()` helper in WebsiteDeveloperSection.tsx handles the HTML stitching
- All color schemes have real hex values; AI prompts include actual accent/bg/text hex codes
