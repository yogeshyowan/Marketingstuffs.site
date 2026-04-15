import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Copy, Check, RefreshCw, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Field types ───────────────────────────────────────────────
interface ChipField  { type: "chips";    id: string; label: string; options: string[]; required?: boolean }
interface InputField { type: "input";    id: string; label: string; placeholder: string; required?: boolean }
interface TextareaField { type: "textarea"; id: string; label: string; placeholder: string; rows?: number; required?: boolean }
interface SelectField { type: "select";  id: string; label: string; options: string[]; required?: boolean }
type FieldDef = ChipField | InputField | TextareaField | SelectField;

interface ToolDef {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  category: "blog" | "social" | "youtube" | "business" | "rewriting";
  fields: FieldDef[];
  systemPrompt: string;
  buildUserPrompt: (f: Record<string, string>) => string;
}

// ── SSE stream helper ─────────────────────────────────────────
async function streamTool(systemPrompt: string, userPrompt: string, onChunk: (t: string) => void) {
  const r = await fetch("/api/ai/tool-generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemPrompt, userPrompt }),
  });
  if (!r.ok || !r.body) throw new Error("Network error");
  const reader = r.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const ev = JSON.parse(line.slice(6));
        if (ev.done || ev.error) return;
        if (ev.content) onChunk(ev.content);
      } catch { /* skip */ }
    }
  }
}

// ── Tool definitions ─────────────────────────────────────────
const TOOLS: ToolDef[] = [
  {
    id: "blog-generator", name: "AI Blog Generator", description: "Create SEO-friendly blog posts with structure in minutes", emoji: "📝", color: "#6366f1", category: "blog",
    fields: [
      { type: "input",    id: "topic",    label: "Blog Topic *",                    placeholder: "e.g. 10 proven ways to grow your Instagram following in 2025" },
      { type: "input",    id: "keywords", label: "Target Keywords (comma-separated)",placeholder: "instagram growth, social media tips, gain followers" },
      { type: "chips",    id: "tone",     label: "Tone",                            options: ["Professional", "Casual", "Friendly", "Authoritative", "Conversational"] },
      { type: "chips",    id: "length",   label: "Length",                          options: ["Short (~500 words)", "Medium (~1000 words)", "Long (~2000 words)"] },
    ],
    systemPrompt: "You are an expert SEO content writer and blogger. Write complete, high-quality, engaging blog posts.",
    buildUserPrompt: f => `Write a complete, SEO-optimized blog post about: "${f.topic}"
Target keywords to naturally include: ${f.keywords || "not specified"}
Tone: ${f.tone || "Professional"}
Length target: ${f.length || "Medium (~1000 words)"}

Structure:
- Compelling H1 title (include primary keyword)
- Engaging introduction (hook + what reader will learn)
- 4-6 sections with H2 headings
- Bullet points and numbered lists where relevant
- Conclusion with clear CTA
- Meta description at the end (under 160 chars)

Write the full blog post now:`
  },
  {
    id: "business-name-generator", name: "Business Name Generator", description: "Find the perfect business name — unique, memorable, brandable", emoji: "🏢", color: "#8b5cf6", category: "business",
    fields: [
      { type: "input",  id: "industry",  label: "Industry / Niche *",         placeholder: "e.g. sustainable pet food delivery" },
      { type: "input",  id: "keywords",  label: "Key Values / Keywords",      placeholder: "eco, fresh, paw, care, green" },
      { type: "chips",  id: "style",     label: "Name Style",                 options: ["Modern & Tech", "Classic & Trusted", "Playful & Fun", "Minimalist", "Premium & Luxury", "Bold & Energetic"] },
      { type: "chips",  id: "count",     label: "How Many Names?",            options: ["5 Names", "10 Names", "15 Names"] },
    ],
    systemPrompt: "You are a branding expert and creative naming consultant. Generate unique, memorable, domain-friendly business names.",
    buildUserPrompt: f => `Generate ${f.count || "10 Names"} unique business names for: "${f.industry}"
Keywords/values to consider: ${f.keywords || "not specified"}
Name style: ${f.style || "Modern & Tech"}

For each name provide:
1. **[Name]** — [One sentence why this works, brandability score /10, if .com domain is likely available]

Make names: memorable, easy to spell/pronounce, original, not generic. Mix different naming strategies (compound words, invented words, acronyms, metaphors).`
  },
  {
    id: "keyword-generator", name: "Long Tail Keyword Generator", description: "Get long-tail keywords with search intent to rank higher", emoji: "🔍", color: "#06b6d4", category: "blog",
    fields: [
      { type: "input",  id: "topic",    label: "Main Topic / Seed Keyword *", placeholder: "e.g. project management software" },
      { type: "input",  id: "audience", label: "Target Audience",             placeholder: "e.g. small business owners, remote teams" },
      { type: "chips",  id: "intent",   label: "Search Intent Focus",        options: ["Informational", "Commercial", "Transactional", "Navigational", "Mixed"] },
      { type: "chips",  id: "count",    label: "Number of Keywords",         options: ["10 Keywords", "20 Keywords", "30 Keywords"] },
    ],
    systemPrompt: "You are an expert SEO strategist specializing in keyword research and search intent analysis.",
    buildUserPrompt: f => `Generate ${f.count || "20 Keywords"} long-tail keywords for the topic: "${f.topic}"
Target audience: ${f.audience || "general"}
Focus on: ${f.intent || "Mixed"} intent keywords

For each keyword provide this exact format:
• **[long-tail keyword phrase]** | Intent: [Informational/Commercial/Transactional] | Difficulty: [Low/Medium/High] | Suggested title: "[Example blog/page title using this keyword]"

Make keywords highly specific (3-6 words), realistic search queries people actually type. Group by intent category at the end.`
  },
  {
    id: "prompt-generator", name: "AI Prompt Generator", description: "Generate powerful prompts for any AI tool — ChatGPT, Midjourney & more", emoji: "✨", color: "#f59e0b", category: "blog",
    fields: [
      { type: "input",  id: "topic",  label: "What do you want to create/achieve? *", placeholder: "e.g. write a viral LinkedIn post about remote work productivity" },
      { type: "chips",  id: "tool",   label: "AI Tool",                               options: ["ChatGPT / Claude", "Midjourney", "DALL-E / Stable Diffusion", "Gemini", "Custom LLM"] },
      { type: "chips",  id: "style",  label: "Prompt Style",                          options: ["Detailed & Precise", "Creative & Open", "Step-by-step", "Role-play", "Chain-of-thought"] },
      { type: "input",  id: "context",label: "Extra Context (optional)",              placeholder: "e.g. for B2B SaaS company, professional tone, 300 words" },
    ],
    systemPrompt: "You are a world-class AI prompt engineer. You create highly effective prompts that get exceptional results from AI models.",
    buildUserPrompt: f => `Create 5 high-quality ${f.tool || "ChatGPT / Claude"} prompts for: "${f.topic}"
Style: ${f.style || "Detailed & Precise"}
Additional context: ${f.context || "none"}

For each prompt:
**Prompt [N]: [Short title]**
\`\`\`
[Complete, ready-to-use prompt text — paste-ready, no placeholders left unfilled]
\`\`\`
*Why this works: [1-2 sentences on the technique used]*

Make prompts progressively different in approach. The last one should be the most sophisticated/creative.`
  },
  {
    id: "paraphrasing-tool", name: "AI Paraphrasing Tool", description: "Rephrase your content without losing the original message", emoji: "🔄", color: "#10b981", category: "rewriting",
    fields: [
      { type: "textarea", id: "content", label: "Paste your text to paraphrase *", placeholder: "Paste the text you want to rephrase here...", rows: 6 },
      { type: "chips",    id: "tone",    label: "Output Tone",                    options: ["Same as original", "More formal", "More casual", "More creative", "Simpler & clearer", "More academic"] },
      { type: "chips",    id: "mode",    label: "Paraphrasing Mode",              options: ["Standard", "Fluency", "Creative", "Formal", "Academic", "Anti-AI detection"] },
    ],
    systemPrompt: "You are an expert writing assistant specializing in paraphrasing and content rewriting. Preserve meaning while transforming expression.",
    buildUserPrompt: f => `Paraphrase the following text.
Mode: ${f.mode || "Standard"}
Output tone: ${f.tone || "Same as original"}

ORIGINAL TEXT:
${f.content}

Rules:
- Preserve ALL the original meaning and key information
- Change sentence structure, vocabulary, and phrasing significantly
- Do NOT just swap synonyms — restructure sentences
- Keep the same approximate length${f.mode === "Anti-AI detection" ? "\n- Use natural human writing patterns, varied sentence lengths, occasional colloquialisms" : ""}${f.mode === "Simpler & clearer" ? "\n- Use simpler words and shorter sentences" : ""}

Write ONLY the paraphrased version, nothing else:`
  },
  {
    id: "blog-title-generator", name: "Blog Title Generator", description: "Generate SEO-friendly blog titles that increase clicks and engagement", emoji: "📰", color: "#f43f5e", category: "blog",
    fields: [
      { type: "input",  id: "topic",    label: "Blog Topic / Keyword *",     placeholder: "e.g. email marketing tips for beginners" },
      { type: "input",  id: "audience", label: "Target Audience",            placeholder: "e.g. small business owners, marketers" },
      { type: "chips",  id: "style",    label: "Title Style",                options: ["Listicle (X Ways to...)", "How-To Guide", "Question-Based", "Curiosity-Gap", "Data-Driven", "Ultimate Guide", "Comparison", "Case Study"] },
      { type: "chips",  id: "count",    label: "Number of Titles",           options: ["5 Titles", "10 Titles", "15 Titles"] },
    ],
    systemPrompt: "You are an expert SEO copywriter specializing in creating high-CTR blog titles that rank on Google and compel clicks.",
    buildUserPrompt: f => `Generate ${f.count || "10 Titles"} SEO-optimized blog titles for the topic: "${f.topic}"
Target audience: ${f.audience || "general readers"}
Preferred style: ${f.style || "Mixed — use variety"}

For each title:
**[Title text]**
→ CTR appeal: [Why someone would click this] | SEO strength: [Strong/Medium] | Primary keyword placement: [Beginning/Middle/End]

Make titles: specific, promise clear value, use power words, include numbers where natural. Vary the formulas.`
  },
  {
    id: "paragraph-generator", name: "AI Paragraph Generator", description: "Generate well-written, contextual paragraphs for any purpose", emoji: "📄", color: "#3b82f6", category: "blog",
    fields: [
      { type: "input",   id: "topic",   label: "Topic / Main Idea *",         placeholder: "e.g. The benefits of drinking green tea every morning" },
      { type: "textarea",id: "context", label: "Context / Background (optional)", placeholder: "Where will this paragraph appear? What comes before/after it?", rows: 3 },
      { type: "chips",   id: "tone",    label: "Tone",                        options: ["Informative", "Persuasive", "Descriptive", "Narrative", "Analytical", "Casual"] },
      { type: "chips",   id: "count",   label: "Number of Paragraphs",        options: ["1 Paragraph", "2 Paragraphs", "3 Paragraphs", "5 Paragraphs"] },
    ],
    systemPrompt: "You are an expert writer who creates beautifully crafted, engaging paragraphs on any topic.",
    buildUserPrompt: f => `Write ${f.count || "2 Paragraphs"} well-crafted paragraph(s) about: "${f.topic}"
Tone: ${f.tone || "Informative"}
Context: ${f.context || "standalone paragraphs"}

Requirements:
- Strong topic sentence for each paragraph
- Smooth transitions between sentences
- Specific details and examples (not generic filler)
- Concluding sentence that wraps up the idea
- Natural, engaging language — avoid clichés
- Each paragraph: 80-120 words

Write the paragraph(s) only, no intro or explanation:`
  },
  {
    id: "report-writing", name: "AI Report Writing", description: "Create detailed, professional reports instantly with one click", emoji: "📊", color: "#0ea5e9", category: "business",
    fields: [
      { type: "input",   id: "topic",   label: "Report Topic / Title *",        placeholder: "e.g. Q1 2025 Social Media Performance Analysis" },
      { type: "chips",   id: "type",    label: "Report Type",                   options: ["Business Report", "Market Research", "Annual Report", "Project Report", "Research Summary", "Competitive Analysis", "Technical Report"] },
      { type: "textarea",id: "points",  label: "Key Points to Cover (optional)",placeholder: "List the main sections, data points, or topics the report must address...", rows: 3 },
      { type: "chips",   id: "tone",    label: "Tone",                          options: ["Formal & Executive", "Technical", "Analytical", "Strategic", "Factual"] },
    ],
    systemPrompt: "You are a senior business analyst and report writer with expertise in creating professional, data-driven reports.",
    buildUserPrompt: f => `Write a complete, professional ${f.type || "Business Report"} on: "${f.topic}"
Tone: ${f.tone || "Formal & Executive"}
Key points to cover: ${f.points || "Determine the most relevant sections based on the topic"}

Structure the report with:
1. Executive Summary (3-4 bullet points of key findings)
2. Introduction / Background
3. Methodology / Approach (if applicable)
4. Main Sections (3-5 sections based on the topic)
5. Key Findings & Analysis
6. Recommendations (3-5 actionable recommendations)
7. Conclusion

Use professional business language. Include placeholder data indicators like [Insert Q1 revenue: $X] where specific numbers would be needed. Make it realistic and comprehensive.`
  },
  {
    id: "article-rewriter", name: "Article Rewriter Tool", description: "Revamp articles to give a new look & sound human while avoiding AI detection", emoji: "✏️", color: "#84cc16", category: "rewriting",
    fields: [
      { type: "textarea",id: "content", label: "Paste your article to rewrite *", placeholder: "Paste the full article or section here...", rows: 7 },
      { type: "chips",   id: "style",   label: "Rewriting Style",               options: ["Human-like & Natural", "More Engaging", "Simplified", "Expanded", "Condensed", "Different POV"] },
      { type: "chips",   id: "keep",    label: "What to Preserve",              options: ["Core facts only", "Main structure", "Key headings", "Tone & voice", "All headings & subheadings"] },
    ],
    systemPrompt: "You are an expert content editor and rewriter. Rewrite content to sound authentically human, engaging, and original while preserving the core message.",
    buildUserPrompt: f => `Completely rewrite the following article.
Style: ${f.style || "Human-like & Natural"}
Preserve: ${f.keep || "Core facts only"}

ORIGINAL ARTICLE:
${f.content}

Rewriting rules:
- Change sentence structures throughout — don't just replace words
- Vary sentence length naturally (mix short punchy sentences with longer ones)
- Use active voice predominantly
- Add natural human elements: transitions, rhetorical questions, analogies
- Avoid repetitive phrasing and clichés
- Make it flow as if written by an experienced human writer${f.style === "Human-like & Natural" ? "\n- Use occasional colloquial phrases and conversational transitions\n- Include natural imperfections in style that make it feel genuinely human" : ""}

Rewrite the complete article now:`
  },
  {
    id: "product-description", name: "Product Description Generator", description: "Write compelling product descriptions that convert browsers into buyers", emoji: "🛍️", color: "#f97316", category: "business",
    fields: [
      { type: "input",   id: "product",  label: "Product Name *",                placeholder: "e.g. ErgoMax Standing Desk Converter" },
      { type: "textarea",id: "features", label: "Key Features & Benefits",       placeholder: "• Height adjustable 6\"-16\"\n• Fits any desk\n• Cable management holes\n• Anti-slip mat included", rows: 4 },
      { type: "input",   id: "audience", label: "Target Customer",               placeholder: "e.g. remote workers, gamers, people with back pain" },
      { type: "chips",   id: "platform", label: "Platform",                      options: ["Amazon listing", "Shopify/eCommerce", "Etsy", "Instagram shop", "General website", "B2B catalog"] },
      { type: "chips",   id: "tone",     label: "Tone",                          options: ["Persuasive", "Professional", "Casual & Fun", "Luxury", "Technical"] },
    ],
    systemPrompt: "You are an expert e-commerce copywriter who creates product descriptions that dramatically increase conversion rates.",
    buildUserPrompt: f => `Write a compelling product description for: "${f.product}"
Platform: ${f.platform || "General website"}
Target customer: ${f.audience || "general consumer"}
Tone: ${f.tone || "Persuasive"}
Key features/benefits: ${f.features || "not specified"}

Include:
1. **Hook headline** (benefit-driven, 8-12 words)
2. **Opening paragraph** (lead with the biggest customer benefit, 2-3 sentences)
3. **Key Features** (bullet list: feature → benefit format "✓ [Feature] — so you can [benefit]")
4. **Social proof placeholder**: "[X customers love this product]"
5. **Closing CTA** paragraph (urgency + action)

Optimize for: ${f.platform?.includes("Amazon") ? "Amazon A9 algorithm — include relevant keywords naturally" : "conversions and emotional connection"}`
  },
  {
    id: "instagram-hashtag", name: "Instagram Hashtag Generator", description: "Find trending & niche hashtags to maximize Instagram post visibility", emoji: "#️⃣", color: "#ec4899", category: "social",
    fields: [
      { type: "input",  id: "topic",   label: "Post Topic / Niche *",          placeholder: "e.g. sustainable fashion, thrift store haul" },
      { type: "input",  id: "account", label: "Your Account Type",             placeholder: "e.g. fashion blogger, 15k followers, lifestyle" },
      { type: "chips",  id: "type",    label: "Content Type",                  options: ["Photo post", "Reel / Video", "Carousel", "Story", "Product post", "Behind the scenes"] },
      { type: "chips",  id: "strategy",label: "Hashtag Strategy",             options: ["Balanced mix", "Mostly niche (higher reach)", "Mostly trending (more competition)", "Location-based included"] },
    ],
    systemPrompt: "You are an Instagram growth expert and hashtag strategist with deep knowledge of the Instagram algorithm.",
    buildUserPrompt: f => `Generate a complete set of 30 Instagram hashtags for: "${f.topic}"
Account type: ${f.account || "content creator"}
Content type: ${f.type || "Photo post"}
Strategy: ${f.strategy || "Balanced mix"}

Organize into groups:

**🔥 Mega hashtags (1M+ posts) — use 2-3:**
[hashtags]

**📈 Large hashtags (100K-1M posts) — use 5-7:**
[hashtags]

**🎯 Medium hashtags (10K-100K posts) — use 8-10:**
[hashtags]

**💎 Niche hashtags (1K-10K posts) — use 8-10:**
[hashtags]

**🏷️ Brand/community hashtags — use 2-3:**
[hashtags]

After the list, add:
**📋 Ready-to-paste (copy this):**
[All 30 hashtags on one line separated by spaces]

**💡 Pro tip:** [One strategic insight specific to this niche]`
  },
  {
    id: "instagram-caption", name: "Instagram Caption Generator", description: "Generate engaging & creative Instagram captions that capture attention", emoji: "📸", color: "#a855f7", category: "social",
    fields: [
      { type: "input",   id: "post",    label: "What's your post about? *",     placeholder: "e.g. photo of my morning coffee and journal routine" },
      { type: "input",   id: "brand",   label: "Your Brand / Account Vibe",     placeholder: "e.g. wellness blogger, motivational, authentic" },
      { type: "chips",   id: "tone",    label: "Caption Tone",                  options: ["Inspiring & Motivational", "Funny & Witty", "Authentic & Personal", "Educational", "Promotional", "Storytelling", "Minimalist"] },
      { type: "chips",   id: "include", label: "Include",                       options: ["Call-to-action", "Emoji-heavy", "Minimal emojis", "Question to followers", "Quote", "Behind the scenes"] },
    ],
    systemPrompt: "You are an expert Instagram content creator and social media copywriter who crafts captions that boost engagement and grow audiences.",
    buildUserPrompt: f => `Write 3 Instagram caption variations for: "${f.post}"
Brand/vibe: ${f.brand || "lifestyle creator"}
Tone: ${f.tone || "Authentic & Personal"}
Include: ${f.include || "Call-to-action"}

**Caption 1 — Short & Punchy (under 50 words):**
[caption + relevant emojis]

**Caption 2 — Story-driven (100-150 words):**
[caption that tells a mini-story + emojis + CTA]

**Caption 3 — Engagement-optimized (80-120 words):**
[caption designed to maximize comments + question to followers + emojis]

For each caption include a line break section:
[first line — the hook that shows before "more"]

Make them authentic, not salesy. Use line breaks strategically. Each should feel different in style.`
  },
  {
    id: "social-post-generator", name: "Social Media Post Generator", description: "Create platform-optimized posts for Facebook, Instagram, Twitter, LinkedIn & more", emoji: "📱", color: "#14b8a6", category: "social",
    fields: [
      { type: "input",   id: "topic",    label: "Topic / Message to communicate *", placeholder: "e.g. Announcing our new AI scheduling feature" },
      { type: "chips",   id: "platform", label: "Platform",                         options: ["LinkedIn", "Twitter/X", "Facebook", "Instagram", "Pinterest", "TikTok", "All platforms"] },
      { type: "chips",   id: "goal",     label: "Post Goal",                        options: ["Engagement & comments", "Brand awareness", "Drive traffic", "Product launch", "Educational", "Community building"] },
      { type: "chips",   id: "tone",     label: "Tone",                             options: ["Professional", "Casual & Fun", "Inspiring", "Bold & Direct", "Storytelling"] },
    ],
    systemPrompt: "You are a social media strategist who creates high-performing, platform-native posts that drive real engagement.",
    buildUserPrompt: f => {
      const multi = f.platform === "All platforms";
      const platforms = multi ? ["LinkedIn", "Twitter/X", "Facebook", "Instagram"] : [f.platform || "LinkedIn"];
      return `Create social media post(s) about: "${f.topic}"
Goal: ${f.goal || "Engagement & comments"}
Tone: ${f.tone || "Professional"}
${multi ? "Generate one optimized post for each platform:" : `Platform: ${f.platform}`}

${platforms.map(p => `**${p}:**
${p === "LinkedIn" ? "Format: Professional hook → 3-4 short paragraphs → insight → CTA. Use line breaks. 1200-1500 chars. No hashtags in body (3 at end)." : ""}${p === "Twitter/X" ? "Format: Thread of 3-5 tweets. Tweet 1 = hook. Each tweet under 280 chars. End thread tweet with CTA." : ""}${p === "Facebook" ? "Format: Conversational, 100-300 words. Start with question or bold statement. Include CTA and emoji." : ""}${p === "Instagram" ? "Format: Hook first line → story → CTA. 100-150 words. End with question. 5 relevant hashtags." : ""}
[Write the ${p} post here]`).join("\n\n")}`;
    }
  },
  {
    id: "youtube-ideas", name: "YouTube Video Idea Generator", description: "Generate engaging YouTube video ideas, outlines & talking points for your niche", emoji: "🎬", color: "#ef4444", category: "youtube",
    fields: [
      { type: "input",  id: "niche",    label: "Channel Niche / Topic *",        placeholder: "e.g. personal finance for millennials" },
      { type: "input",  id: "audience", label: "Target Audience",                placeholder: "e.g. 25-35 year olds in debt trying to save money" },
      { type: "chips",  id: "format",   label: "Video Format",                   options: ["Tutorial / How-to", "Listicle", "Storytime / Vlog", "Review", "Reaction", "Educational explainer", "Challenge", "Mixed"] },
      { type: "chips",  id: "count",    label: "Number of Ideas",                options: ["5 Ideas", "8 Ideas", "10 Ideas"] },
    ],
    systemPrompt: "You are a YouTube growth strategist and content creator with expertise in creating viral, high-retention video concepts.",
    buildUserPrompt: f => `Generate ${f.count || "8 Ideas"} YouTube video ideas for a channel about: "${f.niche}"
Target audience: ${f.audience || "general viewers"}
Preferred format: ${f.format || "Mixed"}

For each idea:

**💡 [Video Number]. [Clickable Video Title]**
📊 *Why this will perform:* [Algorithm/audience appeal reason]
🎯 *Target keyword:* [Main keyword to use in title/description]
📝 *3-Point outline:*
  • [Opening hook idea]
  • [Main content structure]
  • [Ending CTA / engagement booster]
💬 *Thumbnail concept:* [Brief visual description]
⏱️ *Ideal length:* [X-X minutes]

---

End with a **🔥 Content Calendar suggestion:** how to space these 5 videos over 5 weeks.`
  },
  {
    id: "youtube-titles", name: "YouTube Title Generator", description: "Optimize YouTube titles for higher click-through rates — balances keywords, curiosity & clarity", emoji: "▶️", color: "#dc2626", category: "youtube",
    fields: [
      { type: "input",  id: "topic",    label: "Video Topic / Description *",    placeholder: "e.g. I tracked every expense for 30 days on a $2000/month salary" },
      { type: "input",  id: "keywords", label: "Target Keywords",                placeholder: "e.g. budgeting, save money, personal finance" },
      { type: "chips",  id: "style",    label: "Title Style",                    options: ["Curiosity-driven", "Number-based", "How-to", "Challenge/Experiment", "Reaction/Opinion", "Vs/Comparison", "Story-based", "Mixed"] },
      { type: "chips",  id: "count",    label: "Number of Titles",               options: ["5 Titles", "10 Titles", "15 Titles"] },
    ],
    systemPrompt: "You are a YouTube SEO expert and title specialist. You create titles that maximize CTR while satisfying the YouTube algorithm.",
    buildUserPrompt: f => `Generate ${f.count || "10 Titles"} high-CTR YouTube titles for this video: "${f.topic}"
Keywords to include: ${f.keywords || "not specified"}
Style preference: ${f.style || "Mixed"}

For each title:
**[Title text]** *(${" "}chars)*
→ CTR formula used: [e.g., curiosity gap, number hook, transformation]
→ Algorithm strength: ⭐⭐⭐⭐ [1-5 stars] | Keyword placement: [Front/Middle/End]

At the end, rank the top 3 by predicted CTR and explain why.

Rules:
- 50-70 characters ideal
- Front-load keywords where possible
- Use power words: "finally", "never", "secret", "honest", "brutal"
- Avoid clickbait that under-delivers — titles must match the video`
  },
  {
    id: "youtube-thumbnail", name: "YouTube Thumbnail Idea Generator", description: "Generate catchy thumbnail ideas that boost audience engagement", emoji: "🖼️", color: "#b91c1c", category: "youtube",
    fields: [
      { type: "input",  id: "title",    label: "Video Title / Topic *",          placeholder: "e.g. I Tried Every $1 Meal at McDonald's for a Week" },
      { type: "input",  id: "channel",  label: "Channel Style / Brand",          placeholder: "e.g. MrBeast-style, minimalist, educational, vlog aesthetic" },
      { type: "chips",  id: "style",    label: "Thumbnail Style",                options: ["Face reaction + text", "Before/After split", "Minimalist bold text", "Collage/grid", "Product/Object focus", "Dramatic cinematic"] },
      { type: "chips",  id: "count",    label: "Number of Concepts",             options: ["3 Concepts", "5 Concepts", "7 Concepts"] },
    ],
    systemPrompt: "You are a YouTube thumbnail designer and visual marketing expert who creates thumbnail concepts that dramatically improve click-through rates.",
    buildUserPrompt: f => `Generate ${f.count || "5 Concepts"} YouTube thumbnail concepts for: "${f.title}"
Channel style: ${f.channel || "general YouTube"}
Preferred style: ${f.style || "Mixed"}

For each thumbnail concept:

**🖼️ Concept [N]: [Short name]**
🎨 *Background:* [Color, gradient, or scene description]
👤 *Subject/Person:* [Expression, pose, or object placement — be specific]
📝 *Text overlay:* "[Exact text to appear on thumbnail]" — [Font style: Bold/Impact/etc., color, size note]
📍 *Layout:* [Where each element is positioned — left/center/right, thirds rule]
😮 *Emotion/hook:* [What feeling this triggers in the viewer]
✅ *Why it works:* [The psychological principle at play — curiosity gap, social proof, fear of missing out, etc.]

End with **🏆 Top pick + A/B test suggestion** (which 2 to test first and why).`
  },
];

// ── Category tabs ─────────────────────────────────────────────
const CATEGORIES = [
  { id: "all",       label: "All Tools", count: TOOLS.length },
  { id: "blog",      label: "Blog & SEO", count: TOOLS.filter(t => t.category === "blog").length },
  { id: "social",    label: "Social Media", count: TOOLS.filter(t => t.category === "social").length },
  { id: "youtube",   label: "YouTube", count: TOOLS.filter(t => t.category === "youtube").length },
  { id: "business",  label: "Business", count: TOOLS.filter(t => t.category === "business").length },
  { id: "rewriting", label: "Rewriting", count: TOOLS.filter(t => t.category === "rewriting").length },
];

// ── Field renderer ────────────────────────────────────────────
function FieldRenderer({ field, value, onChange }: { field: FieldDef; value: string; onChange: (v: string) => void }) {
  if (field.type === "input") return (
    <div>
      <label className="block text-xs font-medium text-white/60 mb-1.5">{field.label}</label>
      <input className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-white/30 transition-colors" placeholder={field.placeholder} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
  if (field.type === "textarea") return (
    <div>
      <label className="block text-xs font-medium text-white/60 mb-1.5">{field.label}</label>
      <textarea className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-white/30 transition-colors resize-none" rows={field.rows ?? 4} placeholder={field.placeholder} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
  if (field.type === "select") return (
    <div>
      <label className="block text-xs font-medium text-white/60 mb-1.5">{field.label}</label>
      <select className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none" value={value} onChange={e => onChange(e.target.value)}>
        <option value="">Choose…</option>
        {field.options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
  if (field.type === "chips") return (
    <div>
      <label className="block text-xs font-medium text-white/60 mb-1.5">{field.label}</label>
      <div className="flex flex-wrap gap-2">
        {field.options.map(o => (
          <button key={o} type="button" onClick={() => onChange(value === o ? "" : o)}
            className={`px-3 py-1.5 rounded-full text-xs border transition-all ${value === o ? "border-violet-400 bg-violet-400/20 text-violet-300" : "border-white/10 text-white/50 hover:border-white/30 hover:text-white/80"}`}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
  return null;
}

// ── Tool Modal ────────────────────────────────────────────────
function ToolModal({ tool, onClose }: { tool: ToolDef; onClose: () => void }) {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const outputRef = useRef<HTMLTextAreaElement>(null);

  const setField = useCallback((id: string, val: string) => {
    setFields(prev => ({ ...prev, [id]: val }));
  }, []);

  const generate = async () => {
    const required = tool.fields.filter(f => f.required !== false && (f.type === "input" || f.type === "textarea") && !fields[f.id]?.trim());
    const firstRequired = tool.fields[0];
    if (!fields[firstRequired.id]?.trim()) return;

    setLoading(true);
    setOutput("");
    try {
      const userPrompt = tool.buildUserPrompt(fields);
      await streamTool(tool.systemPrompt, userPrompt, chunk => {
        setOutput(prev => {
          const next = prev + chunk;
          setTimeout(() => { if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight; }, 10);
          return next;
        });
      });
    } catch {
      setOutput("Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canGenerate = !!fields[tool.fields[0].id]?.trim();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-5xl max-h-[92vh] bg-[#0d0d1f] border border-white/10 rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Modal header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-white/8 shrink-0" style={{ background: tool.color + "15" }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl" style={{ background: tool.color + "25" }}>{tool.emoji}</div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-base">{tool.name}</h3>
            <p className="text-white/45 text-xs truncate">{tool.description}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal body */}
        <div className="flex-1 overflow-auto">
          <div className="grid md:grid-cols-2 gap-0 h-full">
            {/* Left — form */}
            <div className="p-6 space-y-4 border-r border-white/8">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Configure Your Tool</p>
              {tool.fields.map(field => (
                <FieldRenderer key={field.id} field={field} value={fields[field.id] ?? ""} onChange={v => setField(field.id, v)} />
              ))}
              <Button
                onClick={generate}
                disabled={!canGenerate || loading}
                className="w-full h-11 font-bold text-sm rounded-xl text-black mt-2"
                style={{ background: canGenerate && !loading ? tool.color : undefined }}
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating…</>
                  : <><Sparkles className="w-4 h-4 mr-2" /> Generate</>}
              </Button>
            </div>

            {/* Right — output */}
            <div className="p-6 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Generated Output</p>
                {output && (
                  <div className="flex gap-2">
                    <button onClick={() => { setOutput(""); setFields({}); }} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/25 px-2.5 py-1.5 rounded-lg transition-colors">
                      <RefreshCw className="w-3 h-3" /> Reset
                    </button>
                    <button onClick={copy} className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white border border-white/10 hover:border-white/30 px-2.5 py-1.5 rounded-lg transition-colors">
                      {copied ? <><Check className="w-3 h-3 text-green-400" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy all</>}
                    </button>
                  </div>
                )}
              </div>

              {!output && !loading ? (
                <div className="flex-1 min-h-[280px] border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-3 text-center px-6">
                  <span className="text-4xl opacity-30">{tool.emoji}</span>
                  <p className="text-white/25 text-sm">Fill in the form and click Generate<br />to see your AI-created content here</p>
                </div>
              ) : (
                <textarea
                  ref={outputRef}
                  className="flex-1 min-h-[280px] w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm leading-relaxed resize-none focus:outline-none font-mono"
                  value={output}
                  onChange={e => setOutput(e.target.value)}
                  placeholder={loading ? "Generating your content…" : ""}
                />
              )}
              {loading && (
                <div className="flex items-center gap-2 text-xs text-white/35">
                  <Loader2 className="w-3 h-3 animate-spin" style={{ color: tool.color }} />
                  <span>AI is writing…</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Tool card ─────────────────────────────────────────────────
function ToolCard({ tool, onClick }: { tool: ToolDef; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="text-left w-full p-5 rounded-2xl border border-white/8 bg-white/[0.025] hover:bg-white/[0.045] hover:border-white/15 transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-transform group-hover:scale-110" style={{ background: tool.color + "20" }}>
          {tool.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="text-white text-sm font-semibold leading-snug">{tool.name}</h3>
            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 shrink-0 transition-colors" />
          </div>
          <p className="text-white/40 text-xs leading-relaxed">{tool.description}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide" style={{ background: tool.color + "20", color: tool.color }}>
          {tool.category === "blog" ? "Blog & SEO" : tool.category === "social" ? "Social Media" : tool.category === "youtube" ? "YouTube" : tool.category === "business" ? "Business" : "Rewriting"}
        </span>
        <span className="text-[10px] text-white/20">Free · No credits</span>
      </div>
    </motion.button>
  );
}

// ── Main section ──────────────────────────────────────────────
export default function WritingToolsSection() {
  const [activeCat, setActiveCat] = useState("all");
  const [openTool, setOpenTool] = useState<ToolDef | null>(null);

  const filtered = activeCat === "all" ? TOOLS : TOOLS.filter(t => t.category === activeCat);

  return (
    <section id="writing-tools" className="py-24 relative overflow-hidden bg-white/[0.01] border-t border-white/5">
      <div className="absolute right-0 top-0 w-[700px] h-[700px] bg-violet-600/5 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute left-0 bottom-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="container px-4 mx-auto max-w-7xl relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-sm font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5 mr-2" /> 250+ AI Writing Tools
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Transform Your Content with <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">AI-Powered Writing</span>
          </h2>
          <p className="text-lg text-white/45">Rise above the ordinary. Deliver extraordinary content. Effortless writing for every format, platform, and goal.</p>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all ${activeCat === cat.id ? "bg-violet-500/20 border-violet-500/50 text-violet-300" : "border-white/10 text-white/50 hover:text-white hover:border-white/20 bg-white/5"}`}
            >
              {cat.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeCat === cat.id ? "bg-violet-500/30 text-violet-300" : "bg-white/10 text-white/30"}`}>{cat.count}</span>
            </button>
          ))}
        </div>

        {/* Tools grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCat}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filtered.map(tool => (
              <ToolCard key={tool.id} tool={tool} onClick={() => setOpenTool(tool)} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Tool modal */}
      <AnimatePresence>
        {openTool && <ToolModal tool={openTool} onClose={() => setOpenTool(null)} />}
      </AnimatePresence>
    </section>
  );
}
