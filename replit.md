# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### GravityWrite Clone (`artifacts/gravitywrite-clone`)
- Full landing page clone of gravitywrite.com with dark navy/purple glassmorphism aesthetic
- Functional AI features powered by OpenAI via Replit AI Integrations proxy (no API key required)
  - **Blog Writer**: Streaming SSE endpoint (`POST /api/ai/generate-blog`) — generates SEO-optimized markdown blog posts
  - **Image Generator**: (`POST /api/ai/generate-image`) — generates images using `gpt-image-1`, returns base64
  - **Social Media**: (`POST /api/ai/generate-social-post`) — generates platform-optimized posts with hashtags for multiple platforms

### API Server (`artifacts/api-server`)
- Express 5 REST API with routes in `src/routes/`
- AI routes implemented in `src/routes/ai.ts` using `@workspace/integrations-openai-ai-server`
- Models used: `gpt-5.2` (text), `gpt-image-1` (images)

## AI Integration Notes
- Uses Replit AI Integrations proxy — env vars `AI_INTEGRATIONS_OPENAI_BASE_URL` and `AI_INTEGRATIONS_OPENAI_API_KEY` are set automatically
- Image generation always returns base64 (not URLs); `response_format` is not configurable
- Use `max_completion_tokens` (not `max_tokens`) for gpt-5.2+
