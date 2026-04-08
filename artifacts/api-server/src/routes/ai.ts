import { Router } from "express";
import { openrouter } from "@workspace/integrations-openrouter-ai";
import { isRateLimitError } from "@workspace/integrations-openrouter-ai/batch";

const router = Router();

// Ordered list of FREE models on OpenRouter — no Replit credits consumed.
// Falls through to the next model if rate-limited or quota-exhausted.
const FREE_TEXT_MODELS = [
  "google/gemma-4-27b-a4b-it:free",       // 262k ctx — primary
  "openai/gpt-oss-120b:free",             // 131k ctx — #2
  "meta-llama/llama-3.3-70b-instruct:free", // 65k ctx — #3
  "nousresearch/hermes-3-llama-3.1-405b:free", // 131k ctx — #4
  "qwen/qwen3-coder:free",                // 262k ctx — #5
  "nvidia/nemotron-3-super-120b-a12b:free", // 262k ctx — #6
];

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

async function chatWithFallback(messages: ChatMessage[], opts: { stream?: false } = {}) {
  const errors: string[] = [];
  for (const model of FREE_TEXT_MODELS) {
    try {
      const resp = await openrouter.chat.completions.create({
        model,
        max_tokens: 8192,
        messages,
        ...opts,
      });
      return { resp, model };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${model}: ${msg}`);
      if (isRateLimitError(err)) continue; // try next model
      if (msg.includes("quota") || msg.includes("limit") || msg.includes("exhausted") || msg.includes("credits")) continue;
      throw err; // non-rate-limit error — don't hide it
    }
  }
  throw new Error(`All free models exhausted. Errors: ${errors.join(" | ")}`);
}

async function streamWithFallback(
  messages: ChatMessage[],
  onChunk: (text: string) => void
): Promise<string> {
  const errors: string[] = [];
  for (const model of FREE_TEXT_MODELS) {
    try {
      const stream = await openrouter.chat.completions.create({
        model,
        max_tokens: 8192,
        messages,
        stream: true,
      });
      let full = "";
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          full += content;
          onChunk(content);
        }
      }
      return full;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${model}: ${msg}`);
      if (isRateLimitError(err)) continue;
      if (msg.includes("quota") || msg.includes("limit") || msg.includes("exhausted") || msg.includes("credits")) continue;
      throw err;
    }
  }
  throw new Error(`All free models exhausted. Errors: ${errors.join(" | ")}`);
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
  } = req.body as {
    topic: string;
    keywords?: string;
    tone?: string;
    wordCount?: number;
    language?: string;
    introStyle?: string;
  };

  if (!topic) { res.status(400).json({ error: "topic is required" }); return; }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

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
- Tone: ${tone}
- Target approximately ${wordCount} words
- Use markdown formatting throughout
- Make all headings SEO-friendly and click-worthy
- Integrate keywords naturally, never forced
- Include transition sentences between sections`;

  const userPrompt = `Write a complete, publication-ready blog post about: "${topic}"${keywords ? `\n\nPrimary keywords to include naturally: ${keywords}` : ""}`;

  try {
    await streamWithFallback(
      [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
      (text) => send({ content: text })
    );
    send({ done: true });
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
    description = "",
    audience = "",
    features = "",
    colorScheme = "modern",
    style = "professional",
  } = req.body as {
    websiteType?: string;
    businessName?: string;
    description?: string;
    audience?: string;
    features?: string;
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

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  const systemPrompt = `You are an expert web developer and UI/UX designer. Generate complete, production-ready HTML with embedded CSS.

Requirements:
- Single self-contained HTML file with embedded <style> and no external dependencies  
- Modern, beautiful design using CSS variables and flexbox/grid
- Color scheme: ${colorScheme} (${colorScheme === "dark" ? "dark background, light text" : colorScheme === "colorful" ? "vibrant gradients and colors" : "clean whites, subtle grays, professional accents"})
- Style: ${style}
- Fully responsive (mobile-first)
- Smooth CSS animations and hover effects
- Professional typography using Google Fonts (@import in the style tag)

Include ALL these sections for a ${websiteType}:
1. Sticky navigation bar with logo and links
2. Hero section with headline, subheadline, CTA buttons
3. Features/Services section with icons (use CSS shapes or unicode)
4. About/How It Works section
5. Social proof / Testimonials section  
6. Pricing section (3 tiers if applicable)
7. FAQ section with expand/collapse (pure CSS)
8. Contact / CTA section
9. Footer with links

Return ONLY the complete HTML file, nothing else. Start with <!DOCTYPE html>`;

  const userPrompt = `Create a complete ${websiteType} website for:
Business Name: ${businessName || "Not specified"}
Description: ${description}
${audience ? `Target Audience: ${audience}` : ""}
${features ? `Key Features/Services: ${features}` : ""}

Generate the full HTML file now.`;

  try {
    await streamWithFallback(
      [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
      (text) => send({ content: text })
    );
    send({ done: true });
    res.end();
  } catch (err: unknown) {
    req.log.error({ err }, "Website generation failed");
    send({ error: err instanceof Error ? err.message : "Generation failed. Please try again." });
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

  const fullPrompt = style ? `${prompt}, ${style} style, highly detailed, professional quality` : `${prompt}, highly detailed, professional quality`;
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

  const lengthGuide: Record<string, string> = {
    short: "concise (1-2 sentences for Twitter, 2-3 for others)",
    medium: "moderate length (2-3 sentences for Twitter, 3-4 paragraphs for others)",
    long: "detailed (full caption for Instagram/LinkedIn, 2-3 tweets for Twitter)",
  };

  const systemPrompt = `You are a social media expert with deep knowledge of what performs on each platform.
Create platform-native posts that feel organic — never generic.

RULES:
- Tone: ${tone}
- ${includeEmojis ? "Include relevant emojis naturally" : "No emojis"}
- Length: ${lengthGuide[postLength] ?? lengthGuide.medium}
- ${hashtagCount} hashtags per post (in hashtags array, no # symbol)
- Make each post genuinely different — optimized for that specific platform's culture and algorithm
${brand ? `- Brand voice: ${brand}` : ""}

Platform-specific guidance:
- Instagram: visual storytelling, emotional hooks, strong CTA, save-worthy content
- Facebook: community building, complete thoughts, encourages shares/comments  
- LinkedIn: professional insights, thought leadership, industry value
- X (Twitter): punchy, conversation-starting, current/trending angle
- Pinterest: descriptive, aspirational, keyword-rich for search
- TikTok: trend-aware, authentic, hook in first 3 words, hashtag challenges

Return ONLY valid JSON:
{
  "posts": [
    {
      "platform": "Platform Name",
      "content": "The post text",
      "hashtags": ["tag1", "tag2", "tag3"],
      "bestTime": "Best time to post (e.g. Tuesday 7-9 PM)",
      "tip": "One quick platform-specific tip"
    }
  ]
}`;

  const userPrompt = `Generate social media posts for: ${platforms.join(", ")}
Topic: ${topic}`;

  try {
    const { resp } = await chatWithFallback(
      [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
    );

    let content = resp.choices[0]?.message?.content ?? "{}";
    // Strip markdown code fences if model wraps JSON
    content = content.replace(/^```(?:json)?\s*/m, "").replace(/\s*```$/m, "").trim();
    const parsed = JSON.parse(content) as {
      posts: Array<{ platform: string; content: string; hashtags: string[]; bestTime?: string; tip?: string }>;
    };
    res.json(parsed);
  } catch (err: unknown) {
    req.log.error({ err }, "Social post generation failed");
    res.status(500).json({ error: err instanceof Error ? err.message : "Generation failed. Please try again." });
  }
});

// ───────────────────────────────────────────────
// POST /api/ai/suggest-blog-titles
// ───────────────────────────────────────────────
router.post("/ai/suggest-blog-titles", async (req, res) => {
  const { topic, count = 5 } = req.body as { topic: string; count?: number };
  if (!topic) { res.status(400).json({ error: "topic is required" }); return; }

  try {
    const { resp } = await chatWithFallback([
      { role: "system", content: "You are an SEO expert. Generate click-worthy, SEO-optimized blog titles. Return JSON: { \"titles\": [\"title1\", \"title2\", ...] }" },
      { role: "user", content: `Generate ${count} compelling blog titles for: ${topic}` },
    ]);
    let content = resp.choices[0]?.message?.content ?? "{}";
    content = content.replace(/^```(?:json)?\s*/m, "").replace(/\s*```$/m, "").trim();
    res.json(JSON.parse(content));
  } catch (err: unknown) {
    req.log.error({ err }, "Title suggestion failed");
    res.status(500).json({ error: "Failed to suggest titles" });
  }
});

export default router;
