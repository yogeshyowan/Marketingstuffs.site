import { Router } from "express";
import OpenAI from "openai";

const router = Router();

// ── Build one client per key ────────────────────────────────
function buildClients(): OpenAI[] {
  const keys = [
    process.env.OPENROUTER_KEY_1,
    process.env.OPENROUTER_KEY_2,
    process.env.OPENROUTER_KEY_3,
    process.env.OPENROUTER_KEY_4,
    process.env.OPENROUTER_KEY_5,
  ].filter(Boolean) as string[];

  if (keys.length === 0) throw new Error("No OPENROUTER_KEY_* env vars found");

  return keys.map(
    (apiKey) =>
      new OpenAI({
        apiKey,
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": "https://growbiz.ai",
          "X-Title": "GrowBiz",
        },
      })
  );
}

const CLIENTS = buildClients();

// ── Verified free models on OpenRouter (confirmed live) ────
// Ordered by context size and quality. All IDs verified against
// the OpenRouter /api/v1/models endpoint.
const FREE_MODELS = [
  "google/gemma-4-26b-a4b-it:free",                   // Gemma 4 26B   262k ctx — primary
  "google/gemma-4-31b-it:free",                        // Gemma 4 31B   262k ctx — #2
  "qwen/qwen3-coder:free",                             // Qwen3 Coder   262k ctx — #3
  "nvidia/nemotron-3-super-120b-a12b:free",            // Nemotron 120B 262k ctx — #4
  "openai/gpt-oss-120b:free",                          // GPT-OSS 120B  131k ctx — #5
  "nousresearch/hermes-3-llama-3.1-405b:free",         // Hermes 405B   131k ctx — #6
  "google/gemma-3-27b-it:free",                        // Gemma 3 27B   131k ctx — #7
  "meta-llama/llama-3.3-70b-instruct:free",            // Llama 3.3 70B  65k ctx — #8
];

// ── Claude paid models via OpenRouter ──────────────────────────
// Used for Plus / Pro / Bundle plans. Same OpenRouter keys, paid tier.
const CLAUDE_HAIKU  = "anthropic/claude-haiku-4-5";   // Fast, efficient — short outputs
const CLAUDE_SONNET = "anthropic/claude-sonnet-4-5";  // Best quality — long-form content

function pickClaudeModel(wordCount?: number): string {
  return (!wordCount || wordCount <= 1100) ? CLAUDE_HAIKU : CLAUDE_SONNET;
}

/**
 * Stream using Claude via OpenRouter (paid models).
 * Tries each key in order; falls back to free models on total failure.
 */
async function streamWithClaude(
  messages: ChatMessage[],
  onChunk: (text: string) => void,
  onHeartbeat?: () => void,
  model: string = CLAUDE_HAIKU,
  maxTokens = 12000
): Promise<{ key: number; model: string }> {
  const errors: string[] = [];

  for (let ki = 0; ki < CLIENTS.length; ki++) {
    try {
      const hbInterval = onHeartbeat ? setInterval(onHeartbeat, 8000) : null;
      let success = false;
      try {
        const stream = await CLIENTS[ki].chat.completions.create({
          model,
          max_tokens: maxTokens,
          messages,
          stream: true,
        });
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) onChunk(content);
        }
        success = true;
      } finally {
        if (hbInterval) clearInterval(hbInterval);
      }
      if (success) return { key: ki + 1, model };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`key${ki + 1}/${model}: ${msg.slice(0, 120)}`);
    }
  }

  // Full fallback to free models if Claude quota exhausted
  return streamWithFallback(messages, onChunk, onHeartbeat, maxTokens);
}

/**
 * Always retry on any error — we have 5 keys × 6 models = 30 combos.
 * Only hard-fail once all combinations are exhausted.
 */
async function chatWithFallback(messages: ChatMessage[]): Promise<{
  resp: OpenAI.Chat.ChatCompletion;
  key: number;
  model: string;
}> {
  const errors: string[] = [];

  for (let ki = 0; ki < CLIENTS.length; ki++) {
    for (const model of FREE_MODELS) {
      try {
        const resp = await CLIENTS[ki].chat.completions.create({
          model,
          max_tokens: 8192,
          messages,
        });
        return { resp, key: ki + 1, model };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`key${ki + 1}/${model}: ${msg.slice(0, 120)}`);
        // Always continue to next combo — surface only when fully exhausted
      }
    }
  }

  throw new Error(
    `All ${CLIENTS.length} keys × ${FREE_MODELS.length} models failed.\n${errors.join("\n")}`
  );
}

/**
 * Robustly extract a JSON object or array from an AI response.
 * Handles: raw JSON, ```json ... ```, prose + JSON block, trailing/leading text.
 */
function extractJSON(raw: string): unknown {
  // 1. Strip every code fence block (```json ... ``` or ``` ... ```)
  let s = raw.replace(/```(?:json)?\s*([\s\S]*?)```/g, "$1").trim();
  // 2. If still no clean start, try to find first { or [ in original
  if (!s.startsWith("{") && !s.startsWith("[")) {
    const objIdx = raw.indexOf("{");
    const arrIdx = raw.indexOf("[");
    let start = -1;
    if (objIdx !== -1 && arrIdx !== -1) start = Math.min(objIdx, arrIdx);
    else if (objIdx !== -1) start = objIdx;
    else if (arrIdx !== -1) start = arrIdx;
    if (start === -1) throw new Error("No JSON object or array found in AI response");
    s = raw.slice(start);
  }
  // 3. Trim trailing non-JSON text after the last } or ]
  const lastBrace = Math.max(s.lastIndexOf("}"), s.lastIndexOf("]"));
  if (lastBrace !== -1) s = s.slice(0, lastBrace + 1);
  return JSON.parse(s);
}

/**
 * Same strategy for streaming — always retry on any error.
 * onHeartbeat is called every ~10s to keep SSE connections alive through proxy timeouts.
 */
async function streamWithFallback(
  messages: ChatMessage[],
  onChunk: (text: string) => void,
  onHeartbeat?: () => void,
  maxTokens = 8192
): Promise<{ key: number; model: string }> {
  const errors: string[] = [];

  for (let ki = 0; ki < CLIENTS.length; ki++) {
    for (const model of FREE_MODELS) {
      try {
        const hbInterval = onHeartbeat
          ? setInterval(onHeartbeat, 8000)
          : null;

        let success = false;
        try {
          const stream = await CLIENTS[ki].chat.completions.create({
            model,
            max_tokens: maxTokens,
            messages,
            stream: true,
          });
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) onChunk(content);
          }
          success = true;
        } finally {
          if (hbInterval) clearInterval(hbInterval);
        }

        if (success) return { key: ki + 1, model };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`key${ki + 1}/${model}: ${msg.slice(0, 120)}`);
        // Always continue to next combo
      }
    }
  }

  throw new Error(
    `All ${CLIENTS.length} keys × ${FREE_MODELS.length} models failed.\n${errors.join("\n")}`
  );
}

// ───────────────────────────────────────────────
// POST /api/ai/generate-blog  (SSE streaming)
// ───────────────────────────────────────────────
router.post("/ai/generate-blog", async (req, res) => {
  const {
    topic,
    keywords = "",
    tone = "professional",
    wordCount = 800,
    language = "English",
    introStyle = "engaging",
    blogStyle = "How-To Guide",
    plan = "free",
  } = req.body as {
    topic: string;
    keywords?: string;
    tone?: string;
    wordCount?: number;
    language?: string;
    introStyle?: string;
    blogStyle?: string;
    plan?: string;
  };
  const isPaid = plan !== "free";

  if (!topic) { res.status(400).json({ error: "topic is required" }); return; }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);
  const heartbeat = () => res.write(": ping\n\n");

  // Send immediate heartbeat so the client knows we're alive
  heartbeat();

  const systemPrompt = `You are a world-class SEO content writer and professional blogger. Write comprehensive, deeply researched, publication-ready blog posts that rank on the first page of Google.

MANDATORY STRUCTURE:
1. A compelling SEO-optimized H1 title starting with #
2. **Meta Description:** [compelling 150-160 character SEO description]
3. **Primary Keyword:** [main keyword phrase]
4. An intro that hooks the reader immediately — 2-3 engaging paragraphs with a bold opening line
5. A "**Table of Contents**" section listing all H2 headings
6. 5-7 main sections each with ## H2 headings, with 2-4 rich paragraphs each
7. At least ONE formatted markdown table (comparison table, stats table, or pros/cons table) that adds real value
8. Bullet points and numbered lists throughout for easy scanning
9. ### H3 subheadings inside sections where helpful
10. A "## Key Takeaways" section with 5-7 bullet points
11. A strong conclusion with a clear call-to-action

CONTENT RULES:
- Write entirely in ${language}
- Blog style: ${blogStyle}
- Tone: ${tone}
- Target approximately ${wordCount} words
- Use proper markdown formatting throughout
- Make ALL headings SEO-friendly, benefit-driven, and click-worthy
- Integrate keywords naturally — never stuffed or forced
- Include transition sentences between sections for flow
- Add real data, statistics, and examples to increase credibility
- For How-To / FAQ styles: use numbered steps and Q&A format with ## for each question
- For Comparison style: include a detailed comparison table
- Always include at least one markdown table for visual data presentation`;

  const userPrompt = `Write a complete, publication-ready blog post about: "${topic}"${keywords ? `\n\nPrimary keywords to include naturally: ${keywords}` : ""}`;

  const msgs = [{ role: "system" as const, content: systemPrompt }, { role: "user" as const, content: userPrompt }];

  try {
    const { key, model } = isPaid
      ? await streamWithClaude(msgs, (text) => send({ content: text }), heartbeat, pickClaudeModel(wordCount), 12000)
      : await streamWithFallback(msgs, (text) => send({ content: text }), heartbeat);
    send({ done: true, _meta: { key, model, plan } });
    res.end();
  } catch (err: unknown) {
    req.log.error({ err }, "Blog generation failed");
    send({ error: err instanceof Error ? err.message : "Generation failed. Please try again." });
    res.end();
  }
});

// ───────────────────────────────────────────────
// POST /api/ai/generate-website  (SSE streaming)
// ───────────────────────────────────────────────
router.post("/ai/generate-website", async (req, res) => {
  const {
    websiteType = "Landing Page",
    businessName = "",
    tagline = "",
    description = "",
    audience = "",
    features = "",
    ctaText = "Get Started",
    contactEmail = "",
    contactPhone = "",
    contactAddress = "",
    socialInstagram = "",
    socialTwitter = "",
    socialFacebook = "",
    templateStyle = "Business Pro",
    fontHeading = "Inter",
    fontBody = "Inter",
    colorScheme = "dark professional",
    style = "professional",
    plan = "free",
  } = req.body as {
    websiteType?: string;
    businessName?: string;
    tagline?: string;
    description?: string;
    audience?: string;
    features?: string;
    ctaText?: string;
    contactEmail?: string;
    contactPhone?: string;
    contactAddress?: string;
    socialInstagram?: string;
    socialTwitter?: string;
    socialFacebook?: string;
    templateStyle?: string;
    fontHeading?: string;
    fontBody?: string;
    colorScheme?: string;
    style?: string;
    plan?: string;
  };
  const isPaidWeb = plan !== "free";

  if (!description && !businessName) {
    res.status(400).json({ error: "businessName or description is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);
  const heartbeat = () => res.write(": ping\n\n");
  heartbeat();

  // Build contact block
  const contactParts: string[] = [];
  if (contactEmail) contactParts.push(`Email: ${contactEmail}`);
  if (contactPhone) contactParts.push(`Phone: ${contactPhone}`);
  if (contactAddress) contactParts.push(`Address: ${contactAddress}`);
  if (socialInstagram) contactParts.push(`Instagram: ${socialInstagram}`);
  if (socialTwitter) contactParts.push(`Twitter: ${socialTwitter}`);
  if (socialFacebook) contactParts.push(`Facebook: ${socialFacebook}`);
  const contactInfo = contactParts.length > 0 ? contactParts.join("\n") : "No contact info provided";

  const systemPrompt = `You are an expert web developer and UI/UX designer. Generate a complete, production-ready, single-page website HTML file.

TECHNICAL REQUIREMENTS:
- Single self-contained HTML file with all CSS embedded in <style> tag, no external CSS files
- Use Google Fonts via @import for: heading font "${fontHeading}", body font "${fontBody}"
- Color scheme: ${colorScheme}
- Template style: ${templateStyle} — ${style}
- Fully responsive with mobile-first media queries
- Smooth scroll behavior, CSS hover/transition effects on buttons and cards
- Use CSS Grid and Flexbox for layout
- Sticky navigation with smooth scroll to sections
- Hamburger menu for mobile (pure CSS toggle using checkbox hack)

CONTENT SECTIONS (include ALL of these):
1. Navigation — logo (business name), links to all sections, CTA button saying "${ctaText || "Get Started"}"
2. Hero — compelling headline using the tagline, subheadline, two CTA buttons, visually impressive background
3. Services/Features — 3–6 service cards with unicode emoji icons, title, description
4. About Us / Our Story — 2-3 paragraphs, includes a stats row (3 numbers like "500+ clients", "10 years", etc.)
5. How It Works — 3-step process with numbered steps
6. Testimonials — 3 customer testimonials with star ratings, name, role
7. Pricing — 3 tiers (Basic/Pro/Enterprise or similar), highlight the middle tier as "Most Popular"
8. FAQ — 5 questions with expand/collapse using pure CSS (checkbox + label technique)
9. Contact — form (name, email, message fields) + display the real contact info provided
10. Footer — logo, links, social icons using unicode, copyright line

CONTACT INFO TO USE:
${contactInfo}

Return ONLY the complete HTML file starting with <!DOCTYPE html>. No explanations, no markdown fences.`;

  const userPrompt = `Build a complete website for this business:
Type: ${websiteType}
Name: ${businessName || "My Business"}
Tagline: ${tagline || "Excellence in everything we do"}
Description: ${description}
${audience ? `Target Audience: ${audience}` : ""}
${features ? `Key Services/Products: ${features}` : ""}
CTA Text: ${ctaText || "Get Started"}

Generate the complete HTML file now.`;

  const webMsgs = [{ role: "system" as const, content: systemPrompt }, { role: "user" as const, content: userPrompt }];

  try {
    const { key, model } = isPaidWeb
      ? await streamWithClaude(webMsgs, (text) => send({ content: text }), heartbeat, CLAUDE_SONNET, 16000)
      : await streamWithFallback(webMsgs, (text) => send({ content: text }), heartbeat);
    send({ done: true, _meta: { key, model, plan } });
    res.end();
  } catch (err: unknown) {
    req.log.error({ err }, "Website generation failed");
    send({ error: err instanceof Error ? err.message : "Generation failed. Please try again." });
    res.end();
  }
});

// ───────────────────────────────────────────────
// POST /api/ai/improve-blog  — edit/improve existing blog
// ───────────────────────────────────────────────
router.post("/ai/improve-blog", async (req, res) => {
  const { content, instruction } = req.body as { content: string; instruction: string };
  if (!content || !instruction) {
    res.status(400).json({ error: "content and instruction are required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);
  const heartbeat = () => res.write(": ping\n\n");
  heartbeat();

  try {
    const { key, model } = await streamWithFallback(
      [
        {
          role: "system",
          content: `You are an expert editor and content strategist. The user has an existing blog post and wants to improve it. 
Apply the requested changes while preserving the overall structure and tone.
Keep the markdown formatting intact. Return the FULL improved article.`,
        },
        {
          role: "user",
          content: `Here is my current blog post:\n\n${content}\n\n---\n\nPlease apply this improvement: ${instruction}\n\nReturn the complete updated blog post.`,
        },
      ],
      (text) => send({ content: text }),
      heartbeat
    );
    send({ done: true, _meta: { key, model } });
    res.end();
  } catch (err: unknown) {
    req.log.error({ err }, "Blog improvement failed");
    send({ error: err instanceof Error ? err.message : "Improvement failed. Please try again." });
    res.end();
  }
});

// ───────────────────────────────────────────────
// POST /api/ai/improve-website  — edit existing website
// ───────────────────────────────────────────────
router.post("/ai/improve-website", async (req, res) => {
  const { html, instruction } = req.body as { html: string; instruction: string };
  if (!html || !instruction) {
    res.status(400).json({ error: "html and instruction are required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);
  const heartbeat = () => res.write(": ping\n\n");
  heartbeat();

  try {
    const { key, model } = await streamWithFallback(
      [
        {
          role: "system",
          content: `You are an expert web developer. The user has a website they want to edit.
Apply the requested changes to the HTML. Return the COMPLETE updated HTML file starting with <!DOCTYPE html>.
Keep all existing sections intact unless the user asks to change them.`,
        },
        {
          role: "user",
          content: `Here is my current website HTML:\n\n${html}\n\n---\n\nPlease apply this change: ${instruction}\n\nReturn the complete updated HTML file.`,
        },
      ],
      (text) => send({ content: text }),
      heartbeat
    );
    send({ done: true, _meta: { key, model } });
    res.end();
  } catch (err: unknown) {
    req.log.error({ err }, "Website improvement failed");
    send({ error: err instanceof Error ? err.message : "Improvement failed. Please try again." });
    res.end();
  }
});

// ───────────────────────────────────────────────
// POST /api/ai/generate-image  (Pollinations.ai — truly free)
// ───────────────────────────────────────────────
router.post("/ai/generate-image", async (req, res) => {
  const { prompt, style = "", width = 1024, height = 1024 } = req.body as {
    prompt: string;
    style?: string;
    width?: number;
    height?: number;
  };

  if (!prompt) { res.status(400).json({ error: "prompt is required" }); return; }

  const fullPrompt = style
    ? `${prompt}, ${style} style, highly detailed, professional quality`
    : `${prompt}, highly detailed, professional quality`;
  const encoded = encodeURIComponent(fullPrompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&enhance=true&model=flux`;

  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error(`Pollinations returned ${imgRes.status}`);
    const buffer = await imgRes.arrayBuffer();
    const b64 = Buffer.from(buffer).toString("base64");
    const mime = imgRes.headers.get("content-type") ?? "image/jpeg";
    res.json({ b64_json: b64, mime, prompt: fullPrompt });
  } catch (err: unknown) {
    req.log.error({ err }, "Image generation failed");
    res.status(500).json({ error: "Image generation failed. Please try again." });
  }
});

// ───────────────────────────────────────────────
// POST /api/ai/generate-social-post
// ───────────────────────────────────────────────
router.post("/ai/generate-social-post", async (req, res) => {
  const {
    topic,
    brand = "",
    platforms,
    tone = "engaging",
    includeEmojis = true,
    hashtagCount = 5,
    postLength = "medium",
  } = req.body as {
    topic: string;
    brand?: string;
    platforms: string[];
    tone?: string;
    includeEmojis?: boolean;
    hashtagCount?: number;
    postLength?: string;
  };

  if (!topic || !platforms?.length) {
    res.status(400).json({ error: "topic and platforms are required" });
    return;
  }

  const platformList = platforms.join(", ");

  // Per-platform format rules
  const platformRules: Record<string, string> = {
    "Instagram": `Instagram: Structure = Hook line (attention-grabbing, 1 sentence) → 2-3 body lines with story or value → Clear CTA (e.g. "Drop a 🙌 below" or "Link in bio"). Max 2200 chars. Use ${includeEmojis ? "emojis liberally" : "no emojis"}. End with a blank line then 25-30 hashtags (mix popular + niche). Hashtag array should have 25-30 tags.`,
    "Facebook": `Facebook: Conversational and warm. Open with a relatable question or bold statement. 2-3 short paragraphs. End with a question to drive comments (e.g. "What do you think? 👇"). Max 500 chars for best reach. 3-5 hashtags only. ${includeEmojis ? "Use a few emojis." : "No emojis."}`,
    "X (Twitter)": `X/Twitter: Max 280 characters STRICTLY — count every character. Punchy, witty, or bold. One clear idea. Optional thread hook ("🧵 Thread:"). 1-2 hashtags woven naturally or at end. ${includeEmojis ? "1-2 emojis max." : "No emojis."}`,
    "LinkedIn": `LinkedIn: Professional long-form. Start with a bold insight or personal story hook (1 line). Then 3-5 short paragraphs with value, lessons, or data. End with a thought-provoking question to spark discussion. 1200-1500 chars ideal. 3-5 professional hashtags. ${includeEmojis ? "Minimal emojis (1-2 max)." : "No emojis."} NO "check out our product" language — share knowledge.`,
    "TikTok": `TikTok: Ultra-short punchy caption. Start with a hook ("POV:", "Wait for it 👀", "Nobody talks about this:"). 1-2 lines only. Trending / Gen-Z friendly tone. 8-12 hashtags mixing trending (#fyp #foryou) + niche tags. ${includeEmojis ? "Heavy emoji use." : "No emojis."}`,
    "Pinterest": `Pinterest: SEO-optimized. Start with keyword-rich title phrase (bolded in text). 2-3 sentences describing the content with keywords naturally embedded. Include a CTA ("Save this for later!", "Click to learn more"). 5-8 descriptive hashtags (topic-specific, no trending tags). ${includeEmojis ? "1-2 emojis." : "No emojis."}`,
  };

  const activeRules = platforms.map(p => platformRules[p] ?? `${p}: Write an engaging post appropriate for this platform.`).join("\n\n");

  const messages = [
    {
      role: "system" as const,
      content: `You are an expert social media copywriter who writes platform-native content. Each platform has strict formatting rules that you follow exactly. You ALWAYS respond with ONLY a raw JSON object — no markdown, no code fences, no explanation before or after.`,
    },
    {
      role: "user" as const,
      content: `Write social media posts for these platforms: ${platformList}

Topic / Brief: ${topic}
Tone: ${tone}
${brand ? `Brand voice: ${brand}` : ""}

PLATFORM-SPECIFIC RULES — follow each one exactly:
${activeRules}

RESPOND WITH ONLY THIS JSON — no text before or after, no code fences:
{"posts":[{"platform":"Platform Name","content":"post text here (following that platform's exact rules)","hashtags":["tag1","tag2"],"charCount":123,"bestTime":"Tuesday 7-9 PM","tip":"one platform-specific tip"}]}

Generate one post object per platform. The content field must NOT include hashtags (put them in the hashtags array). The charCount field should be the character count of the content field.`,
    },
  ];

  // Try up to 3 times to get valid JSON
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      let fullText = "";
      const { key, model } = await streamWithFallback(messages, (c) => { fullText += c; }, undefined, 2000);
      const parsed = extractJSON(fullText) as { posts: Array<{ platform: string; content: string; hashtags: string[]; bestTime?: string; tip?: string }> };
      if (parsed?.posts?.length) {
        res.json({ ...parsed, _meta: { key, model } });
        return;
      }
    } catch (_err) {
      // retry
    }
  }

  // All retries failed — build a minimal fallback from plain text so the UI doesn't break
  const fallbackPosts = platforms.map(p => ({
    platform: p,
    content: `✨ ${topic}\n\nCheck this out and let us know what you think! ${includeEmojis ? "🚀" : ""}`,
    hashtags: ["marketing", "socialmedia", "content", "business", "growth"],
    bestTime: "Weekdays 9-11 AM",
    tip: `Tailor your ${p} content to your audience for best results.`,
  }));
  res.json({ posts: fallbackPosts });
});

// ───────────────────────────────────────────────
// POST /api/ai/suggest-blog-titles
// ───────────────────────────────────────────────
router.post("/ai/suggest-blog-titles", async (req, res) => {
  const { topic, count = 5 } = req.body as { topic: string; count?: number };
  if (!topic) { res.status(400).json({ error: "topic is required" }); return; }

  try {
    const { resp } = await chatWithFallback([
      {
        role: "system",
        content:
          'You are an SEO expert. Generate click-worthy, SEO-optimized blog titles. Return ONLY valid JSON (no markdown): { "titles": ["title1", "title2", ...] }',
      },
      { role: "user", content: `Generate ${count} compelling blog titles for: ${topic}` },
    ]);
    const raw1 = resp.choices[0]?.message?.content ?? "{}";
    res.json(extractJSON(raw1));
  } catch (err: unknown) {
    req.log.error({ err }, "Title suggestion failed");
    res.status(500).json({ error: "Failed to suggest titles" });
  }
});

// ───────────────────────────────────────────────
// POST /api/ai/generate-website-section  (SSE)
// Generates ONE section at a time for the page-by-page builder
// ───────────────────────────────────────────────
router.post("/ai/generate-website-section", async (req, res) => {
  const {
    sectionType = "homepage",
    businessName = "",
    tagline = "",
    description = "",
    services = "",
    audience = "",
    ctaText = "Get Started",
    contactEmail = "",
    contactPhone = "",
    contactAddress = "",
    socialInstagram = "",
    socialTwitter = "",
    socialFacebook = "",
    fontHeading = "Inter",
    fontBody = "Inter",
    colorScheme = "dark professional",
    accentColor = "#2563eb",
    bgColor = "#0f172a",
    textColor = "#f1f5f9",
  } = req.body as Record<string, string>;

  if (!businessName) { res.status(400).json({ error: "businessName is required" }); return; }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);
  const heartbeat = () => res.write(": ping\n\n");
  heartbeat();

  const BASE_CSS = `@import url('https://fonts.googleapis.com/css2?family=${fontHeading.replace(/ /g,"+")}:wght@400;600;700;800&family=${fontBody.replace(/ /g,"+")}:wght@400;500;600&display=swap');
:root{--bg:${bgColor};--accent:${accentColor};--text:${textColor};--font-h:'${fontHeading}',sans-serif;--font-b:'${fontBody}',sans-serif;}
*{margin:0;padding:0;box-sizing:border-box}body{background:var(--bg);color:var(--text);font-family:var(--font-b)}
h1,h2,h3,h4{font-family:var(--font-h)}
.btn{display:inline-block;padding:0.75rem 1.75rem;background:var(--accent);color:#fff;border-radius:8px;text-decoration:none;font-weight:600;transition:opacity .2s}
.btn:hover{opacity:.85}.btn-outline{background:transparent;border:2px solid var(--accent);color:var(--accent)}
.container{max-width:1200px;margin:0 auto;padding:0 1.5rem}
section{padding:5rem 0}`;

  const prompts: Record<string, { system: string; user: string }> = {
    homepage: {
      system: `Generate a complete standalone HTML page for the HOMEPAGE of a business website.
Include ONLY these sections in order:
1. Sticky navigation bar — logo (business name), links: About, Services, Contact — plus a "${ctaText}" CTA button. Add a mobile hamburger menu using pure CSS checkbox toggle.
2. Hero section — large bold headline using the tagline, subtitle sentence about the business, two CTA buttons ("${ctaText}" filled + "Learn More" outline), and a visually impressive gradient/shape background.
3. Key Features — 3–4 feature cards with a unicode emoji icon, bold title, short description. Grid layout.
4. Stats bar — 4 impressive numbers (e.g., 500+ clients, 10 years, 98% satisfaction, 1000+ projects).
5. CTA Section — centered headline + "${ctaText}" button + short persuasion copy.

REQUIREMENTS:
- Full HTML file: <!DOCTYPE html>...<head>...<style>...</style>...</head><body>...</body></html>
- Embed all CSS in a single <style> tag. Start with this base CSS:
${BASE_CSS}
- Color scheme: ${colorScheme}. Use var(--bg), var(--accent), var(--text) throughout.
- Responsive (mobile-first). Smooth hover effects. Modern, impressive design.
- Return ONLY the HTML. No markdown. No explanations.`,
      user: `Business: ${businessName}\nTagline: ${tagline || "Excellence in everything we do"}\nDescription: ${description}\nCTA: ${ctaText}`,
    },
    about: {
      system: `Generate HTML sections for the ABOUT US page of a business website.
Include ONLY these HTML sections (no <html>/<head>/<body> wrapper, just <section> tags):
1. About Us section — compelling story of the business, mission statement, what makes it unique. Include a two-column layout with text + a decorative element/image placeholder.
2. How It Works — 3 numbered steps showing the process (Step 1 → Step 2 → Step 3).
3. Stats row — 4 impressive numbers with labels (clients, years, projects, satisfaction).
4. Team section — 3 team member cards with emoji avatar, name, role, short bio.

REQUIREMENTS:
- Return ONLY <section>...</section> HTML blocks. No HTML wrapper tags.
- Use these CSS variables (already defined in base): var(--bg), var(--accent), var(--text), var(--font-h), var(--font-b)
- Responsive grid/flex layout. Visually impressive. Same color scheme: ${colorScheme}.`,
      user: `Business: ${businessName}\nDescription: ${description}\nAudience: ${audience || "general public"}`,
    },
    services: {
      system: `Generate HTML sections for the SERVICES/PRODUCTS page.
Include ONLY these HTML sections (no <html>/<head>/<body> wrapper):
1. Services section — 6 service cards, each with: unicode emoji icon, service name (based on: ${services || "core services"}), short description, "Learn More" link. Use a CSS grid.
2. Pricing section — 3 pricing tiers (Starter / Professional / Enterprise). Middle tier highlighted as "Most Popular" with accent color. Each tier: name, price with /mo, 5 features list, CTA button.
3. Testimonials — 3 customer testimonials. Each: 5 star emojis, quote text, customer name, company/role. Card-based layout.

REQUIREMENTS:
- Return ONLY <section>...</section> HTML blocks. No HTML wrapper tags.
- Use CSS variables: var(--bg), var(--accent), var(--text), var(--font-h), var(--font-b).
- Responsive. Modern card design. Same color scheme: ${colorScheme}.`,
      user: `Business: ${businessName}\nServices: ${services || "professional services"}\nAudience: ${audience || "businesses"}`,
    },
    portfolio: {
      system: `Generate HTML sections for the PORTFOLIO / WORK page of a business website.
Include ONLY these HTML sections (no <html>/<head>/<body> wrapper):
1. Portfolio Hero — bold headline like "Our Work Speaks for Itself", short description, filter buttons (All / Category1 / Category2 / Category3) that use pure CSS :target or checkbox technique to show/hide items.
2. Portfolio Grid — 6 project cards in a masonry-style or responsive 3-column grid. Each card: placeholder image (use a colored div with gradient + emoji + project name overlay), project name, short description, category tag, "View Project" link.
3. Results / Impact section — 4 stat cards (e.g., 50+ Projects, 98% Client Satisfaction, 12 Industries, 5-Star Rating) with large numbers and accent colored icons.
4. Client Logos section — "Trusted by Leading Brands" heading, 6 placeholder logo blocks in a flex row (colored rectangles with brand-like names).
5. CTA Banner — "Ready to Start Your Project?" headline, supporting text, two buttons: "Start a Project" (filled) and "View All Work" (outline).

REQUIREMENTS:
- Return ONLY <section>...</section> HTML blocks. No HTML wrapper tags.
- Use CSS variables: var(--bg), var(--accent), var(--text), var(--font-h), var(--font-b).
- Visually impressive card hover effects (scale + shadow). Modern grid layout. Same color scheme: ${colorScheme}.
- CSS filter tabs must use only CSS (no JS).`,
      user: `Business: ${businessName}\nServices/Work: ${services || "professional services and projects"}\nAudience: ${audience || "potential clients"}`,
    },
    contact: {
      system: `Generate HTML sections for the CONTACT page. This should be the FINAL sections of the website, including the footer.
Include ONLY these HTML sections (no <html>/<head>/<body> wrapper):
1. FAQ section — 5 questions and answers using pure CSS accordion (checkbox + label technique, no JavaScript). Each Q has a ▼ arrow that rotates when expanded.
2. Contact section — left column: contact info (${contactEmail ? `Email: ${contactEmail}` : ""} ${contactPhone ? `Phone: ${contactPhone}` : ""} ${contactAddress ? `Address: ${contactAddress}` : ""}), social links (${socialInstagram ? `Instagram: ${socialInstagram}` : ""} ${socialTwitter ? `Twitter: ${socialTwitter}` : ""} ${socialFacebook ? `Facebook: ${socialFacebook}` : ""}). Right column: contact form with fields: Name, Email, Subject, Message + Submit button.
3. Footer — logo (business name), short tagline, navigation links, social icons (use unicode), copyright line "© ${new Date().getFullYear()} ${businessName}".

REQUIREMENTS:
- Return ONLY <section>...</section> and <footer>...</footer> HTML blocks. No HTML wrapper tags.
- Use CSS variables: var(--bg), var(--accent), var(--text).
- Responsive. The FAQ accordion must work with pure CSS only.`,
      user: `Business: ${businessName}\nTagline: ${tagline}\nContact: ${[contactEmail, contactPhone, contactAddress].filter(Boolean).join(", ") || "to be added"}`,
    },
  };

  const { system, user } = prompts[sectionType] ?? prompts.homepage;

  try {
    const { key, model } = await streamWithFallback(
      [{ role: "system", content: system }, { role: "user", content: user }],
      (text) => send({ content: text }),
      heartbeat,
      6000
    );
    send({ done: true, sectionType, _meta: { key, model } });
    res.end();
  } catch (err: unknown) {
    req.log.error({ err }, `Section generation failed: ${sectionType}`);
    send({ error: err instanceof Error ? err.message : "Generation failed. Please try again." });
    res.end();
  }
});

// ───────────────────────────────────────────────
// POST /api/ai/auto-generate-business-info
// Generates tagline, description, services, audience, CTA text from business type + name
// ───────────────────────────────────────────────
router.post("/ai/auto-generate-business-info", async (req, res) => {
  const { businessType, businessName } = req.body as { businessType: string; businessName: string };
  if (!businessType || !businessName) {
    res.status(400).json({ error: "businessType and businessName are required" });
    return;
  }

  try {
    const { resp } = await chatWithFallback([
      {
        role: "system",
        content: `You are a professional marketing copywriter. Generate compelling website content for a business.
Return ONLY valid JSON (no markdown, no code fences):
{
  "tagline": "Catchy one-line tagline (max 10 words)",
  "description": "2-3 sentence business description highlighting value proposition",
  "services": "Comma-separated list of 4-5 key services/products",
  "audience": "Target audience description (1 sentence)",
  "cta": "Strong call-to-action button text (2-5 words)"
}`,
      },
      {
        role: "user",
        content: `Business type: ${businessType}\nBusiness name: ${businessName}\n\nGenerate professional website content for this business.`,
      },
    ]);

    const raw2 = resp.choices[0]?.message?.content ?? "{}";
    res.json(extractJSON(raw2));
  } catch (err: unknown) {
    req.log.error({ err }, "Business info generation failed");
    res.status(500).json({ error: "Failed to generate business info. Please try again." });
  }
});

// ───────────────────────────────────────────────
// POST /api/ai/instagram-caption  (SSE)
// ───────────────────────────────────────────────
router.post("/ai/instagram-caption", async (req, res) => {
  const { topic = "", niche = "", tone = "engaging", includeEmojis = true } = req.body as Record<string, string | boolean>;
  if (!topic) { res.status(400).json({ error: "topic is required" }); return; }
  res.setHeader("Content-Type", "text/event-stream"); res.setHeader("Cache-Control", "no-cache"); res.setHeader("Connection", "keep-alive"); res.flushHeaders();
  const send = (d: object) => res.write(`data: ${JSON.stringify(d)}\n\n`);
  const hb = () => res.write(": ping\n\n"); hb();
  try {
    const { key, model } = await streamWithFallback([
      { role: "system", content: `You are an Instagram expert. Write an INSTAGRAM CAPTION that:\n1. Opens with a powerful hook (first line grabs attention)\n2. Tells a story or shares value in 3-5 sentences\n3. Ends with a clear call-to-action\n4. Includes exactly 25 relevant hashtags in a separate block below the caption (format: #hashtag #hashtag...)\n${includeEmojis ? "5. Use emojis throughout naturally" : "5. No emojis"}\nTone: ${tone}${niche ? `\nNiche: ${niche}` : ""}` },
      { role: "user", content: `Write an Instagram caption for: ${topic}` },
    ], (c) => send({ content: c }), hb, 2048);
    send({ done: true, _meta: { key, model } }); res.end();
  } catch (err) { send({ error: err instanceof Error ? err.message : "Failed" }); res.end(); }
});

// ───────────────────────────────────────────────
// POST /api/ai/generate-hooks  (JSON)
// ───────────────────────────────────────────────
router.post("/ai/generate-hooks", async (req, res) => {
  const { topic = "", contentType = "post" } = req.body as Record<string, string>;
  if (!topic) { res.status(400).json({ error: "topic is required" }); return; }
  try {
    const { resp } = await chatWithFallback([
      { role: "system", content: `Generate 6 different opening hooks for social media content. Each hook uses a different technique.
Return ONLY valid JSON: { "hooks": [{ "type": "Question Hook", "text": "..." }, { "type": "Stat Hook", "text": "..." }, { "type": "Story Hook", "text": "..." }, { "type": "Controversial Hook", "text": "..." }, { "type": "How-To Hook", "text": "..." }, { "type": "List Hook", "text": "..." }] }` },
      { role: "user", content: `Topic: ${topic}\nContent type: ${contentType}` },
    ]);
    const raw3 = resp.choices[0]?.message?.content ?? "{}";
    res.json(extractJSON(raw3));
  } catch { res.status(500).json({ error: "Failed to generate hooks" }); }
});

// ───────────────────────────────────────────────
// POST /api/ai/generate-reply  (SSE)
// ───────────────────────────────────────────────
router.post("/ai/generate-reply", async (req, res) => {
  const { platform = "Instagram", originalPost = "", replyTone = "friendly" } = req.body as Record<string, string>;
  if (!originalPost) { res.status(400).json({ error: "originalPost is required" }); return; }
  res.setHeader("Content-Type", "text/event-stream"); res.setHeader("Cache-Control", "no-cache"); res.setHeader("Connection", "keep-alive"); res.flushHeaders();
  const send = (d: object) => res.write(`data: ${JSON.stringify(d)}\n\n`);
  const hb = () => res.write(": ping\n\n"); hb();
  try {
    const { key, model } = await streamWithFallback([
      { role: "system", content: `You are a social media community manager. Write a ${replyTone}, professional, and engaging reply for a ${platform} comment or message. The reply should: acknowledge the person, add value, encourage further engagement, stay brand-appropriate, be 1-3 sentences max.` },
      { role: "user", content: `Reply to this ${platform} comment/message:\n"${originalPost}"` },
    ], (c) => send({ content: c }), hb, 512);
    send({ done: true, _meta: { key, model } }); res.end();
  } catch (err) { send({ error: err instanceof Error ? err.message : "Failed" }); res.end(); }
});

// ───────────────────────────────────────────────
// POST /api/ai/reel-script  (SSE)
// ───────────────────────────────────────────────
router.post("/ai/reel-script", async (req, res) => {
  const { topic = "", duration = "30", tone = "engaging", platform = "Instagram" } = req.body as Record<string, string>;
  if (!topic) { res.status(400).json({ error: "topic is required" }); return; }
  res.setHeader("Content-Type", "text/event-stream"); res.setHeader("Cache-Control", "no-cache"); res.setHeader("Connection", "keep-alive"); res.flushHeaders();
  const send = (d: object) => res.write(`data: ${JSON.stringify(d)}\n\n`);
  const hb = () => res.write(": ping\n\n"); hb();
  try {
    const { key, model } = await streamWithFallback([
      { role: "system", content: `You are a viral ${platform} Reels/TikTok scriptwriter. Write a ${duration}-second script for a short-form video. Format it as:
**HOOK (0-3 sec):** [First line — must stop scroll instantly]
**SCENE 1 (3-8 sec):** [Visual + voiceover text]
**SCENE 2 (8-15 sec):** [Visual + voiceover text]
...continue until ${duration}s...
**CALL TO ACTION (last 3 sec):** [What to do next]
**CAPTION:** [2-sentence caption]
**SUGGESTED HASHTAGS:** [5-7 hashtags]
Tone: ${tone}. Keep each scene tight — this is SHORT-FORM video.` },
      { role: "user", content: `Write a ${duration}-second ${platform} Reel script about: ${topic}` },
    ], (c) => send({ content: c }), hb, 1500);
    send({ done: true, _meta: { key, model } }); res.end();
  } catch (err) { send({ error: err instanceof Error ? err.message : "Failed" }); res.end(); }
});

// ───────────────────────────────────────────────
// POST /api/ai/hashtag-suggestions  (JSON)
// ───────────────────────────────────────────────
router.post("/ai/hashtag-suggestions", async (req, res) => {
  const { topic = "", platform = "Instagram", niche = "" } = req.body as Record<string, string>;
  if (!topic) { res.status(400).json({ error: "topic is required" }); return; }
  try {
    const { resp } = await chatWithFallback([
      { role: "system", content: `Generate hashtag sets for ${platform} posts. Mix of high-volume (1M+), medium (100k-1M), and niche (<100k) hashtags for best reach.
Return ONLY valid JSON: { "sets": [ { "name": "High Volume", "tags": ["tag1","tag2",...] }, { "name": "Niche Targeted", "tags": [...] }, { "name": "Trending", "tags": [...] } ] }
Each set: 10-15 hashtags. No # prefix in the tags array.` },
      { role: "user", content: `Topic: ${topic}\nPlatform: ${platform}${niche ? `\nNiche: ${niche}` : ""}` },
    ]);
    const raw4 = resp.choices[0]?.message?.content ?? "{}";
    res.json(extractJSON(raw4));
  } catch { res.status(500).json({ error: "Failed to generate hashtags" }); }
});

// ───────────────────────────────────────────────
// POST /api/ai/content-calendar  (JSON)
// ───────────────────────────────────────────────
router.post("/ai/content-calendar", async (req, res) => {
  const { businessName = "", industry = "", postsPerWeek = "5", platforms = "Instagram,LinkedIn,Twitter" } = req.body as Record<string, string>;
  if (!businessName) { res.status(400).json({ error: "businessName is required" }); return; }
  try {
    const { resp } = await chatWithFallback([
      { role: "system", content: `Generate a 4-week social media content calendar. Return ONLY valid JSON:
{ "weeks": [ { "week": 1, "theme": "Brand Awareness", "posts": [ { "day": "Monday", "platform": "Instagram", "type": "Educational", "topic": "...", "hook": "...", "hashtags": ["tag1","tag2","tag3"] } ] } ] }
- ${postsPerWeek} posts per week across these platforms: ${platforms}
- Vary content types: Educational, Promotional, Engagement, Behind-scenes, Testimonial, Trending
- Each week has a theme
- Hooks should be scroll-stopping first sentences
- 3-5 hashtags per post idea` },
      { role: "user", content: `Business: ${businessName}\nIndustry: ${industry || "general"}\nGenerate 4-week content calendar.` },
    ], undefined, undefined, 3000);
    const raw5 = resp.choices[0]?.message?.content ?? "{}";
    res.json(extractJSON(raw5));
  } catch { res.status(500).json({ error: "Failed to generate calendar" }); }
});

// ───────────────────────────────────────────────
// POST /api/ai/repurpose-post  (SSE)
// ───────────────────────────────────────────────
router.post("/ai/repurpose-post", async (req, res) => {
  const { originalPost = "", fromPlatform = "Instagram", toPlatform = "LinkedIn" } = req.body as Record<string, string>;
  if (!originalPost) { res.status(400).json({ error: "originalPost is required" }); return; }
  res.setHeader("Content-Type", "text/event-stream"); res.setHeader("Cache-Control", "no-cache"); res.setHeader("Connection", "keep-alive"); res.flushHeaders();
  const send = (d: object) => res.write(`data: ${JSON.stringify(d)}\n\n`);
  const hb = () => res.write(": ping\n\n"); hb();
  try {
    const { key, model } = await streamWithFallback([
      { role: "system", content: `You are a social media expert. Repurpose content from ${fromPlatform} to ${toPlatform}. Adapt the tone, length, format, hashtags, and style to fit ${toPlatform}'s culture and algorithm perfectly. Don't just shorten/lengthen — truly rewrite it for the platform.` },
      { role: "user", content: `Repurpose this ${fromPlatform} post for ${toPlatform}:\n\n"${originalPost}"` },
    ], (c) => send({ content: c }), hb, 1024);
    send({ done: true, _meta: { key, model } }); res.end();
  } catch (err) { send({ error: err instanceof Error ? err.message : "Failed" }); res.end(); }
});

// ───────────────────────────────────────────────
// POST /api/ai/tiktok-caption  (SSE)
// ───────────────────────────────────────────────
router.post("/ai/tiktok-caption", async (req, res) => {
  const { topic = "", tone = "trendy" } = req.body as Record<string, string>;
  if (!topic) { res.status(400).json({ error: "topic is required" }); return; }
  res.setHeader("Content-Type", "text/event-stream"); res.setHeader("Cache-Control", "no-cache"); res.setHeader("Connection", "keep-alive"); res.flushHeaders();
  const send = (d: object) => res.write(`data: ${JSON.stringify(d)}\n\n`);
  const hb = () => res.write(": ping\n\n"); hb();
  try {
    const { key, model } = await streamWithFallback([
      { role: "system", content: `You are a TikTok expert. Write a ${tone} TikTok caption that:\n1. Starts with a punchy hook (3-5 words max)\n2. Is under 150 characters\n3. Includes 3-5 trending hashtags (mix of broad + niche)\n4. Includes relevant emojis\n5. Creates FOMO or curiosity\n\nAlso suggest: a trending sound type, best posting time, and one engagement tip.` },
      { role: "user", content: `Write a TikTok caption for: ${topic}` },
    ], (c) => send({ content: c }), hb, 512);
    send({ done: true, _meta: { key, model } }); res.end();
  } catch (err) { send({ error: err instanceof Error ? err.message : "Failed" }); res.end(); }
});

// ───────────────────────────────────────────────
// POST /api/ai/pinterest-post  (SSE)
// ───────────────────────────────────────────────
router.post("/ai/pinterest-post", async (req, res) => {
  const { topic = "", niche = "" } = req.body as Record<string, string>;
  if (!topic) { res.status(400).json({ error: "topic is required" }); return; }
  res.setHeader("Content-Type", "text/event-stream"); res.setHeader("Cache-Control", "no-cache"); res.setHeader("Connection", "keep-alive"); res.flushHeaders();
  const send = (d: object) => res.write(`data: ${JSON.stringify(d)}\n\n`);
  const hb = () => res.write(": ping\n\n"); hb();
  try {
    const { key, model } = await streamWithFallback([
      { role: "system", content: `You are a Pinterest SEO expert. Create Pinterest content that:\n1. Pin Title: Keyword-rich, 40-60 chars, descriptive and aspirational\n2. Pin Description: 200-500 chars, keyword-rich, tells a story, includes a CTA\n3. Board suggestion: Best board name/category\n4. SEO keywords: 5 keywords to include\n5. 5-10 relevant hashtags\n${niche ? `Niche: ${niche}` : ""}` },
      { role: "user", content: `Create Pinterest content for: ${topic}` },
    ], (c) => send({ content: c }), hb, 800);
    send({ done: true, _meta: { key, model } }); res.end();
  } catch (err) { send({ error: err instanceof Error ? err.message : "Failed" }); res.end(); }
});

// POST /api/ai/generate-ad-script  (JSON, not SSE)
// ───────────────────────────────────────────────
router.post("/ai/generate-ad-script", async (req, res) => {
  const {
    brandName = "", productName = "", keyMessage = "",
    cta = "", platform = "Instagram", objective = "product", format = "image",
  } = req.body as Record<string, string>;
  if (!brandName || !keyMessage) {
    res.status(400).json({ error: "brandName and keyMessage are required" }); return;
  }

  const buildFallback = () => ({
    headline: `${brandName} — ${keyMessage.slice(0, 30)}`,
    tagline: `Discover the best of ${productName || brandName} today`,
    caption: `✨ Introducing ${productName || brandName}! ${keyMessage} Perfect for anyone looking to level up. Don't miss out — ${cta || "learn more"} now. 🚀`,
    voiceover: `Introducing ${productName || brandName}. ${keyMessage}. ${cta || "Learn more"} today and see the difference for yourself.`,
    hashtags: [`#${brandName.replace(/\s+/g, "")}`, `#${platform}`, "#ad", "#marketing", "#business", "#growth", "#content", "#brand"],
    features: [`✅ ${keyMessage}`, `🎯 Built for ${platform}`, `🚀 ${cta || "Start today"}`],
    stats: [{ label: "Platform", value: platform }, { label: "Objective", value: objective }],
  });

  const messages = [
    {
      role: "system" as const,
      content: "You are an expert advertising copywriter. Respond with ONLY a valid JSON object. No markdown, no code fences, no explanation, no preamble — just the raw JSON.",
    },
    {
      role: "user" as const,
      content: `Write a complete ${platform} ad script for:
Brand: ${brandName}
Product: ${productName || brandName}
Key Message: ${keyMessage}
CTA: ${cta || "Learn More"}
Objective: ${objective}
Format: ${format}

Respond with ONLY this exact JSON structure (no other text):
{"headline":"5-8 word punchy headline","tagline":"10-15 word supporting tagline","caption":"Platform-native caption with emojis 60-100 words","voiceover":"30-second voiceover script natural speech","hashtags":["#tag1","#tag2","#tag3","#tag4","#tag5","#tag6"],"features":["✅ Key benefit 1","🎯 Key benefit 2","🚀 Key benefit 3"],"stats":[{"label":"Reach","value":"10M+"},{"label":"Engagement","value":"4.2%"}]}`,
    },
  ];

  let lastError = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    let fullText = "";
    try {
      await streamWithFallback(messages, (c) => { fullText += c; }, undefined, 2000);
      const parsed = extractJSON(fullText) as Record<string, unknown>;
      // Validate essential fields exist
      if (!parsed.headline || !parsed.caption) throw new Error("Missing required fields");
      res.json({ ok: true, script: parsed });
      return;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      // Short delay before retry
      if (attempt < 2) await new Promise(r => setTimeout(r, 600));
    }
  }

  // All retries failed — return a safe fallback so the UI doesn't block
  res.json({ ok: true, script: buildFallback(), _fallback: true });
});

// ── POST /api/ai/tool-generate ── Generic streaming tool endpoint ──
router.post("/ai/tool-generate", async (req, res) => {
  const { systemPrompt, userPrompt, plan = "free" } = req.body as { systemPrompt: string; userPrompt: string; plan?: string };
  if (!systemPrompt || !userPrompt) { res.status(400).json({ error: "systemPrompt and userPrompt required" }); return; }

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const isPaidTool = plan !== "free";

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const heartbeat = () => res.write(": ping\n\n");
  heartbeat();

  try {
    if (isPaidTool) {
      await streamWithClaude(messages, (chunk) => { res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`); }, heartbeat, CLAUDE_HAIKU, 8000);
    } else {
      await streamWithFallback(messages, (chunk) => { res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`); }, heartbeat, 6000);
    }
    res.write("data: " + JSON.stringify({ done: true }) + "\n\n");
  } catch {
    res.write("data: " + JSON.stringify({ error: "Generation failed. Please try again." }) + "\n\n");
  } finally {
    res.end();
  }
});

// ── POST /api/ai/generate-email ─────────────────────────────
router.post("/ai/generate-email", async (req, res) => {
  const { purpose, brand = "", audience = "", tone = "professional", details = "" } = req.body as {
    purpose: string; brand?: string; audience?: string; tone?: string; details?: string;
  };
  if (!purpose) { res.status(400).json({ error: "purpose is required" }); return; }

  const messages: ChatMessage[] = [
    { role: "system", content: "You are an expert email copywriter. Respond ONLY with raw JSON — no markdown, no code fences." },
    { role: "user", content: `Write a complete marketing email.
Purpose: ${purpose}
Brand/Company: ${brand || "the company"}
Target audience: ${audience || "general audience"}
Tone: ${tone}
Extra details: ${details}

RESPOND ONLY WITH THIS JSON:
{"subjectLine":"compelling subject line (under 60 chars)","previewText":"preview text (under 90 chars)","greeting":"Dear [Name], / Hi [First Name],","body":"full email body (3-5 paragraphs, formatted with \\n\\n between paragraphs)","cta":"call-to-action button text","ctaUrl":"#","signOff":"professional sign-off line","ps":"optional P.S. line or empty string"}` },
  ];

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      let fullText = "";
      await streamWithFallback(messages, c => { fullText += c; }, undefined, 1500);
      const parsed = extractJSON(fullText) as Record<string, string>;
      if (parsed?.subjectLine && parsed?.body) { res.json(parsed); return; }
    } catch { if (attempt < 2) await new Promise(r => setTimeout(r, 500)); }
  }
  res.json({ subjectLine: `About: ${purpose}`, previewText: "We have something for you", greeting: "Hi there,", body: `We wanted to reach out regarding ${purpose}.\n\nPlease don't hesitate to contact us if you have any questions.\n\nWe look forward to hearing from you.`, cta: "Learn More", ctaUrl: "#", signOff: "Best regards,\nThe Team", ps: "" });
});

// ── POST /api/ai/generate-text ──────────────────────────────
router.post("/ai/generate-text", async (req, res) => {
  const { type, topic, audience = "", tone = "professional", length = "medium", details = "" } = req.body as {
    type: string; topic: string; audience?: string; tone?: string; length?: string; details?: string;
  };
  if (!type || !topic) { res.status(400).json({ error: "type and topic required" }); return; }

  const wordCount: Record<string, number> = { short: 80, medium: 200, long: 400 };
  const targetWords = wordCount[length] ?? 200;

  const typeInstructions: Record<string, string> = {
    "headline": "Write 5 different headlines/titles. Each on a new line. No numbering.",
    "product-description": `Write a product description (~${targetWords} words). Hook → features → benefits → CTA.`,
    "tagline": "Write 6 short brand taglines (under 10 words each). Each on a new line.",
    "ad-copy": `Write ad copy (~${targetWords} words). Attention → Interest → Desire → Action format.`,
    "website-copy": `Write website homepage copy (~${targetWords} words). Hero headline, subheading, value props, CTA.`,
    "bio": `Write a professional bio (~${targetWords} words). Third person, achievements, personality.`,
    "pitch": `Write an elevator pitch (~${targetWords} words). Problem → Solution → Unique value → CTA.`,
    "press-release": `Write a press release (~${targetWords} words). Headline, dateline, body, boilerplate.`,
  };

  const messages: ChatMessage[] = [
    { role: "system", content: "You are an expert copywriter. Write compelling, conversion-focused copy." },
    { role: "user", content: `${typeInstructions[type] ?? `Write ${type} copy (~${targetWords} words).`}
Topic/Product: ${topic}
Audience: ${audience || "general audience"}
Tone: ${tone}
${details ? `Additional context: ${details}` : ""}

Respond with ONLY the text — no intro, no explanation, no metadata.` },
  ];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    await streamWithFallback(messages, (chunk) => {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }, res, 1200);
    res.write("data: " + JSON.stringify({ done: true }) + "\n\n");
  } catch (err) {
    res.write("data: " + JSON.stringify({ error: "Generation failed" }) + "\n\n");
  } finally {
    res.end();
  }
});

// ── Blog: Publish to WordPress ─────────────────────────────
router.post("/blog/publish-wordpress", async (req, res) => {
  const { siteUrl, username, appPassword, title, htmlContent, status = "draft" } = req.body;
  if (!siteUrl || !username || !appPassword || !title) {
    return res.status(400).json({ error: "Missing required fields: siteUrl, username, appPassword, title" });
  }
  try {
    const base = siteUrl.replace(/\/$/, "");
    const creds = Buffer.from(`${username}:${appPassword}`).toString("base64");
    const wpRes = await fetch(`${base}/wp-json/wp/v2/posts`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${creds}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, content: htmlContent, status }),
    });
    const data = await wpRes.json() as any;
    if (!wpRes.ok) {
      return res.status(wpRes.status).json({ error: data?.message ?? "WordPress API error", code: data?.code });
    }
    return res.json({ success: true, postId: data.id, postUrl: data.link, editUrl: `${base}/wp-admin/post.php?post=${data.id}&action=edit`, status: data.status });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Network error reaching WordPress site" });
  }
});

// ── Blog: Publish to Ghost ─────────────────────────────────
router.post("/blog/publish-ghost", async (req, res) => {
  const { siteUrl, adminApiKey, title, htmlContent, status = "draft" } = req.body;
  if (!siteUrl || !adminApiKey || !title) {
    return res.status(400).json({ error: "Missing required fields: siteUrl, adminApiKey, title" });
  }
  try {
    const [id, secret] = adminApiKey.split(":");
    if (!id || !secret) return res.status(400).json({ error: "Admin API Key must be in format id:secret" });
    const crypto = await import("crypto");
    const iat = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT", kid: id })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ iat, exp: iat + 300, aud: "/admin/" })).toString("base64url");
    const signature = crypto.createHmac("sha256", Buffer.from(secret, "hex")).update(`${header}.${payload}`).digest("base64url");
    const jwt = `${header}.${payload}.${signature}`;
    const base = siteUrl.replace(/\/$/, "");
    const ghostRes = await fetch(`${base}/ghost/api/admin/posts/`, {
      method: "POST",
      headers: { "Authorization": `Ghost ${jwt}`, "Content-Type": "application/json", "Accept-Version": "v5.0" },
      body: JSON.stringify({ posts: [{ title, html: htmlContent, status, source: "html" }] }),
    });
    const data = await ghostRes.json() as any;
    if (!ghostRes.ok) {
      const msg = data?.errors?.[0]?.message ?? "Ghost API error";
      return res.status(ghostRes.status).json({ error: msg });
    }
    const post = data.posts?.[0];
    return res.json({ success: true, postId: post?.id, postUrl: post?.url, status: post?.status });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Network error reaching Ghost site" });
  }
});

// ── Blog: Publish to Dev.to ────────────────────────────────
router.post("/blog/publish-devto", async (req, res) => {
  const { apiKey, title, bodyMarkdown, tags = [], published = false } = req.body;
  if (!apiKey || !title || !bodyMarkdown) {
    return res.status(400).json({ error: "Missing required fields: apiKey, title, bodyMarkdown" });
  }
  try {
    const devRes = await fetch("https://dev.to/api/articles", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ article: { title, body_markdown: bodyMarkdown, published, tags: tags.slice(0, 4) } }),
    });
    const data = await devRes.json() as any;
    if (!devRes.ok) {
      return res.status(devRes.status).json({ error: data?.error ?? "Dev.to API error" });
    }
    return res.json({ success: true, postId: data.id, postUrl: data.url, status: published ? "published" : "draft" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Network error reaching Dev.to" });
  }
});

// ── Blog: Publish to Hashnode ──────────────────────────────
router.post("/blog/publish-hashnode", async (req, res) => {
  const { apiKey, publicationId, title, contentMarkdown, tags = [], published = false } = req.body;
  if (!apiKey || !publicationId || !title || !contentMarkdown) {
    return res.status(400).json({ error: "Missing required fields: apiKey, publicationId, title, contentMarkdown" });
  }
  try {
    const mutation = `
      mutation PublishPost($input: PublishPostInput!) {
        publishPost(input: $input) {
          post { id url title }
        }
      }
    `;
    const input: Record<string,unknown> = {
      title,
      publicationId,
      contentMarkdown,
      tags: tags.map((t: string) => ({ name: t, slug: t.toLowerCase().replace(/\s+/g,"-") })),
    };
    if (!published) Object.assign(input, { isDraft: true });
    const hnRes = await fetch("https://gql.hashnode.com/", {
      method: "POST",
      headers: { "Authorization": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ query: mutation, variables: { input } }),
    });
    const data = await hnRes.json() as any;
    if (data?.errors?.length) {
      return res.status(400).json({ error: data.errors[0].message });
    }
    const post = data?.data?.publishPost?.post;
    return res.json({ success: true, postId: post?.id, postUrl: post?.url });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Network error reaching Hashnode" });
  }
});

// ── Edit Website with AI ──────────────────────────────────────────────────────
router.post("/ai/edit-website", async (req, res) => {
  const { currentHtml, instruction } = req.body as { currentHtml: string; instruction: string };
  if (!currentHtml || !instruction) return res.status(400).json({ error: "currentHtml and instruction are required" });

  // Truncate very large HTML to avoid token limit issues (keep ~40k chars)
  const htmlSnippet = currentHtml.length > 40000
    ? currentHtml.slice(0, 40000) + "\n<!-- ...truncated for brevity -->"
    : currentHtml;

  try {
    const { resp } = await chatWithFallback([
      {
        role: "system",
        content: `You are a professional web developer. The user will give you a full HTML website and an edit instruction. Apply the edit precisely and return ONLY the complete updated HTML document — no explanation, no markdown fences, no commentary. Return the full <!DOCTYPE html>...</html> document.`,
      },
      {
        role: "user",
        content: `EDIT INSTRUCTION: ${instruction}\n\nCURRENT HTML:\n${htmlSnippet}`,
      },
    ]);
    let html = resp.choices[0]?.message?.content?.trim() ?? "";
    // Strip markdown fences if model wrapped it
    html = html.replace(/^```html?\s*/i, "").replace(/```\s*$/, "").trim();
    if (!html.toLowerCase().startsWith("<!doctype") && !html.toLowerCase().startsWith("<html")) {
      return res.status(500).json({ error: "AI returned unexpected format. Please try again." });
    }
    return res.json({ html });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "AI edit failed" });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// YT GROWSTUFFS — YouTube Growth Tools
// ══════════════════════════════════════════════════════════════════════════════

// ── YT: Daily Ideas ───────────────────────────────────────────────────────────
router.post("/ai/yt-ideas", async (req, res) => {
  const { niche, channel } = req.body as { niche: string; channel?: string };
  if (!niche) return res.status(400).json({ error: "niche is required" });
  try {
    const { resp } = await chatWithFallback([
      { role: "system", content: `You are a YouTube growth expert. Generate 8 high-potential video ideas for the given niche. Return ONLY valid JSON (no markdown fences):
{"ideas":[{"title":"string","viewPrediction":"Very High|High|Medium","why":"string (1-2 sentences on why this will perform well)","hook":"string (a punchy 15-word opening hook for the video)"}]}` },
      { role: "user", content: `Niche: ${niche}${channel ? `\nChannel: ${channel}` : ""}\n\nGenerate 8 trending, high-potential video ideas for today.` },
    ]);
    const data = extractJSON(resp.choices[0]?.message?.content?.trim() ?? "{}");
    return res.json(data);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// ── YT: Title Generator ───────────────────────────────────────────────────────
router.post("/ai/yt-titles", async (req, res) => {
  const { topic, keywords, style } = req.body as { topic: string; keywords?: string; style?: string };
  if (!topic) return res.status(400).json({ error: "topic is required" });
  try {
    const { resp } = await chatWithFallback([
      { role: "system", content: `You are a YouTube title optimization expert. Generate 8 high-CTR title variations. Return ONLY valid JSON (no markdown fences):
{"titles":[{"title":"string","style":"Listicle|How-to|Shocking|Question|Story|Mixed","ctrReason":"string (why this title gets clicks)","hook":"string"}]}` },
      { role: "user", content: `Topic: ${topic}\nKeywords: ${keywords || "N/A"}\nPreferred style: ${style || "mixed"}\n\nGenerate 8 compelling, click-worthy YouTube titles. Mix different emotional triggers and formats.` },
    ]);
    const data = extractJSON(resp.choices[0]?.message?.content?.trim() ?? "{}");
    return res.json(data);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// ── YT: Script Writer ─────────────────────────────────────────────────────────
router.post("/ai/yt-script", async (req, res) => {
  const { title, duration, style, keyPoints } = req.body as { title: string; duration?: string; style?: string; keyPoints?: string };
  if (!title) return res.status(400).json({ error: "title is required" });
  try {
    const { resp } = await chatWithFallback([
      { role: "system", content: `You are an expert YouTube scriptwriter. Write a complete, engaging video script. Return ONLY valid JSON (no markdown fences):
{"script":{"hook":"string (attention-grabbing first 30 seconds — pattern interrupt or bold claim)","intro":"string (introduce yourself/topic, preview what viewer will learn)","sections":[{"heading":"string","content":"string (2-4 paragraphs of script content for this section)"}],"outro":"string (wrap up, thank viewers, tease next video)","cta":"string (call to action — subscribe, like, comment prompt)"}}` },
      { role: "user", content: `Video Title: ${title}\nDuration: ${duration || "10"} minutes\nStyle: ${style || "educational"}\nKey points to cover: ${keyPoints || "N/A"}\n\nWrite a complete, engaging script. The hook must make viewers stay. Include natural transitions and conversational language.` },
    ]);
    const data = extractJSON(resp.choices[0]?.message?.content?.trim() ?? "{}");
    return res.json(data);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// ── YT: Description AI ────────────────────────────────────────────────────────
router.post("/ai/yt-description", async (req, res) => {
  const { videoTitle, channelName, keywords, socials } = req.body as { videoTitle: string; channelName?: string; keywords?: string; socials?: string };
  if (!videoTitle) return res.status(400).json({ error: "videoTitle is required" });
  try {
    const { resp } = await chatWithFallback([
      { role: "system", content: `You are a YouTube SEO expert. Write a complete, SEO-optimized video description and generate hashtags. Return ONLY valid JSON (no markdown fences):
{"description":"string (full description: opening with keyword in first 2 lines, summary, timestamps template like '0:00 Intro\\n1:30 Section 1', social links, outro with subscribe CTA)","hashtags":["tag1","tag2",...up to 15 tags without # prefix]}` },
      { role: "user", content: `Video Title: ${videoTitle}\nChannel: ${channelName || "N/A"}\nKeywords: ${keywords || "N/A"}\nSocial Links: ${socials || "N/A"}\n\nWrite an SEO-optimized description. Include the main keyword in the first line. Add a timestamps section, relevant links, and a subscribe CTA.` },
    ]);
    const data = extractJSON(resp.choices[0]?.message?.content?.trim() ?? "{}");
    return res.json(data);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// ── YT: Keyword Research ──────────────────────────────────────────────────────
router.post("/ai/yt-keywords", async (req, res) => {
  const { topic, niche } = req.body as { topic: string; niche?: string };
  if (!topic) return res.status(400).json({ error: "topic is required" });
  try {
    const { resp } = await chatWithFallback([
      { role: "system", content: `You are a YouTube keyword research specialist. Analyze keywords and return a realistic competitive assessment. Return ONLY valid JSON (no markdown fences):
{"keywords":[{"keyword":"string","volume":"High|Medium|Low","competition":number(1-10 where 10=hardest),"score":number(0-100 opportunity score),"trend":"Rising|Stable|Falling","type":"Seed|Long-tail|Question|Branded"}]}
Generate exactly 12 keywords including the seed, related terms, long-tail variations, and question-based keywords.` },
      { role: "user", content: `Seed keyword: ${topic}\nNiche: ${niche || "General"}\n\nResearch 12 keywords with realistic volume/competition estimates for YouTube. Include a mix of short-tail and long-tail.` },
    ]);
    const data = extractJSON(resp.choices[0]?.message?.content?.trim() ?? "{}");
    return res.json(data);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// ── YT: Tag Generator ─────────────────────────────────────────────────────────
router.post("/ai/yt-tags", async (req, res) => {
  const { videoTitle, niche } = req.body as { videoTitle: string; niche?: string };
  if (!videoTitle) return res.status(400).json({ error: "videoTitle is required" });
  try {
    const { resp } = await chatWithFallback([
      { role: "system", content: `You are a YouTube SEO expert. Generate an optimized tag set. Return ONLY valid JSON (no markdown fences):
{"tags":{"primary":["tag1",...8 tags],"secondary":["tag1",...10 tags],"longtail":["tag1",...12 tags]}}
Primary: exact match & close variants. Secondary: related topics. Long-tail: full phrases 3-5 words.` },
      { role: "user", content: `Video Title: ${videoTitle}\nNiche: ${niche || "General"}\n\nGenerate 30 optimized YouTube tags covering primary, secondary, and long-tail variations.` },
    ]);
    const data = extractJSON(resp.choices[0]?.message?.content?.trim() ?? "{}");
    return res.json(data);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// ── YT: Thumbnail Ideas ───────────────────────────────────────────────────────
router.post("/ai/yt-thumbnail", async (req, res) => {
  const { videoTitle, style, mood } = req.body as { videoTitle: string; style?: string; mood?: string };
  if (!videoTitle) return res.status(400).json({ error: "videoTitle is required" });
  try {
    const { resp } = await chatWithFallback([
      { role: "system", content: `You are a YouTube thumbnail design expert who understands click-through psychology. Return ONLY valid JSON (no markdown fences):
{"concepts":[{"concept":"string (detailed layout and visual description)","colors":["#hex1","#hex2","#hex3"],"textOverlay":"string (short punchy text to overlay, max 5 words)","mainElement":"string (main visual subject/element)","whyItWorks":"string (psychology/reason why this gets clicks)","emotion":"string (primary emotion triggered)"}]}
Generate exactly 3 distinct thumbnail concepts.` },
      { role: "user", content: `Video Title: ${videoTitle}\nStyle: ${style || "dramatic"}\nMood: ${mood || "exciting"}\n\nCreate 3 distinct, high-CTR thumbnail concepts. Each must be visually different and use proven click psychology.` },
    ]);
    const data = extractJSON(resp.choices[0]?.message?.content?.trim() ?? "{}");
    return res.json(data);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// ── YT: Channel Audit ─────────────────────────────────────────────────────────
router.post("/ai/yt-audit", async (req, res) => {
  const { channelName, niche, subscribers, avgViews, frequency, age } = req.body as Record<string, string>;
  if (!niche) return res.status(400).json({ error: "niche is required" });
  try {
    const { resp } = await chatWithFallback([
      { role: "system", content: `You are a YouTube channel growth consultant. Perform a SWOT analysis and create an action plan. Return ONLY valid JSON (no markdown fences):
{"audit":{"strengths":["string",...3-4 items],"weaknesses":["string",...3-4 items],"opportunities":["string",...3-4 items],"threats":["string",...2-3 items],"actionPlan":[{"step":number,"action":"string","impact":"string (expected outcome)"},...5 steps]}}` },
      { role: "user", content: `Channel: ${channelName || "Unknown"}\nNiche: ${niche}\nSubscribers: ${subscribers || "Unknown"}\nAvg Views: ${avgViews || "Unknown"}\nUpload Frequency: ${frequency || "weekly"}\nChannel Age: ${age || "Unknown"}\n\nConduct a thorough SWOT analysis and give a 5-step action plan to accelerate growth.` },
    ]);
    const data = extractJSON(resp.choices[0]?.message?.content?.trim() ?? "{}");
    return res.json(data);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// ── YT: Best Time to Post ─────────────────────────────────────────────────────
router.post("/ai/yt-besttime", async (req, res) => {
  const { niche, audience, timezone } = req.body as { niche: string; audience?: string; timezone?: string };
  if (!niche) return res.status(400).json({ error: "niche is required" });
  try {
    const { resp } = await chatWithFallback([
      { role: "system", content: `You are a YouTube analytics expert. Recommend optimal publishing times based on niche and audience data. Return ONLY valid JSON (no markdown fences):
{"bestTimes":[{"day":"string","time":"string (e.g. 3:00 PM)","timezone":"string","reason":"string","score":number(0-100)},...5 time slots ranked best first],"generalTips":["string",...4 tips]}` },
      { role: "user", content: `Niche: ${niche}\nTarget Audience: ${audience || "General"}\nTimezone: ${timezone || "EST"}\n\nRecommend the 5 best times to publish YouTube videos for maximum initial views and algorithm boost.` },
    ]);
    const data = extractJSON(resp.choices[0]?.message?.content?.trim() ?? "{}");
    return res.json(data);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// ── YT: Trend Finder ─────────────────────────────────────────────────────────
router.post("/ai/yt-trends", async (req, res) => {
  const { niche, keywords } = req.body as { niche: string; keywords?: string };
  if (!niche) return res.status(400).json({ error: "niche is required" });
  try {
    const { resp } = await chatWithFallback([
      { role: "system", content: `You are a YouTube trend analyst. Identify 6 trending topics that creators should make videos about right now. Return ONLY valid JSON (no markdown fences):
{"trends":[{"topic":"string (specific trend, not vague)","momentum":"Exploding|Rising|Building","why":"string (why this is trending)","videoAngle":"string (specific angle/hook to take on this topic)","urgency":"string (e.g. 'Act this week', 'Next 30 days', 'Evergreen')"}]}` },
      { role: "user", content: `Niche: ${niche}\nFocus keywords: ${keywords || "N/A"}\n\nIdentify 6 currently trending topics in this niche that creators should make videos about now. Be specific, not generic.` },
    ]);
    const data = extractJSON(resp.choices[0]?.message?.content?.trim() ?? "{}");
    return res.json(data);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// ── YT: Competitor Intel ──────────────────────────────────────────────────────
router.post("/ai/yt-competitor", async (req, res) => {
  const { channelDesc, niche, myChannel } = req.body as { channelDesc: string; niche: string; myChannel?: string };
  if (!channelDesc || !niche) return res.status(400).json({ error: "channelDesc and niche are required" });
  try {
    const { resp } = await chatWithFallback([
      { role: "system", content: `You are a YouTube competitive intelligence analyst. Analyze the competitor and find opportunities. Return ONLY valid JSON (no markdown fences):
{"intel":{"whatTheyDoWell":["string",...4 items],"contentGaps":["string",...4 items],"howToDifferentiate":["string",...4 items],"topicsToCover":[{"topic":"string","reason":"string"},...5 topics],"growthAngle":"string (single paragraph: the positioning strategy to beat this competitor)"}}` },
      { role: "user", content: `Competitor description: ${channelDesc}\nNiche: ${niche}\nMy channel: ${myChannel || "Not specified"}\n\nAnalyze this competitor and give me a complete intelligence report with actionable gaps and differentiation strategies.` },
    ]);
    const data = extractJSON(resp.choices[0]?.message?.content?.trim() ?? "{}");
    return res.json(data);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// ── YT: AI Coach (streaming) ──────────────────────────────────────────────────
router.post("/ai/yt-coach", async (req, res) => {
  const { messages } = req.body as { messages: ChatMessage[] };
  if (!messages?.length) return res.status(400).json({ error: "messages are required" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const heartbeat = () => res.write(": heartbeat\n\n");
  heartbeat();

  const systemMessage: ChatMessage = {
    role: "system",
    content: `You are the Marketingstuffs Growth Coach — a world-class digital marketing advisor trained on everything from YouTube basics to advanced full-funnel marketing strategy. You help creators, product sellers, influencers, SaaS founders, eCommerce brands, and service providers scale their business from scratch to 7 figures.

The user is on Marketingstuffs.site, which has these AI tools you should actively reference and recommend:
• Blog Writer (#blog-writer) — AI blog post & article generator
• Website Builder (#website-developer) — 5-step AI website wizard
• Writing Tools (#writing-tools) — 100+ AI content templates
• Social Media Manager (#social-media-section) — multi-platform social content
• YT Growstuffs (#yt-growstuffs) — YouTube growth command center
• Ad Campaigns (#ad-campaigns) — Google, Facebook, Instagram ad creator
• Email Marketing (#email-marketing) — email campaign generator
• SMS Marketing (#sms-marketing) — SMS broadcast creator
• AI Image Studio (#ai-image) — AI image generation
• AI Video Studio (#ai-video) — AI video scripts & content
• AI Voice Studio (#ai-voice) — AI voice generation
• AI Tools Hub (#ai-tools) — 50+ specialized AI tools

Your growth methodology (basics to advanced):
1. Foundation — Website + Blog + Brand (use Website Builder, Blog Writer)
2. Audience — YouTube Shorts → long-form videos → Social Blast (use YT Growstuffs, Social Media)
3. Capture — Lead magnets + email/SMS list building (use Email Marketing, SMS Marketing)
4. Sell — Free content → paid product → webinar funnel (use Ad Campaigns, Writing Tools)
5. Scale — Google Ads + Retargeting + Community + Membership (use Ad Campaigns, AI Tools)
6. Retain — Email sequences + SMS campaigns + exclusive content (use Email Marketing, SMS Marketing)

When advising: be specific and direct. Always reference which Marketingstuffs tool to use for each action. Use bullet points. Keep responses under 350 words. End with a clear next step or question.`,
  };

  try {
    await streamWithFallback(
      [systemMessage, ...messages],
      (chunk) => res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}\n\n`),
      heartbeat,
      4096
    );
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// ── Ad Campaign Generator ─────────────────────────────────────────────────────
router.post("/ai/ad-campaign", async (req, res) => {
  const { platform, businessName, product, audience, goal, tone, budget, usp, competitors, landingUrl } = req.body as {
    platform: string; businessName: string; product: string; audience?: string;
    goal?: string; tone?: string; budget?: string; usp?: string;
    competitors?: string; landingUrl?: string;
  };
  if (!platform || !businessName || !product) {
    return res.status(400).json({ error: "platform, businessName and product are required" });
  }

  const platformPrompts: Record<string, string> = {
    google: `Generate a complete Google Search Ads campaign for the business below.
Return a valid JSON object with this exact shape:
{
  "google": {
    "headline1": "string (max 30 chars)",
    "headline2": "string (max 30 chars)",
    "headline3": "string (max 30 chars)",
    "description1": "string (max 90 chars)",
    "description2": "string (max 90 chars)",
    "displayPath": "string (e.g. shop/skincare)",
    "finalUrl": "string",
    "calloutExtensions": ["string", "string", "string", "string"],
    "sitelinks": [
      {"title": "string (max 25 chars)", "desc": "string (max 35 chars)"},
      {"title": "string", "desc": "string"},
      {"title": "string", "desc": "string"},
      {"title": "string", "desc": "string"}
    ]
  }
}`,
    facebook: `Generate a complete Facebook/Meta Ads campaign for the business below.
Return a valid JSON object with this exact shape:
{
  "facebook": {
    "primaryText": "string (max 125 chars, the main ad copy shown above the image)",
    "headline": "string (max 40 chars, bold text below the image)",
    "description": "string (max 30 chars, subdued text below headline)",
    "cta": "string (CTA button text like: Shop Now, Learn More, Sign Up, Get Offer)",
    "imageCaption": "string (creative direction for the ad image, what to show)",
    "audienceInsight": "string (paragraph on targeting: interests, demographics, behaviors)",
    "placementTips": "string (paragraph on where to run this ad: Feed, Stories, Reels, etc)"
  }
}`,
    instagram: `Generate a complete Instagram Ads campaign for the business below.
Return a valid JSON object with this exact shape:
{
  "instagram": {
    "caption": "string (full feed post caption with emojis, 150-220 words)",
    "hashtags": ["tag1", "tag2", ... up to 20 tags without # prefix],
    "storyCopy": ["string variant 1 (max 60 chars)", "string variant 2 (max 60 chars)", "string variant 3 (max 60 chars)"],
    "reelHook": "string (first 3-second hook line for a Reel, punchy and attention-grabbing)",
    "ctaSticker": "string (CTA sticker text, e.g. Swipe Up, Shop Now, Link in Bio)",
    "audienceNote": "string (targeting recommendation for Instagram, 2-3 sentences)"
  }
}`,
  };

  const systemPrompt = platformPrompts[platform] ?? platformPrompts.google;

  try {
    const { resp } = await chatWithFallback([
      { role: "system", content: `You are an expert digital advertising copywriter and media buyer. ${systemPrompt}\n\nReturn ONLY the JSON object, no markdown fences, no explanation.` },
      { role: "user", content: `Business: ${businessName}\nProduct/Service: ${product}\nUSP: ${usp || "N/A"}\nTarget Audience: ${audience || "General"}\nCampaign Goal: ${goal || "sales"}\nTone: ${tone || "professional"}\nMonthly Budget: ${budget || "N/A"}\nLanding URL: ${landingUrl || ""}` },
    ]);
    const raw = resp.choices[0]?.message?.content?.trim() ?? "{}";
    const data = extractJSON(raw) as Record<string, unknown>;
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Ad generation failed" });
  }
});

// ── Email Campaign Generator ──────────────────────────────────────────────────
router.post("/ai/email-campaign", async (req, res) => {
  const { emailType, brand, product, tone, goal, cta, recipientName, industry, offer } = req.body as {
    emailType: string; brand: string; product: string; tone?: string;
    goal?: string; cta?: string; recipientName?: string; industry?: string; offer?: string;
  };
  if (!brand || !product) return res.status(400).json({ error: "brand and product are required" });

  const nameTag = recipientName ? recipientName : "{{first_name}}";

  try {
    const { resp } = await chatWithFallback([
      {
        role: "system",
        content: `You are an expert email copywriter and conversion specialist. Generate a complete ${emailType} email campaign.
Return a valid JSON object with this exact shape — no markdown fences, no explanation:
{
  "subject": "string (compelling subject line, 40-55 chars)",
  "preheader": "string (preview text, 85-100 chars)",
  "body": "string (plain-text email body, well-structured with greeting, main copy, CTA, sign-off)",
  "htmlEmail": "string (complete styled HTML email template — professional, mobile-responsive, using inline CSS, suitable for all email clients)",
  "subjectVariants": ["variant A", "variant B", "variant C"],
  "tips": ["tip1", "tip2", "tip3", "tip4"]
}
The htmlEmail must be a complete <!DOCTYPE html>...</html> document with inline styles. Use a clean professional layout with the brand colors implied from the industry.`,
      },
      {
        role: "user",
        content: `Brand: ${brand}\nIndustry: ${industry || "E-commerce"}\nEmail Type: ${emailType}\nProduct/Topic: ${product}\nOffer/Key Message: ${offer || "N/A"}\nCTA: ${cta || "Learn More"}\nTone: ${tone || "professional"}\nRecipient Name Tag: ${nameTag}\nGoal: ${goal || "drive conversions"}`,
      },
    ]);
    const raw = resp.choices[0]?.message?.content?.trim() ?? "{}";
    const data = extractJSON(raw) as Record<string, unknown>;
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Email generation failed" });
  }
});

// ── SMS Campaign Generator ────────────────────────────────────────────────────
router.post("/ai/sms-campaign", async (req, res) => {
  const { smsType, business, offer, cta, landingUrl, industry, optOut } = req.body as {
    smsType: string; business: string; offer: string; cta?: string;
    landingUrl?: string; industry?: string; optOut?: string;
  };
  if (!business || !offer) return res.status(400).json({ error: "business and offer are required" });

  const optOutLine = optOut || "Reply STOP to opt out";
  const urlPart = landingUrl ? ` ${landingUrl}` : "";
  const ctaText = cta || "Shop Now";

  try {
    const { resp } = await chatWithFallback([
      {
        role: "system",
        content: `You are an expert SMS marketing specialist. Generate 4 high-converting SMS variants for the campaign below.
Each variant must be under 160 characters when possible (including the opt-out line). Vary the tone and approach.
Return a valid JSON object with this exact shape — no markdown fences, no explanation:
{
  "variants": [
    {
      "text": "string (complete SMS text including opt-out line)",
      "charCount": number,
      "segments": number (1 if ≤160 chars, 2 if ≤320, etc.),
      "tone": "string (e.g. Urgent, Friendly, Curiosity, Social Proof)"
    }
  ],
  "followUp": "string (a suggested follow-up SMS to send 24h later, also under 160 chars including opt-out)",
  "complianceNote": "string (brief TCPA/GDPR compliance guidance for this campaign type)",
  "bestPractices": ["tip1", "tip2", "tip3", "tip4"],
  "estimatedOpenRate": "string (e.g. 'SMS open rates average 98% — typically read within 3 minutes')"
}
Opt-out line to include at end of each SMS: "${optOutLine}"`,
      },
      {
        role: "user",
        content: `Business: ${business}\nIndustry: ${industry || "Retail"}\nCampaign Type: ${smsType}\nOffer/Message: ${offer}\nCTA: ${ctaText}${urlPart ? `\nShort URL: ${urlPart}` : ""}`,
      },
    ]);
    const raw = resp.choices[0]?.message?.content?.trim() ?? "{}";
    const data = extractJSON(raw) as Record<string, unknown>;
    // Recalculate char counts server-side to be accurate
    if (data.variants && Array.isArray(data.variants)) {
      (data.variants as Array<{ text: string; charCount: number; segments: number }>).forEach(v => {
        v.charCount = v.text?.length ?? 0;
        v.segments = Math.ceil(v.charCount / 160);
      });
    }
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "SMS generation failed" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// YT GROWSTUFFS — Digital Marketing Command Center Endpoints
// ═══════════════════════════════════════════════════════════════════════════

const MARKETINGSTUFFS_TOOLS = `
Marketingstuffs.site tools the user can access:
• Blog Writer (#blog-writer) — AI blog post & article writer
• Website Builder (#website-developer) — 5-step AI website wizard
• Writing Tools (#writing-tools) — 100+ AI content writing templates
• Social Media Manager (#social-media-section) — multi-platform social content creator
• YT Growstuffs (#yt-growstuffs) — YouTube growth command center (this tool)
• Ad Campaigns (#ad-campaigns) — Google, Facebook, Instagram ad creator
• Email Marketing (#email-marketing) — email campaign sequence generator
• SMS Marketing (#sms-marketing) — SMS broadcast campaign creator
• AI Image Studio (#ai-image) — AI image & visual generation
• AI Video Studio (#ai-video) — AI video script & content generator
• AI Voice Studio (#ai-voice) — AI voice generation
• AI Tools Hub (#ai-tools) — 50+ specialized AI productivity tools
`;

// ── Growth Advisor (Personalized Roadmap) ─────────────────────────────────────
router.post("/ai/yt-growth-advisor", async (req, res) => {
  const { name, businessType, businessLabel, goal } = req.body as {
    name: string; businessType: string; businessLabel: string; goal: string;
  };
  if (!businessType) return res.status(400).json({ error: "businessType required" });
  try {
    const { resp } = await chatWithFallback([
      {
        role: "system",
        content: `You are the Marketingstuffs Digital Marketing Growth Advisor. You create personalized, step-by-step marketing roadmaps for users based on their business type, following a complete digital marketing methodology from basics to advanced.

${MARKETINGSTUFFS_TOOLS}

Digital Marketing Growth Methodology (ALWAYS follow this order):
Phase 1 - Foundation: Website + Blog + Brand identity
Phase 2 - Audience: YouTube Shorts → long-form videos → Social Media
Phase 3 - Capture: Lead magnets + Email list + SMS subscribers
Phase 4 - Sell: Free content → Paid product → Webinar funnel
Phase 5 - Advertise: Google Ads + Facebook/Instagram Ads + YouTube Ads
Phase 6 - Scale: Retargeting + Community + Membership + Partnerships

Generate a personalized 10-step roadmap. Return ONLY valid JSON (no markdown):
{
  "greeting": "string (warm, personalized 2-sentence welcome using their name and business type)",
  "businessSummary": "string (what success looks like in 12 months for their specific business type — be concrete and inspiring)",
  "steps": [
    {
      "step": number,
      "phase": "string (Foundation|Audience|Capture|Sell|Advertise|Scale)",
      "title": "string (action-oriented, specific step title)",
      "description": "string (2-3 sentences on exactly what to do in this step for their business type)",
      "action": "string (single most important immediate action — be very specific, e.g. 'Use the Blog Writer to write 3 SEO-optimized articles about your niche')",
      "tools": [
        {
          "name": "string (exact tool name from the list above)",
          "anchor": "string (exact anchor like #blog-writer)",
          "reason": "string (1 sentence on why this specific tool for this step)"
        }
      ],
      "timeline": "string (e.g. 'Day 1–3', 'Week 1', 'Month 2')",
      "metric": "string (how to know this step is done, e.g. '5 blog posts published')"
    }
  ],
  "quickWin": "string (one thing they can do in the next 30 minutes on Marketingstuffs to make immediate progress)",
  "warningSign": "string (the #1 mistake people with this exact business type make that kills their growth — be specific)"
}`,
      },
      {
        role: "user",
        content: `Name: ${name || "there"}\nBusiness Type: ${businessLabel || businessType}\nPrimary Goal: ${goal || "build audience and generate revenue"}`,
      },
    ]);
    const data = extractJSON(resp.choices[0]?.message?.content?.trim() ?? "{}");
    return res.json(data);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// ── Channel & Content Analyzer ────────────────────────────────────────────────
router.post("/ai/yt-channel-analyzer", async (req, res) => {
  const { channelName, niche, views, ctr, watchTime, likes, comments, subscribers, videoTitle } = req.body as {
    channelName?: string; niche: string; views?: string; ctr?: string;
    watchTime?: string; likes?: string; comments?: string; subscribers?: string; videoTitle?: string;
  };
  if (!niche) return res.status(400).json({ error: "niche required" });
  try {
    const { resp } = await chatWithFallback([
      {
        role: "system",
        content: `You are a YouTube and digital marketing performance analyst. Analyze the given channel metrics, diagnose specific problems, and recommend which Marketingstuffs tools to use to fix each problem.

${MARKETINGSTUFFS_TOOLS}

Industry benchmarks:
- Good CTR: 6–10% | Low: <4% | Excellent: >10%
- Good Watch Time: 50–70% | Low: <40%
- Engagement Rate (likes+comments/views): Good: 4–8% | Low: <2%
- Subscriber conversion (subscribers/views): Good: 2–5% | Low: <1%

Return ONLY valid JSON (no markdown):
{
  "overallHealth": "string (Excellent|Good|Needs Work|Critical)",
  "healthScore": number (0–100),
  "summary": "string (2-3 sentence overall diagnosis)",
  "issues": [
    {
      "area": "string (e.g. 'Low CTR', 'Poor Watch Retention', 'No Email Capture')",
      "severity": "string (Critical|High|Medium|Low)",
      "diagnosis": "string (why this is happening — be specific and educational)",
      "fix": "string (exact step to fix this problem)",
      "tools": [
        {"name": "string", "anchor": "string (#anchor)", "reason": "string"}
      ]
    }
  ],
  "strengths": ["string",...up to 3 things they're doing well],
  "topPriority": "string (the single most important thing to fix first and why)",
  "contentStrategy": "string (3-4 sentences on what type of content they should focus on based on their niche and metrics)",
  "adReadiness": "string (whether they're ready to run YouTube/Facebook ads and what they need to do first)"
}`,
      },
      {
        role: "user",
        content: `Channel: ${channelName || "Not specified"}\nNiche: ${niche}\nVideo Title: ${videoTitle || "Not specified"}\nViews: ${views || "Not specified"}\nCTR: ${ctr || "Not specified"}%\nWatch Time: ${watchTime || "Not specified"}%\nLikes: ${likes || "Not specified"}\nComments: ${comments || "Not specified"}\nNew Subscribers: ${subscribers || "Not specified"}\n\nAnalyze these metrics, identify problems, and recommend specific Marketingstuffs tools to fix each issue.`,
      },
    ]);
    const data = extractJSON(resp.choices[0]?.message?.content?.trim() ?? "{}");
    return res.json(data);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// ── Full-Funnel Content Machine ───────────────────────────────────────────────
router.post("/ai/yt-content-machine", async (req, res) => {
  const { niche, product, audience, goal } = req.body as {
    niche: string; product?: string; audience?: string; goal?: string;
  };
  if (!niche) return res.status(400).json({ error: "niche required" });
  try {
    const { resp } = await chatWithFallback([
      {
        role: "system",
        content: `You are a full-funnel digital marketing content strategist. Create a complete content plan that turns a creator/business from unknown to selling — using every content channel available.

${MARKETINGSTUFFS_TOOLS}

Return ONLY valid JSON (no markdown):
{
  "funnelOverview": "string (3-sentence explanation of how this funnel works for their specific niche + product)",
  "youtube": {
    "videos": [
      {"title": "string", "type": "string (Short|Long-form)", "purpose": "string (Awareness|Education|Trust|Sale)", "hook": "string (first line)", "cta": "string"}
    ],
    "toolLink": {"name": "AI Video Studio", "anchor": "#ai-video"}
  },
  "blog": {
    "posts": [
      {"title": "string (SEO-optimized)", "keyword": "string", "purpose": "string", "outline": ["string",...3-4 points]}
    ],
    "toolLink": {"name": "Blog Writer", "anchor": "#blog-writer"}
  },
  "social": {
    "instagramThemes": ["string",...3 themes],
    "linkedinAngle": "string",
    "twitterSeries": "string (thread series concept)",
    "toolLink": {"name": "Social Media Manager", "anchor": "#social-media-section"}
  },
  "email": {
    "sequences": [
      {"name": "string (sequence name)", "trigger": "string (when sent)", "emails": number, "goal": "string"}
    ],
    "toolLink": {"name": "Email Marketing", "anchor": "#email-marketing"}
  },
  "sms": {
    "campaigns": [
      {"type": "string", "timing": "string", "goal": "string"}
    ],
    "toolLink": {"name": "SMS Marketing", "anchor": "#sms-marketing"}
  },
  "ads": {
    "googleConcept": "string (search ad angle for this niche)",
    "facebookConcept": "string (ad concept + targeting)",
    "youtubeConcept": "string (video ad concept)",
    "toolLink": {"name": "Ad Campaigns", "anchor": "#ad-campaigns"}
  },
  "weeklySchedule": "string (day-by-day content posting schedule for week 1)",
  "conversionPath": "string (the exact journey: from first YouTube video to paid customer — describe each touchpoint)"
}`,
      },
      {
        role: "user",
        content: `Niche: ${niche}\nProduct/Service: ${product || "Not specified yet"}\nTarget Audience: ${audience || "General"}\nGoal: ${goal || "Build audience and generate revenue"}\n\nCreate a complete multi-channel content machine. Be specific to this niche — not generic. Include exactly what to write/create in each channel.`,
      },
    ]);
    const data = extractJSON(resp.choices[0]?.message?.content?.trim() ?? "{}");
    return res.json(data);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// ── Webinar Funnel ────────────────────────────────────────────────────────────
router.post("/ai/yt-webinar", async (req, res) => {
  const { topic, product, audience, niche } = req.body as {
    topic: string; product?: string; audience?: string; niche?: string;
  };
  if (!topic) return res.status(400).json({ error: "topic required" });
  try {
    const { resp } = await chatWithFallback([
      {
        role: "system",
        content: `You are a webinar marketing expert. Design a complete webinar promotion and execution plan that drives registrations, attendance, and sales.

${MARKETINGSTUFFS_TOOLS}

Return ONLY valid JSON (no markdown):
{
  "webinarTitle": "string (compelling, benefit-focused title using the '3 secrets to X' or 'How to X without Y' formula)",
  "hook": "string (2-sentence opening that hooks attendees in the first 30 seconds)",
  "agenda": [
    {"minute": "string (e.g. '0-5 min')", "topic": "string", "purpose": "string (Intro|Value|Pitch|Q&A)"}
  ],
  "promotion": {
    "youtube": {"videoTitle": "string (YT video to promote webinar)", "timing": "string (when to post)", "toolLink": {"name": "AI Video Studio", "anchor": "#ai-video"}},
    "blog": {"postTitle": "string", "toolLink": {"name": "Blog Writer", "anchor": "#blog-writer"}},
    "social": {"postAngle": "string (organic social strategy)", "toolLink": {"name": "Social Media Manager", "anchor": "#social-media-section"}},
    "email": {"subject": "string (registration email subject)", "sequence": "string (3-email sequence overview)", "toolLink": {"name": "Email Marketing", "anchor": "#email-marketing"}},
    "sms": {"message": "string (reminder SMS, under 160 chars)", "toolLink": {"name": "SMS Marketing", "anchor": "#sms-marketing"}},
    "ads": {"concept": "string (Facebook/YouTube ad to drive registrations)", "toolLink": {"name": "Ad Campaigns", "anchor": "#ad-campaigns"}}
  },
  "pitch": {
    "timing": "string (when to pitch product in the webinar)",
    "script": "string (2-3 sentence transition from value to pitch)",
    "offer": "string (what special offer to make during the webinar)",
    "urgency": "string (how to create urgency)"
  },
  "followUp": {"email24h": "string (subject line + 1-sentence summary of replay email)", "sms": "string (replay SMS)", "toolLinks": [{"name": "string", "anchor": "string"}]}
}`,
      },
      {
        role: "user",
        content: `Webinar Topic: ${topic}\nProduct to sell: ${product || "Not specified"}\nTarget Audience: ${audience || "General"}\nNiche: ${niche || "General"}\n\nCreate a complete webinar system — from planning to promotion to follow-up — using Marketingstuffs tools at each stage.`,
      },
    ]);
    const data = extractJSON(resp.choices[0]?.message?.content?.trim() ?? "{}");
    return res.json(data);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// ── Revenue Scale Plan (Free→Paid→Membership) ────────────────────────────────
router.post("/ai/yt-scale-plan", async (req, res) => {
  const { niche, product, currentRevenue, targetRevenue, businessType } = req.body as {
    niche: string; product?: string; currentRevenue?: string; targetRevenue?: string; businessType?: string;
  };
  if (!niche) return res.status(400).json({ error: "niche required" });
  try {
    const { resp } = await chatWithFallback([
      {
        role: "system",
        content: `You are a digital business revenue scaling expert. Create a complete 3-phase revenue roadmap from free content creator to monetized business using all available marketing tools.

${MARKETINGSTUFFS_TOOLS}

Return ONLY valid JSON (no markdown):
{
  "currentState": "string (honest assessment of where they likely are based on their inputs)",
  "targetState": "string (what achieving target revenue looks like — concrete and specific)",
  "phases": [
    {
      "phase": number,
      "name": "string (e.g. 'Free Content Machine', 'First ₹1L Revenue', 'Scale to ₹10L/month')",
      "duration": "string (e.g. 'Month 1–2')",
      "monthlyRevenueTarget": "string",
      "strategies": [
        {
          "strategy": "string (specific action)",
          "description": "string (how to execute)",
          "tools": [{"name": "string", "anchor": "string (#anchor)", "reason": "string"}]
        }
      ],
      "milestone": "string (what success looks like at the end of this phase)"
    }
  ],
  "revenueStreams": [
    {"stream": "string (e.g. YouTube AdSense, Digital Products, Consulting)", "potential": "string (monthly estimate)", "tools": [{"name": "string", "anchor": "string"}], "howToStart": "string"}
  ],
  "adStrategy": {"whenToStart": "string (when they're ready for paid ads)", "budget": "string (recommended starting budget)", "platform": "string (which ad platform first and why)", "toolLink": {"name": "Ad Campaigns", "anchor": "#ad-campaigns"}},
  "yearOneProjection": "string (realistic 12-month revenue projection based on their inputs)",
  "biggestLever": "string (the single highest-impact action they can take right now to accelerate revenue)"
}`,
      },
      {
        role: "user",
        content: `Niche: ${niche}\nProduct/Service: ${product || "Not launched yet"}\nCurrent Revenue: ${currentRevenue || "₹0 (just starting)"}\nRevenue Target: ${targetRevenue || "₹1,00,000/month"}\nBusiness Type: ${businessType || "Content creator"}\n\nCreate a realistic, phased revenue scaling plan using Marketingstuffs tools. Include specific YouTube Ads and Google Ads strategy.`,
      },
    ]);
    const data = extractJSON(resp.choices[0]?.message?.content?.trim() ?? "{}");
    return res.json(data);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// YT GROWSTUFFS — Phase-Based Growth Playbook Endpoints
// ═══════════════════════════════════════════════════════════════════════════

// ── Phase 1: Shorts Planner ───────────────────────────────────────────────────
router.post("/ai/yt-shorts-plan", async (req, res) => {
  const { niche, product, goal } = req.body as { niche: string; product?: string; goal?: string };
  if (!niche) return res.status(400).json({ error: "niche is required" });
  try {
    const { resp } = await chatWithFallback([
      {
        role: "system",
        content: `You are a YouTube Shorts growth coach trained on Think Media and VidIQ methodology. 
Generate a strategic 30-day Shorts content plan that starts with the most basic relevant concept and scales complexity.
Return ONLY valid JSON (no markdown fences):
{
  "strategy": "string (2-sentence Shorts strategy overview for this niche)",
  "week1": [
    {"day": number, "concept": "string (very basic, foundational concept)", "angle": "string (unique take)", "hook": "string (first 3-second line)", "duration": "string (e.g. '30-45 sec')", "cta": "string (end screen CTA)"}
  ],
  "week2": [ same 7 items, slightly more advanced ],
  "week3": [ same 7 items, introduce social proof or tutorials ],
  "week4": [ same 7 items, product/service tease or authority content ],
  "posting": "string (best posting time recommendation)",
  "tips": ["string", "string", "string"] (3 Shorts-specific growth tips)
}`,
      },
      {
        role: "user",
        content: `Niche: ${niche}\nProduct/Service (if any): ${product || "N/A"}\nGoal: ${goal || "grow to 1000 subscribers"}\n\nGenerate a 30-day Shorts content calendar. Start with the simplest, most relatable concept and scale up. Each Short builds on the previous one.`,
      },
    ]);
    const data = extractJSON(resp.choices[0]?.message?.content?.trim() ?? "{}");
    return res.json(data);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// ── Phase 2: Video Ladder ─────────────────────────────────────────────────────
router.post("/ai/yt-video-ladder", async (req, res) => {
  const { niche, product, currentStage } = req.body as { niche: string; product?: string; currentStage?: string };
  if (!niche) return res.status(400).json({ error: "niche is required" });
  try {
    const { resp } = await chatWithFallback([
      {
        role: "system",
        content: `You are a YouTube content strategist who helps creators scale from Shorts to long-form content. 
Return ONLY valid JSON (no markdown fences):
{
  "ladder": [
    {
      "stage": number (1-5),
      "name": "string (stage name, e.g. 'Awareness Shorts')",
      "format": "string (e.g. 'YouTube Shorts 30-60s')",
      "frequency": "string (e.g. '1x daily')",
      "contentType": "string (what type of content to create)",
      "examples": ["string", "string", "string"] (3 specific video title examples for this niche),
      "trigger": "string (milestone to hit before moving to next stage, e.g. '100 subscribers')",
      "goal": "string (what this stage achieves)",
      "icon": "string (single emoji)"
    }
  ],
  "productIntegration": "string (when and how to naturally introduce the product/service in the content ladder)",
  "timelineEstimate": "string (realistic timeline to go through all 5 stages)"
}`,
      },
      {
        role: "user",
        content: `Niche: ${niche}\nProduct/Service: ${product || "N/A"}\nCurrent Stage: ${currentStage || "just starting"}\n\nCreate a 5-stage content ladder from Shorts → Long-form → Product integration. Be specific to this niche.`,
      },
    ]);
    const data = extractJSON(resp.choices[0]?.message?.content?.trim() ?? "{}");
    return res.json(data);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// ── Phase 3: Social Blast (Cross-platform distribution) ───────────────────────
router.post("/ai/yt-social-blast", async (req, res) => {
  const { videoTitle, niche, platforms } = req.body as { videoTitle: string; niche?: string; platforms?: string[] };
  if (!videoTitle) return res.status(400).json({ error: "videoTitle is required" });
  try {
    const platformList = platforms?.length ? platforms : ["instagram", "linkedin", "twitter", "facebook", "whatsapp"];
    const { resp } = await chatWithFallback([
      {
        role: "system",
        content: `You are a multi-platform social media strategist. Given a YouTube video, create optimized cross-platform distribution content.
Return ONLY valid JSON (no markdown fences):
{
  "instagram": { "reelHook": "string (first 3s)", "caption": "string (150-200 words with emojis)", "hashtags": ["tag",...15 tags], "storySlides": ["string (slide 1 text)", "string (slide 2 text)", "string (slide 3 text)"] },
  "linkedin": { "hook": "string (first line stops the scroll)", "post": "string (200-250 words professional tone)", "cta": "string" },
  "twitter": { "thread": ["string tweet 1 (hook)", "string tweet 2", "string tweet 3", "string tweet 4 (CTA)"] },
  "facebook": { "post": "string (conversational, 100-150 words)", "groupStrategy": "string (which FB groups to share in)" },
  "whatsapp": { "broadcastMessage": "string (short, casual, under 100 words)", "statusText": "string (very short, WhatsApp status copy)" },
  "schedule": "string (recommended sequence: post on X first, then Y, etc.)"
}`,
      },
      {
        role: "user",
        content: `YouTube Video Title: ${videoTitle}\nNiche: ${niche || "General"}\nPlatforms: ${platformList.join(", ")}\n\nCreate a complete cross-platform distribution strategy for this video. Each platform should have unique, platform-native content — not just copied captions.`,
      },
    ]);
    const data = extractJSON(resp.choices[0]?.message?.content?.trim() ?? "{}");
    return res.json(data);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// ── Phase 4: Product Launch ───────────────────────────────────────────────────
router.post("/ai/yt-product-launch", async (req, res) => {
  const { productName, problem, solution, audience, niche } = req.body as {
    productName: string; problem: string; solution?: string; audience?: string; niche?: string;
  };
  if (!productName || !problem) return res.status(400).json({ error: "productName and problem are required" });
  try {
    const { resp } = await chatWithFallback([
      {
        role: "system",
        content: `You are a product launch strategist who has launched 100+ products on YouTube using story-driven marketing.
Return ONLY valid JSON (no markdown fences):
{
  "launchSeries": [
    {
      "videoNumber": number (1-5),
      "title": "string (clickable YouTube title)",
      "angle": "string (narrative angle — problem story, solution reveal, case study, etc.)",
      "script_hook": "string (first 30 seconds that hooks viewers and sets up the problem)",
      "keyPoints": ["string",...4 points to cover in this video],
      "cta": "string (specific call-to-action for this video in the launch sequence)",
      "thumbnail": "string (thumbnail concept description)"
    }
  ],
  "problemStatement": "string (refined 2-sentence problem statement based on input — use this in all videos)",
  "launchTimeline": "string (5-week launch countdown strategy)",
  "pricingAngle": "string (how to talk about price without it feeling salesy)"
}`,
      },
      {
        role: "user",
        content: `Product Name: ${productName}\nProblem it Solves: ${problem}\nSolution/How it Works: ${solution || "N/A"}\nTarget Audience: ${audience || "General"}\nNiche: ${niche || "General"}\n\nCreate a 5-video YouTube product launch series. Each video should build trust before selling. Use the problem→story→solution framework.`,
      },
    ]);
    const data = extractJSON(resp.choices[0]?.message?.content?.trim() ?? "{}");
    return res.json(data);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// ── Phase 5: Stories Calendar ─────────────────────────────────────────────────
router.post("/ai/yt-stories", async (req, res) => {
  const { niche, product, platform } = req.body as { niche: string; product?: string; platform?: string };
  if (!niche) return res.status(400).json({ error: "niche is required" });
  try {
    const { resp } = await chatWithFallback([
      {
        role: "system",
        content: `You are a stories marketing expert who builds deep audience connection through daily Instagram/YouTube Stories.
Return ONLY valid JSON (no markdown fences):
{
  "strategy": "string (3-sentence stories strategy for building community and selling without hard selling)",
  "days": [
    {
      "day": number (1-7),
      "theme": "string (e.g. 'Behind the Scenes', 'Quick Tip', 'Poll Day')",
      "slides": [
        { "type": "string (text|image|poll|quiz|countdown|swipe)", "content": "string (exact story text or description)", "interactivity": "string (poll options, quiz answer, etc. if applicable)" }
      ],
      "goal": "string (what this story day achieves — curiosity, trust, engagement, etc.)"
    }
  ],
  "selling_story": "string (how to weave product mentions naturally into stories without being salesy)",
  "engagement_hacks": ["string", "string", "string"] (3 story engagement tricks)
}`,
      },
      {
        role: "user",
        content: `Niche: ${niche}\nProduct/Service: ${product || "N/A"}\nPlatform: ${platform || "Instagram + YouTube Community"}\n\nCreate a 7-day stories content calendar. Mix personal, educational, and community-building stories. Include polls, quizzes, and swipe-up moments.`,
      },
    ]);
    const data = extractJSON(resp.choices[0]?.message?.content?.trim() ?? "{}");
    return res.json(data);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// ── Phase 6: Quiz & Poll Videos ──────────────────────────────────────────────
router.post("/ai/yt-quiz", async (req, res) => {
  const { niche, topic } = req.body as { niche: string; topic?: string };
  if (!niche) return res.status(400).json({ error: "niche is required" });
  try {
    const { resp } = await chatWithFallback([
      {
        role: "system",
        content: `You are an engagement specialist who creates interactive quiz and poll videos that boost YouTube watch time and comments.
Return ONLY valid JSON (no markdown fences):
{
  "quizVideos": [
    {
      "title": "string (clickable quiz video title)",
      "format": "string (e.g. 'True/False rapid fire', 'Guess the answer', 'This or That')",
      "questions": [
        { "question": "string", "options": ["A: string", "B: string", "C: string", "D: string"], "answer": "string", "explanation": "string (brief)", "reveal_hook": "string (how to reveal the answer dramatically)" }
      ],
      "thumbnail": "string (thumbnail concept — always show a big number like '9/10 people got this wrong')",
      "engagement_prompt": "string (comment prompt — e.g. 'Comment your score below!')"
    }
  ],
  "pollIdeas": ["string",...5 poll ideas for community posts],
  "engagement_tip": "string (pro tip on turning quiz viewers into subscribers)"
}
Generate 3 quiz video concepts with 5 questions each.`,
      },
      {
        role: "user",
        content: `Niche: ${niche}\nTopic focus: ${topic || "general niche knowledge"}\n\nCreate 3 engaging quiz video concepts. Each quiz should have a curiosity-gap title, make people want to prove they know the answers, and drive comment engagement.`,
      },
    ]);
    const data = extractJSON(resp.choices[0]?.message?.content?.trim() ?? "{}");
    return res.json(data);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// ── Phase 7: Freebie Funnel ───────────────────────────────────────────────────
router.post("/ai/yt-freebie", async (req, res) => {
  const { niche, product, audience } = req.body as { niche: string; product?: string; audience?: string };
  if (!niche) return res.status(400).json({ error: "niche is required" });
  try {
    const { resp } = await chatWithFallback([
      {
        role: "system",
        content: `You are a lead magnet and funnel strategist who builds email lists through YouTube and social media.
Return ONLY valid JSON (no markdown fences):
{
  "freebies": [
    {
      "name": "string (freebie name — catchy, specific, value-clear)",
      "type": "string (Checklist|PDF Guide|Template|Email Course|Swipe File|Video Series|Toolkit)",
      "description": "string (what's inside — be specific, not vague)",
      "ytVideoTitle": "string (YouTube video title that naturally promotes this freebie)",
      "cta_line": "string (exact CTA to say in the video to get people to claim it)",
      "email_sequence": [
        { "email": number, "subject": "string", "content": "string (2-3 sentence summary of email content)" }
      ]
    }
  ],
  "landingPageHook": "string (headline for the freebie landing page)",
  "deliveryMechanism": "string (how to deliver the freebie — ConvertKit, Gumroad, etc.)",
  "conversionTip": "string (one powerful tip to maximize freebie to paid conversion)"
}
Generate 3 freebie concepts with a 3-email welcome sequence for each.`,
      },
      {
        role: "user",
        content: `Niche: ${niche}\nProduct/Service to upsell: ${product || "N/A"}\nTarget Audience: ${audience || "General"}\n\nCreate 3 high-value freebie concepts that would make viewers immediately want to sign up. Each freebie should solve one specific, urgent problem and naturally lead into the product purchase.`,
      },
    ]);
    const data = extractJSON(resp.choices[0]?.message?.content?.trim() ?? "{}");
    return res.json(data);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// ── Phase 8: Perks & Scale ────────────────────────────────────────────────────
router.post("/ai/yt-perks", async (req, res) => {
  const { niche, product, subscribers } = req.body as { niche: string; product?: string; subscribers?: string };
  if (!niche) return res.status(400).json({ error: "niche is required" });
  try {
    const { resp } = await chatWithFallback([
      {
        role: "system",
        content: `You are a YouTube monetization and community-building expert who helps creators build loyal superfan communities.
Return ONLY valid JSON (no markdown fences):
{
  "membershipTiers": [
    {
      "name": "string (tier name — creative, niche-specific)",
      "price": "string (e.g. '$2.99/month')",
      "perks": ["string",...5 specific perks],
      "exclusive_content": "string (what exclusive content/access they get)"
    }
  ],
  "insightSeries": [
    { "title": "string (exclusive insight video/post title)", "format": "string", "value": "string (why superfans would pay for this)" }
  ],
  "communityPlatform": "string (best platform recommendation — Discord, WhatsApp, Telegram, Patreon, etc. with reason)",
  "referralProgram": { "mechanism": "string (how the referral works)", "reward": "string (what referrers get)", "cta": "string (how to announce it in videos)" },
  "scaleRoadmap": "string (3-4 sentence roadmap from 1k to 100k subscribers using these perks and community building)"
}
Create 3 membership tiers and 5 insider insight series ideas.`,
      },
      {
        role: "user",
        content: `Niche: ${niche}\nProduct/Service: ${product || "N/A"}\nCurrent Subscribers: ${subscribers || "just starting"}\n\nCreate a complete perks, membership, and community-building strategy. Focus on creating a loyal superfan base that buys anything you recommend.`,
      },
    ]);
    const data = extractJSON(resp.choices[0]?.message?.content?.trim() ?? "{}");
    return res.json(data);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

export default router;
