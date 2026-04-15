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

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

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
  } = req.body as {
    topic: string;
    keywords?: string;
    tone?: string;
    wordCount?: number;
    language?: string;
    introStyle?: string;
    blogStyle?: string;
  };

  if (!topic) { res.status(400).json({ error: "topic is required" }); return; }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);
  const heartbeat = () => res.write(": ping\n\n");

  // Send immediate heartbeat so the client knows we're alive
  heartbeat();

  const systemPrompt = `You are an expert SEO content writer and blogger. Write engaging, comprehensive, well-structured blog posts that rank well on search engines.

STRUCTURE — use this exact format:
1. A compelling SEO-optimized H1 title starting with #
2. A meta description line: **Meta Description:** [160-char description]
3. An intro section (style: ${introStyle}) that hooks the reader immediately — 2-3 paragraphs
4. 4-6 main sections each with ## H2 headings, with 2-4 paragraphs each
5. Bullet points or numbered lists where appropriate
6. A "Key Takeaways" section with bullet points
7. A strong conclusion with a call to action

RULES:
- Write in ${language}
- Blog style: ${blogStyle}
- Tone: ${tone}
- Target approximately ${wordCount} words
- Use markdown formatting throughout
- Make all headings SEO-friendly and click-worthy
- Integrate keywords naturally, never forced
- Include transition sentences between sections`;

  const userPrompt = `Write a complete, publication-ready blog post about: "${topic}"${keywords ? `\n\nPrimary keywords to include naturally: ${keywords}` : ""}`;

  try {
    const { key, model } = await streamWithFallback(
      [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
      (text) => send({ content: text }),
      heartbeat
    );
    send({ done: true, _meta: { key, model } });
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
  };

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

  try {
    const { key, model } = await streamWithFallback(
      [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
      (text) => send({ content: text }),
      heartbeat
    );
    send({ done: true, _meta: { key, model } });
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

export default router;
