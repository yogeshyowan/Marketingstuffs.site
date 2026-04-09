# GrowBiz — AI Content & Growth Platform

## Overview

pnpm workspace monorepo. Two active artifacts: GrowBiz frontend + API server.
Zero Replit credits — uses 5 user-provided OpenRouter API keys (OPENROUTER_KEY_1–5) with an 8-model free-tier fallback chain. Images via Pollinations.ai (free).

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
| POST | `/api/ai/generate-social-post` | SSE — social media posts for 5 platforms |

All SSE endpoints: `res.flushHeaders()` immediately + `: ping` heartbeat every 8s to prevent proxy timeout.

## Frontend Features

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

### Social Media Generator
Platform-specific posts for Instagram, Twitter/X, Facebook, LinkedIn, YouTube (with hashtags, emojis, character counts)

## Key Implementation Notes

- `generate-website-section` prompts: homepage gets full HTML doc; about/services/contact get `<section>` blocks only
- Combining pages: strip `</body></html>` from homepage, append other sections, re-add closing tags
- SSE `maxTokens` is 6000 per section (smaller focused prompts), 8192 for full website (legacy)
- `combinePages()` helper in WebsiteDeveloperSection.tsx handles the HTML stitching
- All color schemes have real hex values; AI prompts include actual accent/bg/text hex codes
