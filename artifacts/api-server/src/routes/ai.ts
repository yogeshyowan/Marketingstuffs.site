import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { generateImageBuffer } from "@workspace/integrations-openai-ai-server/image";

const router = Router();

router.post("/ai/generate-blog", async (req, res) => {
  const { topic, keywords, tone = "professional", wordCount = 800 } = req.body as {
    topic: string;
    keywords?: string;
    tone?: string;
    wordCount?: number;
  };

  if (!topic) {
    res.status(400).json({ error: "topic is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const systemPrompt = `You are an expert SEO content writer. Write engaging, well-structured blog posts that rank well on search engines. 
Format the blog post with:
- An attention-grabbing H1 title
- A compelling introduction (2-3 paragraphs)
- 3-5 main sections with H2 headings, each with 2-3 paragraphs
- A strong conclusion with a call to action
- Use markdown formatting
Always write in a ${tone} tone. Target approximately ${wordCount} words.`;

  const userPrompt = `Write a comprehensive SEO-optimized blog post about: ${topic}${keywords ? `\n\nFocus keywords: ${keywords}` : ""}`;

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Blog generation failed");
    res.write(`data: ${JSON.stringify({ error: "Generation failed. Please try again." })}\n\n`);
    res.end();
  }
});

router.post("/ai/generate-image", async (req, res) => {
  const { prompt, style = "", aspectRatio = "1:1" } = req.body as {
    prompt: string;
    style?: string;
    aspectRatio?: string;
  };

  if (!prompt) {
    res.status(400).json({ error: "prompt is required" });
    return;
  }

  const sizeMap: Record<string, "1024x1024" | "512x512" | "256x256"> = {
    "1:1": "1024x1024",
    "16:9": "1024x1024",
    "9:16": "1024x1024",
    Square: "1024x1024",
    Portrait: "1024x1024",
    Landscape: "1024x1024",
  };

  const size = sizeMap[aspectRatio] ?? "1024x1024";
  const fullPrompt = style ? `${prompt}, ${style} style` : prompt;

  try {
    const buffer = await generateImageBuffer(fullPrompt, size);
    res.json({ b64_json: buffer.toString("base64"), prompt: fullPrompt });
  } catch (err) {
    req.log.error({ err }, "Image generation failed");
    res.status(500).json({ error: "Image generation failed. Please try again." });
  }
});

router.post("/ai/generate-social-post", async (req, res) => {
  const { topic, brand = "", platforms, tone = "engaging" } = req.body as {
    topic: string;
    brand?: string;
    platforms: string[];
    tone?: string;
  };

  if (!topic || !platforms?.length) {
    res.status(400).json({ error: "topic and platforms are required" });
    return;
  }

  const systemPrompt = `You are a social media content expert. Create platform-optimized posts that drive engagement.
Return a JSON object with a "posts" array. Each post has:
- platform: the social platform name
- content: the post text optimized for that platform's best practices  
- hashtags: array of 3-5 relevant hashtags (without # symbol)

Tone: ${tone}
${brand ? `Brand/Company: ${brand}` : ""}

Platform guidelines:
- Twitter/X: concise, punchy, max 280 chars, conversational
- Instagram: storytelling, emotional, visual description
- LinkedIn: professional, insightful, thought leadership
- Facebook: community-focused, conversational, complete thoughts
- Pinterest: descriptive, aspirational, keyword-rich`;

  const userPrompt = `Create social media posts for these platforms: ${platforms.join(", ")}
Topic: ${topic}

Return ONLY valid JSON matching this structure:
{
  "posts": [
    { "platform": "platform name", "content": "post text", "hashtags": ["tag1", "tag2", "tag3"] }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 4096,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as { posts: Array<{ platform: string; content: string; hashtags: string[] }> };
    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "Social post generation failed");
    res.status(500).json({ error: "Social post generation failed. Please try again." });
  }
});

export default router;
