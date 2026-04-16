import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PenTool, Loader2, Copy, Check, Download, RefreshCw,
  Lightbulb, ChevronRight, ChevronLeft, Sparkles, Edit3, Wand2, X,
  Share2, Image as ImageIcon, PenLine, FileText, RotateCcw, Zap, Send, Globe,
  Upload, ExternalLink, ChevronDown, Eye, BookOpen, MousePointer2, Bold, Italic, Heading2, Link, Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGenerationGate } from "@/components/GenerationGate";
import { getPlan, applyTextBilling } from "@/lib/credits";

// ── Templates ──────────────────────────────────────────────
const TEMPLATES = [
  {
    id: "minimal",
    label: "Minimal",
    emoji: "⬜",
    desc: "Clean, distraction-free reading",
    preview: { bg: "#ffffff", accent: "#6d28d9", text: "#111827", font: "Georgia, serif" },
  },
  {
    id: "magazine",
    label: "Magazine",
    emoji: "📰",
    desc: "Editorial, bold typography",
    preview: { bg: "#0f0f0f", accent: "#f59e0b", text: "#f9fafb", font: "'Arial Black', sans-serif" },
  },
  {
    id: "corporate",
    label: "Corporate",
    emoji: "💼",
    desc: "Professional, structured layout",
    preview: { bg: "#f8fafc", accent: "#2563eb", text: "#1e293b", font: "'Segoe UI', sans-serif" },
  },
  {
    id: "creative",
    label: "Creative",
    emoji: "🎨",
    desc: "Colorful, modern & expressive",
    preview: { bg: "#fdf4ff", accent: "#9333ea", text: "#1e1b4b", font: "'Trebuchet MS', sans-serif" },
  },
];

const BLOG_STYLES = [
  { id: "how-to",     emoji: "🛠️", label: "How-To Guide",   desc: "Step-by-step instructions" },
  { id: "listicle",   emoji: "📝", label: "Listicle",        desc: "Top 10, Best of..." },
  { id: "opinion",    emoji: "💡", label: "Opinion",         desc: "Thought leadership" },
  { id: "case-study", emoji: "📊", label: "Case Study",      desc: "Story-driven results" },
  { id: "news",       emoji: "📰", label: "News & Trends",   desc: "What's happening now" },
  { id: "review",     emoji: "⭐", label: "Review",          desc: "Honest evaluation" },
  { id: "comparison", emoji: "⚖️", label: "Comparison",      desc: "A vs B deep dives" },
  { id: "faq",        emoji: "❓", label: "FAQ Article",     desc: "Q&A format with rich answers" },
];

const VOICES = [
  { id: "professional", emoji: "👔", label: "Professional", desc: "Authoritative & trusted" },
  { id: "conversational", emoji: "☕", label: "Conversational", desc: "Friendly & relatable" },
  { id: "inspiring", emoji: "🔥", label: "Inspiring", desc: "Motivational & bold" },
  { id: "educational", emoji: "🎓", label: "Educational", desc: "Clear & structured" },
  { id: "witty", emoji: "😄", label: "Witty", desc: "Fun & memorable" },
  { id: "storytelling", emoji: "📖", label: "Storytelling", desc: "Narrative-driven" },
];

const IMAGE_STYLES = [
  { id: "photography", label: "Photography", emoji: "📷" },
  { id: "illustration", label: "Illustration", emoji: "🎨" },
  { id: "flat design", label: "Flat Design", emoji: "🔲" },
  { id: "3d render", label: "3D Render", emoji: "🎭" },
  { id: "watercolor", label: "Watercolor", emoji: "🖌️" },
  { id: "minimal vector", label: "Minimal Vector", emoji: "✏️" },
];

const IMAGE_COUNT_OPTIONS = [0, 1, 2, 3, 4, 5, 6];

const WORD_COUNTS = [
  { value: 600,  label: "Short",       desc: "~3 min read" },
  { value: 900,  label: "Standard",    desc: "~5 min read" },
  { value: 1400, label: "Long-form",   desc: "~7 min read" },
  { value: 2000, label: "In-depth",    desc: "~10 min read" },
  { value: 3000, label: "Epic",        desc: "~15 min read" },
];

const LANGUAGES_35 = [
  "English","Spanish","French","German","Portuguese","Hindi","Arabic","Japanese",
  "Chinese (Simplified)","Chinese (Traditional)","Korean","Italian","Russian",
  "Dutch","Turkish","Polish","Swedish","Norwegian","Danish","Finnish",
  "Greek","Czech","Romanian","Hungarian","Ukrainian","Thai","Vietnamese",
  "Indonesian","Malay","Bengali","Tamil","Telugu","Kannada","Marathi","Urdu",
];

const QUICK_EDITS = [
  "Make it shorter and punchier",
  "Make the tone more casual",
  "Improve SEO and headlines",
  "Add more examples and stats",
  "Strengthen the intro hook",
  "Add a stronger call-to-action",
  "Break up long paragraphs",
  "Add a FAQ section",
];

const STEPS = ["Template", "Your Idea", "Style", "Voice", "Images", "Details"];

// ── Helpers ────────────────────────────────────────────────
function pollinationsUrl(prompt: string, style: string, w = 1200, h = 630) {
  const full = `${prompt}, ${style} style, high quality, professional, vibrant`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(full)}?width=${w}&height=${h}&nologo=true&enhance=true&model=flux&seed=${Math.floor(Math.random() * 9999)}`;
}

function extractSections(markdown: string): string[] {
  const matches = markdown.match(/^## (.+)$/gm) ?? [];
  return matches.map(m => m.replace(/^## /, "").trim());
}

function buildImagePlaceholders(
  content: string,
  topic: string,
  imageStyle: string,
  imageCount: number,
  customPrompts?: { mode: "auto" | "one_for_all" | "per_image"; global: string; perImage: string[] }
): { sections: string[]; prompts: string[]; urls: string[] } {
  const allSections = extractSections(content);
  const n = Math.min(imageCount, Math.max(allSections.length, 1));
  const sections = n === 0 ? [] : allSections.slice(0, n).length > 0 ? allSections.slice(0, n) : Array(n).fill(topic);

  const prompts = sections.map((s, i) => {
    if (!customPrompts || customPrompts.mode === "auto") return `${topic}: ${s}`;
    if (customPrompts.mode === "one_for_all") return customPrompts.global.trim() || `${topic}: ${s}`;
    // per_image
    return customPrompts.perImage[i]?.trim() || `${topic}: ${s}`;
  });

  const urls = prompts.map(p => pollinationsUrl(p, imageStyle));
  return { sections, prompts, urls };
}

function injectImagesIntoMarkdown(content: string, urls: string[]): string {
  if (!urls.length) return content;
  // Split on H2 headings
  const parts = content.split(/(^## .+$)/gm);
  let imageIdx = 0;
  const result: string[] = [];
  // put first image before everything
  if (urls[imageIdx]) {
    result.push(`\n![cover](${urls[imageIdx]})\n`);
    imageIdx++;
  }
  for (let i = 0; i < parts.length; i++) {
    result.push(parts[i]);
    // After each H2 heading, insert next image
    if (/^## .+$/.test(parts[i]) && urls[imageIdx]) {
      result.push(`\n![section](${urls[imageIdx]})\n`);
      imageIdx++;
    }
  }
  return result.join("\n");
}

// ── Markdown → HTML renderer ────────────────────────────────
function renderMarkdownToHtml(text: string, templateId: string): string {
  const tmpl = TEMPLATES.find(t => t.id === templateId) ?? TEMPLATES[0];
  const { accent } = tmpl.preview;

  return text
    .replace(/^# (.+)$/gm, `<h1 style="font-size:2rem;font-weight:800;color:${accent};margin:1.5rem 0 0.75rem;line-height:1.2">$1</h1>`)
    .replace(/^## (.+)$/gm, `<h2 style="font-size:1.4rem;font-weight:700;color:${accent};margin:2rem 0 0.5rem;border-bottom:2px solid ${accent}22;padding-bottom:0.4rem">$1</h2>`)
    .replace(/^### (.+)$/gm, `<h3 style="font-size:1.15rem;font-weight:600;margin:1.5rem 0 0.4rem">$1</h3>`)
    .replace(/\*\*(.+?)\*\*/g, `<strong style="font-weight:700">$1</strong>`)
    .replace(/\*(.+?)\*/g, `<em>$1</em>`)
    .replace(/!\[.+?\]\((.+?)\)/g, `<img src="$1" style="width:100%;height:320px;object-fit:cover;border-radius:12px;margin:1.5rem 0;display:block" loading="lazy" />`)
    .replace(/^- (.+)$/gm, `<li style="margin:0.4rem 0 0.4rem 1.5rem;list-style:disc">$1</li>`)
    .replace(/^\d+\. (.+)$/gm, `<li style="margin:0.4rem 0 0.4rem 1.5rem;list-style:decimal">$1</li>`)
    .replace(/\n\n/g, `</p><p style="line-height:1.8;margin-bottom:1rem">`)
    .replace(/^(?!<[hiulp])(.+)$/gm, (l) => l.trim() ? `<p style="line-height:1.8;margin-bottom:1rem">${l}</p>` : "");
}

function buildHtmlExport(content: string, topic: string, templateId: string): string {
  const tmpl = TEMPLATES.find(t => t.id === templateId) ?? TEMPLATES[0];
  const { bg, accent, text, font } = tmpl.preview;
  const body = renderMarkdownToHtml(content, templateId);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${topic}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${bg};color:${text};font-family:${font};line-height:1.7;padding:2rem 1rem}
  .wrap{max-width:780px;margin:0 auto}
  img{max-width:100%;border-radius:12px;margin:1.5rem 0}
  h1,h2,h3{color:${accent}}
  li{margin-left:1.5rem}
  @media(max-width:600px){body{padding:1rem 0.75rem}}
</style>
</head>
<body><div class="wrap">${body}</div></body>
</html>`;
}

function buildHtmlExportFromHtml(bodyHtml: string, topic: string, templateId: string): string {
  const tmpl = TEMPLATES.find(t => t.id === templateId) ?? TEMPLATES[0];
  const { bg, accent, text, font } = tmpl.preview;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${topic}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${bg};color:${text};font-family:${font};line-height:1.7;padding:2rem 1rem}
  .wrap{max-width:780px;margin:0 auto}
  img{max-width:100%;border-radius:12px;margin:1.5rem 0}
  h1,h2,h3{color:${accent}}
  li{margin-left:1.5rem}
  @media(max-width:600px){body{padding:1rem 0.75rem}}
</style>
</head>
<body><div class="wrap">${bodyHtml}</div></body>
</html>`;
}

function buildEmbedSnippet(content: string, topic: string, templateId: string): string {
  const tmpl = TEMPLATES.find(t => t.id === templateId) ?? TEMPLATES[0];
  const { accent, text, font } = tmpl.preview;
  const body = renderMarkdownToHtml(content, templateId);
  const slug = topic.slice(0, 50).toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `<!-- Blog article: ${topic} — generated by Marketingstuffs -->
<style>
.ms-article-${slug}{font-family:${font};color:${text};line-height:1.8;max-width:780px;margin:0 auto;padding:2rem 1rem}
.ms-article-${slug} img{max-width:100%;height:auto;border-radius:10px;margin:1.5rem 0;display:block}
.ms-article-${slug} h1{font-size:2.2rem;font-weight:800;color:${accent};margin-bottom:1rem;line-height:1.2}
.ms-article-${slug} h2{font-size:1.5rem;font-weight:700;color:${accent};margin:2rem 0 0.75rem}
.ms-article-${slug} h3{font-size:1.2rem;font-weight:600;color:${accent};margin:1.5rem 0 0.5rem}
.ms-article-${slug} p{margin-bottom:1rem}
.ms-article-${slug} ul,.ms-article-${slug} ol{padding-left:1.75rem;margin-bottom:1rem}
.ms-article-${slug} li{margin-bottom:0.35rem}
.ms-article-${slug} strong{font-weight:700}
.ms-article-${slug} blockquote{border-left:4px solid ${accent};padding:0.75rem 1.25rem;margin:1.5rem 0;opacity:.85;font-style:italic;background:rgba(0,0,0,.04);border-radius:0 8px 8px 0}
@media(max-width:600px){.ms-article-${slug}{padding:1rem .75rem}.ms-article-${slug} h1{font-size:1.6rem}}
</style>
<article class="ms-article-${slug}">
${body}
</article>`;
}

function buildArticleHtmlOnly(content: string, templateId: string): string {
  return renderMarkdownToHtml(content, templateId);
}

type ImgPromptMode = "auto" | "one_for_all" | "per_image";

// ── ImageCard sub-component ─────────────────────────────────
function ImageCard({
  index, url, sectionLabel, prompt, imageStyle,
  onRegenerate, onRegenerateWithPrompt,
}: {
  index: number; url: string; sectionLabel: string; prompt: string;
  imageStyle: string;
  onRegenerate: (i: number) => void;
  onRegenerateWithPrompt: (i: number, p: string) => void;
}) {
  const [editingPrompt, setEditingPrompt] = useState(prompt);
  const [isLoaded, setIsLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [key, setKey] = useState(0); // force re-render on regenerate

  const handleRegenerate = () => {
    setIsLoaded(false);
    setImgError(false);
    setKey(k => k + 1);
    if (editingPrompt.trim() && editingPrompt !== prompt) {
      onRegenerateWithPrompt(index, editingPrompt);
    } else {
      onRegenerate(index);
    }
  };

  return (
    <div className="bg-black/30 border border-white/10 rounded-xl overflow-hidden">
      {/* Image */}
      <div className="relative w-full bg-slate-900" style={{ aspectRatio: "16/9" }}>
        {!isLoaded && !imgError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
          </div>
        )}
        {imgError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/30">
            <ImageIcon className="w-8 h-8" />
            <p className="text-xs">Failed to load — click Regenerate</p>
          </div>
        ) : (
          <img
            key={key}
            src={url}
            alt={sectionLabel}
            onLoad={() => setIsLoaded(true)}
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover transition-opacity duration-500 ${isLoaded ? "opacity-100" : "opacity-0"}`}
          />
        )}
        <span className="absolute top-2 left-2 bg-black/60 text-white/70 text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
          {index === 0 ? "📌 Cover" : `§ ${sectionLabel.slice(0, 30)}`}
        </span>
        <span className="absolute top-2 right-2 bg-black/60 text-violet-300/80 text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
          {imageStyle}
        </span>
      </div>

      {/* Prompt editor + Regenerate button */}
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-1.5 mb-1">
          <Zap className="w-3 h-3 text-violet-400 shrink-0" />
          <span className="text-[10px] text-white/40 font-medium">Prompt — edit and regenerate</span>
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 text-xs font-mono"
            value={editingPrompt}
            onChange={e => setEditingPrompt(e.target.value)}
            placeholder="Describe the image…"
            onKeyDown={e => e.key === "Enter" && handleRegenerate()}
          />
          <button
            onClick={handleRegenerate}
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Regen
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────
export default function BlogWriterSection() {
  const { requestGeneration } = useGenerationGate();
  const [step, setStep] = useState(0);
  const [template, setTemplate] = useState("minimal");
  const [topic, setTopic] = useState("");
  const [blogStyle, setBlogStyle] = useState("how-to");
  const [voice, setVoice] = useState("conversational");
  const [imageStyle, setImageStyle] = useState("photography");
  const [imageCount, setImageCount] = useState(4);
  const [wordCount, setWordCount] = useState(900);
  const [keywords, setKeywords] = useState("");
  const [language, setLanguage] = useState("English");

  const [quickTopic, setQuickTopic] = useState("");

  // Image prompt customisation
  const [imgPromptMode, setImgPromptMode] = useState<ImgPromptMode>("auto");
  const [globalImagePrompt, setGlobalImagePrompt] = useState("");
  const [perImagePrompts, setPerImagePrompts] = useState<string[]>(Array(6).fill(""));
  const [imagePrompts, setImagePrompts] = useState<string[]>([]); // prompts used for current images

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageSections, setImageSections] = useState<string[]>([]);
  const [imagesReady, setImagesReady] = useState(false);

  const [copied, setCopied] = useState<"text" | "html" | null>(null);
  const [error, setError] = useState("");
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
  const [loadingTitles, setLoadingTitles] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Edit mode — AI rewrite
  const [editOpen, setEditOpen] = useState(false);
  const [editInstruction, setEditInstruction] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState("");

  // Direct text edit mode
  const [directEditOpen, setDirectEditOpen] = useState(false);
  const [directEditContent, setDirectEditContent] = useState("");

  // Visual inline editor
  const [visualEditOpen, setVisualEditOpen] = useState(false);
  const [visualEditedHtml, setVisualEditedHtml] = useState<string | null>(null);
  const visualEditRef = useRef<HTMLDivElement>(null);

  // Publish panel (social)
  const [publishOpen, setPublishOpen] = useState(false);
  const [siteUrl, setSiteUrl] = useState(() => localStorage.getItem("marketingstuffs_site_url") ?? "");
  const [publishedTo, setPublishedTo] = useState<string[]>([]);

  // Publish to Site panel
  const [publishSiteOpen, setPublishSiteOpen] = useState(false);
  const [publishSitePlatform, setPublishSitePlatform] = useState<"wordpress"|"ghost"|"devto"|"hashnode"|"download"|"copy"|"html-site">("download");
  const [wpSiteUrl, setWpSiteUrl] = useState(() => localStorage.getItem("ms_wp_url") ?? "");
  const [wpUsername, setWpUsername] = useState(() => localStorage.getItem("ms_wp_user") ?? "");
  const [wpAppPassword, setWpAppPassword] = useState("");
  const [wpStatus, setWpStatus] = useState<"draft"|"publish">("draft");
  const [ghostSiteUrl, setGhostSiteUrl] = useState(() => localStorage.getItem("ms_ghost_url") ?? "");
  const [ghostApiKey, setGhostApiKey] = useState("");
  const [ghostStatus, setGhostStatus] = useState<"draft"|"published">("draft");
  const [devtoApiKey, setDevtoApiKey] = useState("");
  const [devtoTags, setDevtoTags] = useState("");
  const [devtoPublished, setDevtoPublished] = useState(false);
  const [hashnodeApiKey, setHashnodeApiKey] = useState("");
  const [hashnodePubId, setHashnodePubId] = useState(() => localStorage.getItem("ms_hn_pubid") ?? "");
  const [hashnodeTags, setHashnodeTags] = useState("");
  const [isPublishingToSite, setIsPublishingToSite] = useState(false);
  const [publishSiteResult, setPublishSiteResult] = useState<{ success: boolean; url?: string; editUrl?: string; error?: string; status?: string } | null>(null);
  const [embedCopied, setEmbedCopied] = useState<"snippet"|"article"|"css"|null>(null);

  const connectedAccounts: { id: string; handle: string }[] = (() => {
    try {
      const raw = localStorage.getItem("marketingstuffs_accounts");
      if (!raw) return [];
      const all = JSON.parse(raw) as Array<{ id: string; connected: boolean; handle: string }>;
      return all.filter(a => a.connected);
    } catch { return []; }
  })();

  const platformEmoji: Record<string, string> = {
    Instagram: "📸", Facebook: "👥", LinkedIn: "💼",
    "X (Twitter)": "🐦", TikTok: "🎵", Pinterest: "📌",
  };
  const platformColor: Record<string, string> = {
    Instagram: "#e1306c", Facebook: "#1877f2", LinkedIn: "#0077b5",
    "X (Twitter)": "#1d9bf0", TikTok: "#69C9D0", Pinterest: "#e60023",
  };

  function makeExcerpt(platform: string, content: string, topicStr: string): string {
    const plain = content.replace(/^#+\s/gm, "").replace(/!\[.*?\]\(.*?\)/g, "").replace(/\*\*/g, "").replace(/\*/g, "").replace(/\n+/g, " ").trim();
    const hashtags = (topicStr ?? "").split(" ").slice(0, 3).map(w => "#" + w.replace(/\W/g, "")).filter(Boolean).join(" ");
    if (platform === "X (Twitter)") {
      return plain.slice(0, 240) + (plain.length > 240 ? "…" : "") + (siteUrl ? ` 🔗 ${siteUrl}` : "");
    }
    if (platform === "Instagram") {
      return `✨ ${topicStr}\n\n${plain.slice(0, 300)}${plain.length > 300 ? "…" : ""}\n\n👉 Full post: ${siteUrl || "link in bio"}\n\n${hashtags} #blog #content`;
    }
    if (platform === "TikTok") {
      return `${plain.slice(0, 100)}${plain.length > 100 ? "…" : ""} 🎯 ${siteUrl || ""}\n#blog #content ${hashtags}`;
    }
    if (platform === "LinkedIn") {
      return `📌 New post: ${topicStr}\n\n${plain.slice(0, 500)}${plain.length > 500 ? "…" : ""}\n\n🔗 Read the full article: ${siteUrl || "[add your URL]"}\n\n${hashtags}`;
    }
    if (platform === "Pinterest") {
      return `${topicStr} — ${plain.slice(0, 200)}${plain.length > 200 ? "…" : ""}\n\n${siteUrl || "[add your URL]"} | ${hashtags}`;
    }
    // Facebook
    return `📢 ${topicStr}\n\n${plain.slice(0, 400)}${plain.length > 400 ? "…" : ""}\n\n👉 Read more: ${siteUrl || "[add your URL]"}\n\n${hashtags}`;
  }

  const handleSiteUrl = (url: string) => {
    setSiteUrl(url);
    localStorage.setItem("marketingstuffs_site_url", url);
  };

  const markPublished = (platform: string) => {
    setPublishedTo(prev => prev.includes(platform) ? prev : [...prev, platform]);
  };

  const selectedTemplate = TEMPLATES.find(t => t.id === template)!;
  const wordEstimate = generatedContent.split(/\s+/).filter(Boolean).length;

  // Content with images injected for display
  const contentWithImages = imagesReady
    ? injectImagesIntoMarkdown(generatedContent, imageUrls)
    : generatedContent;

  async function fetchTitles() {
    if (!topic.trim()) return;
    setLoadingTitles(true);
    try {
      const res = await fetch("/api/ai/suggest-blog-titles", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, count: 5 }),
      });
      if (!res.ok) return;
      const data = await res.json() as { titles?: string[] };
      setSuggestedTitles(data.titles ?? []);
    } catch { /* skip */ }
    finally { setLoadingTitles(false); }
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setGeneratedContent("");
    setImageUrls([]);
    setImagesReady(false);
    setError("");
    setEditOpen(false);

    const selectedStyle = BLOG_STYLES.find(s => s.id === blogStyle)?.label ?? blogStyle;
    const selectedVoice = VOICES.find(v => v.id === voice)?.label ?? voice;
    const currentPlan = getPlan();

    let fullContent = "";
    let usageCredits = 0;

    try {
      const res = await fetch("/api/ai/generate-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic, keywords,
          tone: selectedVoice.toLowerCase(),
          wordCount, language,
          blogStyle: selectedStyle,
          introStyle: blogStyle === "how-to" ? "step opening" : blogStyle === "opinion" ? "contrarian view" : "engaging hook",
          plan: currentPlan,
        }),
      });

      if (!res.ok || !res.body) {
        const errData = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(errData.error ?? "Request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const d = JSON.parse(line.slice(6)) as { content?: string; error?: string; __usage?: number };
            if (d.error) { setError(d.error); }
            if (d.content) {
              fullContent += d.content;
              setGeneratedContent(fullContent);
            }
            // Capture actual Claude token cost for paid plans
            if (d.__usage) usageCredits = d.__usage;
          } catch { /* malformed chunk */ }
        }
      }

      // Apply real token-based billing (paid) or flat billing already handled by gate (free)
      if (fullContent) applyTextBilling(usageCredits);

      // Generate images now that we have the full content
      if (imageCount > 0 && fullContent) {
        const { urls, sections, prompts } = buildImagePlaceholders(fullContent, topic, imageStyle, imageCount, { mode: imgPromptMode, global: globalImagePrompt, perImage: perImagePrompts });
        setImageUrls(urls);
        setImageSections(sections);
        setImagePrompts(prompts);
        setImagesReady(true);
      }
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message || "Generation failed. Please try again.");
      else setError("Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  function regenerateImage(index: number) {
    const prompt = imagePrompts[index] ?? `${topic}: ${imageSections[index] ?? topic}`;
    const newUrl = pollinationsUrl(prompt, imageStyle);
    setImageUrls(prev => prev.map((u, i) => i === index ? newUrl : u));
  }

  function regenerateImageWithPrompt(index: number, newPrompt: string) {
    const url = pollinationsUrl(newPrompt.trim() || `${topic}: ${imageSections[index] ?? topic}`, imageStyle);
    setImageUrls(prev => prev.map((u, i) => i === index ? url : u));
    setImagePrompts(prev => prev.map((p, i) => i === index ? newPrompt : p));
  }

  async function handleEdit() {
    if (!editInstruction.trim()) return;
    setIsEditing(true);
    setEditError("");
    const previous = generatedContent;
    let fullContent = "";

    try {
      setGeneratedContent("");
      const res = await fetch("/api/ai/improve-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: previous, instruction: editInstruction }),
      });
      if (!res.ok || !res.body) throw new Error("Request failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const d = JSON.parse(line.slice(6)) as { content?: string; error?: string };
            if (d.error) { setEditError(d.error); setGeneratedContent(previous); }
            if (d.content) { fullContent += d.content; setGeneratedContent(fullContent); }
          } catch { /* skip */ }
        }
      }
      // Regenerate images for updated content
      if (imageCount > 0 && fullContent) {
        const { urls, sections, prompts } = buildImagePlaceholders(fullContent, topic, imageStyle, imageCount, { mode: imgPromptMode, global: globalImagePrompt, perImage: perImagePrompts });
        setImageUrls(urls);
        setImageSections(sections);
        setImagePrompts(prompts);
        setImagesReady(true);
      }
      setEditInstruction("");
      setEditOpen(false);
    } catch {
      setGeneratedContent(previous);
      setEditError("Edit failed. Please try again.");
    } finally { setIsEditing(false); }
  }

  function handleCopyText() {
    const plain = generatedContent.replace(/^#+\s/gm, "").replace(/\*\*/g, "").replace(/\*/g, "");
    navigator.clipboard.writeText(plain);
    setCopied("text");
    setTimeout(() => setCopied(null), 2500);
  }

  function handleCopyHtml() {
    const html = buildHtmlExport(contentWithImages, topic, template);
    navigator.clipboard.writeText(html);
    setCopied("html");
    setTimeout(() => setCopied(null), 2500);
  }

  function handleDownload() {
    const html = visualEditedHtml
      ? buildHtmlExportFromHtml(visualEditedHtml, topic, template)
      : buildHtmlExport(contentWithImages, topic, template);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${topic.slice(0, 40).replace(/\s+/g, "-").toLowerCase()}-blog.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function publishToSite() {
    if (!generatedContent || !topic) return;
    setIsPublishingToSite(true);
    setPublishSiteResult(null);
    const html = buildHtmlExport(contentWithImages, topic, template);
    const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/__api";
    try {
      let res: Response;
      if (publishSitePlatform === "wordpress") {
        localStorage.setItem("ms_wp_url", wpSiteUrl);
        localStorage.setItem("ms_wp_user", wpUsername);
        res = await fetch(`${API}/api/blog/publish-wordpress`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ siteUrl: wpSiteUrl, username: wpUsername, appPassword: wpAppPassword, title: topic, htmlContent: html, status: wpStatus }),
        });
      } else if (publishSitePlatform === "ghost") {
        localStorage.setItem("ms_ghost_url", ghostSiteUrl);
        res = await fetch(`${API}/api/blog/publish-ghost`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ siteUrl: ghostSiteUrl, adminApiKey: ghostApiKey, title: topic, htmlContent: html, status: ghostStatus }),
        });
      } else if (publishSitePlatform === "devto") {
        res = await fetch(`${API}/api/blog/publish-devto`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey: devtoApiKey, title: topic, bodyMarkdown: generatedContent, tags: devtoTags.split(",").map(t => t.trim()).filter(Boolean), published: devtoPublished }),
        });
      } else if (publishSitePlatform === "hashnode") {
        localStorage.setItem("ms_hn_pubid", hashnodePubId);
        res = await fetch(`${API}/api/blog/publish-hashnode`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey: hashnodeApiKey, publicationId: hashnodePubId, title: topic, contentMarkdown: generatedContent, tags: hashnodeTags.split(",").map(t => t.trim()).filter(Boolean) }),
        });
      } else { return; }
      const data = await res.json();
      if (!res.ok || data.error) {
        setPublishSiteResult({ success: false, error: data.error ?? "Publish failed" });
      } else {
        setPublishSiteResult({ success: true, url: data.postUrl, editUrl: data.editUrl, status: data.status });
      }
    } catch (e: any) {
      setPublishSiteResult({ success: false, error: e.message ?? "Network error" });
    } finally {
      setIsPublishingToSite(false);
    }
  }

  function handleDownloadMd() {
    const blob = new Blob([generatedContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `blog-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const canGoNext = step === 1 ? topic.trim().length > 0 : true;
  const isLastStep = step === STEPS.length - 1;

  // ── Result view ────────────────────────────────────────────
  if (generatedContent || isGenerating) {
    const { bg, accent, text: textColor, font } = selectedTemplate.preview;

    return (
      <section id="blog-writer" className="py-24 relative overflow-hidden">
        <div className="absolute left-0 top-1/3 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="container px-4 mx-auto max-w-5xl">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <PenTool className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg leading-tight">Blog Writer</h2>
                <p className="text-white/40 text-xs truncate max-w-xs">{topic}</p>
              </div>
            </div>
            <div className="flex items-center flex-wrap gap-2">
              {!isGenerating && !isEditing && generatedContent && (
                <>
                  <Button size="sm" onClick={() => { setEditOpen(o => !o); setDirectEditOpen(false); setVisualEditOpen(false); }}
                    className={`h-8 text-xs rounded-xl gap-1.5 ${editOpen ? "bg-violet-500/30 text-violet-300 border border-violet-500/50" : "bg-violet-500/15 text-violet-400 border border-violet-500/20 hover:bg-violet-500/25"}`}>
                    <Wand2 className="w-3.5 h-3.5" /> AI Edit
                  </Button>
                  <Button size="sm" onClick={() => { setDirectEditOpen(o => !o); setDirectEditContent(generatedContent); setEditOpen(false); setVisualEditOpen(false); }}
                    className={`h-8 text-xs rounded-xl gap-1.5 ${directEditOpen ? "bg-sky-500/30 text-sky-300 border border-sky-500/50" : "bg-sky-500/15 text-sky-400 border border-sky-500/20 hover:bg-sky-500/25"}`}>
                    <PenLine className="w-3.5 h-3.5" /> Markdown Edit
                  </Button>
                  <Button size="sm" onClick={() => { setVisualEditOpen(o => !o); setEditOpen(false); setDirectEditOpen(false); }}
                    className={`h-8 text-xs rounded-xl gap-1.5 ${visualEditOpen ? "bg-amber-500/30 text-amber-300 border border-amber-500/50" : "bg-amber-500/15 text-amber-400 border border-amber-500/20 hover:bg-amber-500/25"}`}>
                    <MousePointer2 className="w-3.5 h-3.5" /> Edit Inline
                  </Button>
                  <Button size="sm" onClick={() => setShareOpen(o => !o)}
                    className="h-8 text-xs rounded-xl gap-1.5 bg-pink-500/15 text-pink-400 border border-pink-500/20 hover:bg-pink-500/25">
                    <Share2 className="w-3.5 h-3.5" /> Export
                  </Button>
                  <Button size="sm" onClick={() => { setPublishSiteOpen(o => !o); setPublishOpen(false); setShareOpen(false); setEditOpen(false); setDirectEditOpen(false); setPublishSiteResult(null); }}
                    className={`h-8 text-xs rounded-xl gap-1.5 ${publishSiteOpen ? "bg-teal-500/30 text-teal-300 border border-teal-500/50" : "bg-teal-500/15 text-teal-400 border border-teal-500/20 hover:bg-teal-500/25"}`}>
                    <Upload className="w-3.5 h-3.5" /> Publish to Site
                  </Button>
                  <Button size="sm" onClick={() => { setPublishOpen(o => !o); setPublishSiteOpen(false); setShareOpen(false); setEditOpen(false); setDirectEditOpen(false); }}
                    className={`h-8 text-xs rounded-xl gap-1.5 ${publishOpen ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50" : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25"}`}>
                    <Send className="w-3.5 h-3.5" /> Social Promote
                  </Button>
                  <Button size="sm" onClick={handleDownload}
                    className="h-8 text-xs rounded-xl gap-1.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25">
                    <Download className="w-3.5 h-3.5" /> Download HTML
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={() => { setGeneratedContent(""); setStep(0); setEditOpen(false); setDirectEditOpen(false); }}
                className="border-white/10 text-white/40 hover:bg-white/5 text-xs h-8 rounded-xl">
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> New Blog
              </Button>
            </div>
          </div>

          {/* Edit panel */}
          <AnimatePresence>
            {editOpen && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="mb-4 p-5 rounded-2xl border border-violet-500/30 bg-violet-500/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-violet-400" />
                    <span className="text-sm font-semibold text-violet-300">What would you like to change?</span>
                  </div>
                  <button onClick={() => setEditOpen(false)} className="text-white/30 hover:text-white/60"><X className="w-4 h-4" /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {QUICK_EDITS.map(q => (
                    <button key={q} onClick={() => setEditInstruction(q)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${editInstruction === q ? "border-violet-500/60 bg-violet-500/25 text-violet-300" : "border-white/10 bg-white/5 text-white/50 hover:border-violet-500/40 hover:text-violet-300"}`}>
                      {q}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <input className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 text-sm"
                    placeholder="Or describe your edit... (e.g. 'add a section about pricing')"
                    value={editInstruction} onChange={e => setEditInstruction(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleEdit()} />
                  <Button onClick={handleEdit} disabled={isEditing || !editInstruction.trim()}
                    className="bg-violet-600 hover:bg-violet-500 text-white rounded-xl px-5 text-sm h-10 shrink-0 disabled:opacity-50">
                    {isEditing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Wand2 className="w-4 h-4 mr-1.5" />Apply</>}
                  </Button>
                </div>
                {editError && <p className="text-red-400 text-xs">{editError}</p>}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Direct Edit panel */}
          <AnimatePresence>
            {directEditOpen && !isGenerating && !isEditing && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="mb-4 p-5 rounded-2xl border border-sky-500/30 bg-sky-500/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PenLine className="w-4 h-4 text-sky-400" />
                    <span className="text-sm font-semibold text-sky-300">Markdown Edit — raw text editor</span>
                  </div>
                  <button onClick={() => setDirectEditOpen(false)} className="text-white/30 hover:text-white/60"><X className="w-4 h-4" /></button>
                </div>
                <textarea
                  className="w-full bg-black/50 border border-sky-500/20 rounded-xl px-4 py-4 text-white/90 placeholder:text-white/20 focus:outline-none focus:border-sky-500/50 resize-y text-sm font-mono leading-relaxed"
                  style={{ minHeight: "320px" }}
                  value={directEditContent}
                  onChange={e => setDirectEditContent(e.target.value)}
                  spellCheck
                  placeholder="Edit your blog in markdown…"
                />
                <div className="flex gap-3">
                  <Button onClick={() => { setGeneratedContent(directEditContent); setDirectEditOpen(false); }}
                    className="bg-sky-600 hover:bg-sky-500 text-white rounded-xl px-5 text-sm h-10 gap-1.5">
                    <Check className="w-4 h-4" /> Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setDirectEditOpen(false)}
                    className="border-white/10 text-white/50 hover:bg-white/5 text-sm h-10 rounded-xl">
                    Cancel
                  </Button>
                  <p className="text-xs text-white/25 self-center ml-auto hidden sm:block">Uses standard markdown — # h1, ## h2, **bold**, *italic*</p>
                </div>
              </motion.div>
            )}

            {/* ── Visual Inline Editor ── */}
            {visualEditOpen && !isGenerating && !isEditing && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/8 overflow-hidden">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-amber-500/20 bg-black/30">
                  <div className="flex items-center gap-2">
                    <MousePointer2 className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-semibold text-amber-300">Edit Inline — click any text to edit</span>
                    <span className="text-xs text-amber-400/50 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">WYSIWYG</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      title="Bold"
                      onMouseDown={e => { e.preventDefault(); document.execCommand("bold"); }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 border border-white/10 transition-colors">
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      title="Italic"
                      onMouseDown={e => { e.preventDefault(); document.execCommand("italic"); }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 border border-white/10 transition-colors">
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      title="Wrap in H2"
                      onMouseDown={e => { e.preventDefault(); document.execCommand("formatBlock", false, "h2"); }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 border border-white/10 transition-colors text-xs font-bold">
                      H2
                    </button>
                    <button
                      title="Wrap in H3"
                      onMouseDown={e => { e.preventDefault(); document.execCommand("formatBlock", false, "h3"); }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 border border-white/10 transition-colors text-xs font-bold">
                      H3
                    </button>
                    <button
                      title="Undo"
                      onMouseDown={e => { e.preventDefault(); document.execCommand("undo"); }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 border border-white/10 transition-colors">
                      <Undo2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-4 bg-white/10 mx-1" />
                    <Button size="sm"
                      onClick={() => {
                        if (visualEditRef.current) {
                          const html = visualEditRef.current.innerHTML;
                          setVisualEditedHtml(html);
                          setVisualEditOpen(false);
                        }
                      }}
                      className="h-7 text-xs rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 gap-1">
                      <Check className="w-3 h-3" /> Save
                    </Button>
                    <button onClick={() => { setVisualEditOpen(false); setVisualEditedHtml(null); }} className="text-white/30 hover:text-white/60 ml-1"><X className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="p-1 bg-white/[0.02]">
                  <div
                    ref={visualEditRef}
                    contentEditable
                    suppressContentEditableWarning
                    spellCheck
                    dangerouslySetInnerHTML={{ __html: visualEditedHtml ?? renderMarkdownToHtml(contentWithImages) }}
                    className="blog-content w-full min-h-[400px] px-8 py-6 text-white/90 focus:outline-none cursor-text"
                    style={{ wordBreak: "break-word" }}
                  />
                </div>
                <div className="flex items-center gap-2 px-4 py-3 border-t border-amber-500/15 bg-black/20">
                  <p className="text-xs text-amber-400/50 flex-1">Click any heading, paragraph, or text to edit it directly. Use the toolbar above for formatting.</p>
                  <Button size="sm"
                    onClick={() => {
                      if (visualEditRef.current) {
                        const html = visualEditRef.current.innerHTML;
                        setVisualEditedHtml(html);
                        setVisualEditOpen(false);
                      }
                    }}
                    className="h-8 text-xs rounded-xl bg-amber-600 hover:bg-amber-500 text-white border-0 gap-1.5">
                    <Check className="w-3.5 h-3.5" /> Save Changes
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setVisualEditOpen(false); }}
                    className="h-8 text-xs rounded-xl border-white/10 text-white/40 hover:bg-white/5">
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Share panel */}
          <AnimatePresence>
            {shareOpen && !isGenerating && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="mb-4 p-5 rounded-2xl border border-pink-500/30 bg-pink-500/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-pink-400" />
                    <span className="text-sm font-semibold text-pink-300">Share or export your blog</span>
                  </div>
                  <button onClick={() => setShareOpen(false)} className="text-white/30 hover:text-white/60"><X className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: "Copy plain text", action: handleCopyText, icon: Copy, active: copied === "text" },
                    { label: "Copy HTML code", action: handleCopyHtml, icon: Copy, active: copied === "html" },
                    { label: "Download HTML", action: handleDownload, icon: Download, active: false },
                    { label: "Download .md", action: handleDownloadMd, icon: Download, active: false },
                  ].map(btn => (
                    <button key={btn.label} onClick={btn.action}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center ${btn.active ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-300" : "border-white/10 bg-white/5 text-white/50 hover:border-pink-500/40 hover:text-white"}`}>
                      <btn.icon className="w-5 h-5" />
                      <span className="text-xs font-medium">{btn.active ? "✓ Copied!" : btn.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Publish to Site Panel ── */}
          <AnimatePresence>
            {publishSiteOpen && !isGenerating && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="mb-4 rounded-2xl border border-teal-500/30 bg-teal-500/8 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-teal-400" />
                    <span className="text-sm font-semibold text-teal-300">Publish to Your Site</span>
                    <span className="text-xs text-white/30 bg-white/8 px-2 py-0.5 rounded-full">One-click publish to your blog platform</span>
                  </div>
                  <button onClick={() => setPublishSiteOpen(false)} className="text-white/30 hover:text-white/60"><X className="w-4 h-4" /></button>
                </div>

                {/* Platform tabs */}
                <div className="flex gap-1 p-3 border-b border-white/8 bg-black/20 overflow-x-auto">
                  {([
                    { id: "html-site",label: "HTML Site",         emoji: "📄" },
                    { id: "download", label: "Download & Upload", emoji: "⬇️" },
                    { id: "copy",     label: "Copy & Paste",      emoji: "📋" },
                    { id: "wordpress",label: "WordPress",         emoji: "🌐" },
                    { id: "ghost",    label: "Ghost",             emoji: "👻" },
                    { id: "devto",    label: "Dev.to",            emoji: "💻" },
                    { id: "hashnode", label: "Hashnode",          emoji: "🔷" },
                  ] as const).map(p => (
                    <button key={p.id}
                      onClick={() => { setPublishSitePlatform(p.id as typeof publishSitePlatform); setPublishSiteResult(null); }}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${publishSitePlatform === p.id ? "bg-teal-500/20 text-teal-300 border border-teal-500/30" : "text-white/40 hover:text-white hover:bg-white/5"}`}>
                      <span>{p.emoji}</span>{p.label}
                    </button>
                  ))}
                </div>

                <div className="p-5">
                  {/* ── HTML Site tab ── */}
                  {publishSitePlatform === "html-site" && (
                    <div className="space-y-5">
                      <div className="p-4 rounded-xl border border-teal-500/20 bg-teal-500/5 text-sm text-white/70 leading-relaxed">
                        <p className="font-semibold text-teal-300 mb-1">You have an HTML site — here's exactly what to do:</p>
                        <ol className="space-y-1.5 text-white/55 text-xs list-decimal list-inside">
                          <li>Open the HTML file you want to add the blog to (e.g. <code className="bg-white/10 px-1 rounded text-white/70">blog.html</code> or <code className="bg-white/10 px-1 rounded text-white/70">index.html</code>)</li>
                          <li>Find where you want the article to appear (inside your <code className="bg-white/10 px-1 rounded text-white/70">&lt;main&gt;</code>, <code className="bg-white/10 px-1 rounded text-white/70">&lt;div class="content"&gt;</code>, or wherever your page content goes)</li>
                          <li>Paste the <strong className="text-white/70">Embed Snippet</strong> below — it includes the styles + article in one block</li>
                          <li>Save and open in your browser. Done.</li>
                        </ol>
                      </div>

                      {/* Option 1: Embed snippet */}
                      <div className="rounded-xl border border-white/10 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 bg-black/40 border-b border-white/8">
                          <div>
                            <p className="text-white font-semibold text-sm">Option 1 — Embed Snippet (recommended)</p>
                            <p className="text-xs text-white/40 mt-0.5">Paste anywhere in your HTML — includes scoped CSS so it won't break your site's existing styles</p>
                          </div>
                          <button
                            onClick={() => {
                              const snippet = buildEmbedSnippet(contentWithImages, topic, template);
                              navigator.clipboard.writeText(snippet);
                              setEmbedCopied("snippet");
                              setTimeout(() => setEmbedCopied(null), 2500);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${embedCopied === "snippet" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-teal-500/15 text-teal-400 border border-teal-500/20 hover:bg-teal-500/25"}`}>
                            {embedCopied === "snippet" ? <><Check className="w-3 h-3" />Copied!</> : <><Copy className="w-3 h-3" />Copy Snippet</>}
                          </button>
                        </div>
                        <pre className="p-4 text-[10px] text-white/40 font-mono overflow-x-auto max-h-40 bg-black/60 leading-relaxed">
                          <code>{`<style>\n.ms-article-{ ...scoped styles... }\n</style>\n<article class="ms-article-...">\n  <h1>${topic}</h1>\n  ... your full article ...\n</article>`}</code>
                        </pre>
                      </div>

                      {/* Option 2: Article HTML only */}
                      <div className="rounded-xl border border-white/10 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 bg-black/40 border-b border-white/8">
                          <div>
                            <p className="text-white font-semibold text-sm">Option 2 — Article HTML only (no CSS)</p>
                            <p className="text-xs text-white/40 mt-0.5">Use if your site already has its own CSS — just the raw article tags, your styles apply automatically</p>
                          </div>
                          <button
                            onClick={() => {
                              const html = buildArticleHtmlOnly(contentWithImages, template);
                              navigator.clipboard.writeText(html);
                              setEmbedCopied("article");
                              setTimeout(() => setEmbedCopied(null), 2500);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${embedCopied === "article" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-white/8 text-white/50 border border-white/10 hover:bg-white/12"}`}>
                            {embedCopied === "article" ? <><Check className="w-3 h-3" />Copied!</> : <><Copy className="w-3 h-3" />Copy HTML</>}
                          </button>
                        </div>
                        <pre className="p-4 text-[10px] text-white/40 font-mono overflow-x-auto max-h-28 bg-black/60 leading-relaxed">
                          <code>{`<h1>${topic}</h1>\n<h2>Introduction</h2>\n<p>... article paragraphs ...</p>\n<h2>...</h2>`}</code>
                        </pre>
                      </div>

                      {/* Option 3: Save as separate page */}
                      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                        <p className="text-white font-semibold text-sm mb-1">Option 3 — Save as a separate blog page</p>
                        <p className="text-xs text-white/45 mb-3">Download the complete HTML file and save it as <code className="bg-white/10 px-1 rounded">blog/my-article.html</code> in your site folder. Link to it from your homepage or navigation.</p>
                        <div className="flex gap-2">
                          <button onClick={handleDownload}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-500/15 text-teal-400 border border-teal-500/20 hover:bg-teal-500/25 text-xs font-semibold transition-colors">
                            <Download className="w-3 h-3" /> Download HTML Page
                          </button>
                          <button
                            onClick={() => {
                              const filename = `${topic.slice(0,40).replace(/\s+/g,"-").toLowerCase()}-blog.html`;
                              navigator.clipboard.writeText(`<a href="blog/${filename}">Read: ${topic}</a>`);
                              setEmbedCopied("css");
                              setTimeout(() => setEmbedCopied(null), 2500);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${embedCopied === "css" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"}`}>
                            {embedCopied === "css" ? <><Check className="w-3 h-3" />Link Copied!</> : <><Copy className="w-3 h-3" />Copy Link Tag</>}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Download & Upload tab ── */}
                  {publishSitePlatform === "download" && (
                    <div className="space-y-4">
                      <p className="text-white/60 text-sm">Download your blog as a fully-styled HTML file and upload it to your site.</p>
                      <div className="grid md:grid-cols-2 gap-3">
                        <button onClick={handleDownload}
                          className="flex items-center gap-3 p-4 rounded-xl border border-teal-500/20 bg-teal-500/5 hover:bg-teal-500/10 text-left group transition-all">
                          <div className="w-10 h-10 rounded-lg bg-teal-500/15 flex items-center justify-center shrink-0"><Download className="w-5 h-5 text-teal-400" /></div>
                          <div><p className="text-white font-semibold text-sm group-hover:text-teal-300 transition-colors">Download HTML</p><p className="text-xs text-white/40 mt-0.5">Complete styled page — upload anywhere</p></div>
                        </button>
                        <button onClick={handleDownloadMd}
                          className="flex items-center gap-3 p-4 rounded-xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.04] text-left group transition-all">
                          <div className="w-10 h-10 rounded-lg bg-white/8 flex items-center justify-center shrink-0"><FileText className="w-5 h-5 text-white/50" /></div>
                          <div><p className="text-white font-semibold text-sm">Download Markdown (.md)</p><p className="text-xs text-white/40 mt-0.5">For Jekyll, Hugo, Gatsby, Next.js MDX</p></div>
                        </button>
                      </div>
                      <div className="rounded-xl border border-white/8 bg-black/30 p-4 space-y-2">
                        <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Where to upload</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-white/50">
                          {[
                            { name: "Wix",         step: "Add → Embed → HTML" },
                            { name: "Squarespace", step: "Block → Code Block" },
                            { name: "Webflow",     step: "Embed Component" },
                            { name: "Blogger",     step: "New Post → HTML View" },
                            { name: "cPanel/FTP",  step: "Upload to /blog/" },
                            { name: "GitHub Pages",step: "Add to /docs folder" },
                          ].map(s => (
                            <div key={s.name} className="p-2.5 rounded-lg border border-white/8 bg-white/[0.02]">
                              <p className="font-semibold text-white/70">{s.name}</p>
                              <p className="text-white/30 text-[10px] mt-0.5">{s.step}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Copy & Paste tab ── */}
                  {publishSitePlatform === "copy" && (
                    <div className="space-y-3">
                      <p className="text-white/60 text-sm">Copy your blog content in the format your CMS accepts and paste it directly.</p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {[
                          { label: "Copy Full HTML", desc: "WordPress Classic, raw HTML blocks, FTP paste", action: handleCopyHtml, active: copied === "html" },
                          { label: "Copy Plain Text", desc: "Medium, Substack, Notion, any text editor", action: handleCopyText, active: copied === "text" },
                        ].map(btn => (
                          <button key={btn.label} onClick={btn.action}
                            className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${btn.active ? "border-emerald-500/50 bg-emerald-500/10" : "border-white/10 bg-white/[0.02] hover:border-teal-500/30 hover:bg-teal-500/5"}`}>
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${btn.active ? "bg-emerald-500/20" : "bg-white/8"}`}>
                              {btn.active ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-white/40" />}
                            </div>
                            <div>
                              <p className={`font-semibold text-sm ${btn.active ? "text-emerald-300" : "text-white/80"}`}>{btn.active ? "Copied!" : btn.label}</p>
                              <p className="text-xs text-white/35 mt-0.5">{btn.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="p-3 rounded-xl border border-white/8 bg-black/20 text-xs text-white/40 leading-relaxed">
                        <strong className="text-white/60">Tip:</strong> For WordPress block editor — paste plain text, then use "Transform to Heading" for each H2/H3. For Medium — paste plain text and it'll auto-detect the structure.
                      </div>
                    </div>
                  )}

                  {/* ── WordPress tab ── */}
                  {publishSitePlatform === "wordpress" && (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 text-xs text-blue-300/80 leading-relaxed">
                        <BookOpen className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>Go to <strong>WordPress Admin → Users → Profile → Application Passwords</strong> and create one. Use your WordPress username (not email) + that password below.</span>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-white/60 mb-1.5 block">Site URL</label>
                          <input className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-teal-500/40"
                            placeholder="https://yourblog.com"
                            value={wpSiteUrl} onChange={e => setWpSiteUrl(e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-white/60 mb-1.5 block">Username</label>
                          <input className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-teal-500/40"
                            placeholder="admin"
                            value={wpUsername} onChange={e => setWpUsername(e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-white/60 mb-1.5 block">Application Password</label>
                          <input type="password" className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-teal-500/40"
                            placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                            value={wpAppPassword} onChange={e => setWpAppPassword(e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-white/60 mb-1.5 block">Post status</label>
                          <select className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-teal-500/40"
                            value={wpStatus} onChange={e => setWpStatus(e.target.value as "draft"|"publish")}>
                            <option value="draft">Save as Draft</option>
                            <option value="publish">Publish Immediately</option>
                          </select>
                        </div>
                      </div>
                      <Button onClick={publishToSite} disabled={isPublishingToSite || !wpSiteUrl || !wpUsername || !wpAppPassword}
                        className="w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold h-11 rounded-xl">
                        {isPublishingToSite ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Publishing...</> : <><Upload className="w-4 h-4 mr-2" />Publish to WordPress</>}
                      </Button>
                    </div>
                  )}

                  {/* ── Ghost tab ── */}
                  {publishSitePlatform === "ghost" && (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-3 rounded-xl border border-violet-500/20 bg-violet-500/5 text-xs text-violet-300/80 leading-relaxed">
                        <BookOpen className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>Go to <strong>Ghost Admin → Settings → Integrations → Add Custom Integration</strong>. Copy the <strong>Admin API Key</strong> (format: id:secret).</span>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-white/60 mb-1.5 block">Ghost Site URL</label>
                          <input className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-teal-500/40"
                            placeholder="https://yourblog.ghost.io"
                            value={ghostSiteUrl} onChange={e => setGhostSiteUrl(e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-white/60 mb-1.5 block">Admin API Key</label>
                          <input type="password" className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-teal-500/40"
                            placeholder="id:secret"
                            value={ghostApiKey} onChange={e => setGhostApiKey(e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-white/60 mb-1.5 block">Post status</label>
                          <select className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-teal-500/40"
                            value={ghostStatus} onChange={e => setGhostStatus(e.target.value as "draft"|"published")}>
                            <option value="draft">Save as Draft</option>
                            <option value="published">Publish Immediately</option>
                          </select>
                        </div>
                      </div>
                      <Button onClick={publishToSite} disabled={isPublishingToSite || !ghostSiteUrl || !ghostApiKey}
                        className="w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold h-11 rounded-xl">
                        {isPublishingToSite ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Publishing...</> : <><Upload className="w-4 h-4 mr-2" />Publish to Ghost</>}
                      </Button>
                    </div>
                  )}

                  {/* ── Dev.to tab ── */}
                  {publishSitePlatform === "devto" && (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-3 rounded-xl border border-orange-500/20 bg-orange-500/5 text-xs text-orange-300/80 leading-relaxed">
                        <BookOpen className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>Go to <strong>dev.to → Settings → Extensions → DEV Community API Keys</strong>. Generate a key and paste it below. Posts are created as drafts by default.</span>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="text-xs font-semibold text-white/60 mb-1.5 block">API Key</label>
                          <input type="password" className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-teal-500/40"
                            placeholder="Your DEV.to API key"
                            value={devtoApiKey} onChange={e => setDevtoApiKey(e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-white/60 mb-1.5 block">Tags (comma-separated, max 4)</label>
                          <input className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-teal-500/40"
                            placeholder="marketing, ai, content"
                            value={devtoTags} onChange={e => setDevtoTags(e.target.value)} />
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl border border-white/8 bg-white/[0.02]">
                          <input type="checkbox" id="devto-pub" checked={devtoPublished} onChange={e => setDevtoPublished(e.target.checked)}
                            className="w-4 h-4 accent-teal-500" />
                          <label htmlFor="devto-pub" className="text-sm text-white/70 cursor-pointer">Publish immediately<br/><span className="text-xs text-white/30">Otherwise saved as draft</span></label>
                        </div>
                      </div>
                      <Button onClick={publishToSite} disabled={isPublishingToSite || !devtoApiKey}
                        className="w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold h-11 rounded-xl">
                        {isPublishingToSite ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Publishing...</> : <><Upload className="w-4 h-4 mr-2" />Publish to Dev.to</>}
                      </Button>
                    </div>
                  )}

                  {/* ── Hashnode tab ── */}
                  {publishSitePlatform === "hashnode" && (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 text-xs text-blue-300/80 leading-relaxed">
                        <BookOpen className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>Go to <strong>Hashnode → Account Settings → Developer → API Keys</strong>. Also copy your <strong>Publication ID</strong> from <em>Blog Dashboard → General → Publication ID</em>.</span>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="text-xs font-semibold text-white/60 mb-1.5 block">Personal Access Token</label>
                          <input type="password" className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-teal-500/40"
                            placeholder="Your Hashnode API token"
                            value={hashnodeApiKey} onChange={e => setHashnodeApiKey(e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-white/60 mb-1.5 block">Publication ID</label>
                          <input className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-teal-500/40"
                            placeholder="64a1b2c3d4e5f6..."
                            value={hashnodePubId} onChange={e => setHashnodePubId(e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-white/60 mb-1.5 block">Tags (comma-separated)</label>
                          <input className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-teal-500/40"
                            placeholder="AI, Marketing, Content"
                            value={hashnodeTags} onChange={e => setHashnodeTags(e.target.value)} />
                        </div>
                      </div>
                      <Button onClick={publishToSite} disabled={isPublishingToSite || !hashnodeApiKey || !hashnodePubId}
                        className="w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold h-11 rounded-xl">
                        {isPublishingToSite ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Publishing...</> : <><Upload className="w-4 h-4 mr-2" />Publish to Hashnode</>}
                      </Button>
                    </div>
                  )}

                  {/* Result */}
                  {publishSiteResult && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className={`mt-4 p-4 rounded-xl border ${publishSiteResult.success ? "border-emerald-500/40 bg-emerald-500/10" : "border-red-500/40 bg-red-500/10"}`}>
                      {publishSiteResult.success ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-300 font-semibold text-sm">
                              Published successfully as <span className="capitalize">{publishSiteResult.status}</span>!
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {publishSiteResult.url && (
                              <a href={publishSiteResult.url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-medium hover:bg-emerald-500/30 transition-colors">
                                <Eye className="w-3 h-3" /> View Post
                              </a>
                            )}
                            {publishSiteResult.editUrl && (
                              <a href={publishSiteResult.editUrl} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white/60 text-xs font-medium hover:bg-white/15 transition-colors">
                                <Edit3 className="w-3 h-3" /> Edit in WordPress
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-red-300 font-semibold text-sm">Publish failed</p>
                            <p className="text-red-400/70 text-xs mt-0.5">{publishSiteResult.error}</p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Approve & Publish panel */}
          <AnimatePresence>
            {publishOpen && !isGenerating && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/8 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-semibold text-emerald-300">Approve & Publish</span>
                    <span className="text-xs text-white/30 bg-white/10 px-2 py-0.5 rounded-full">Review your post before publishing</span>
                  </div>
                  <button onClick={() => setPublishOpen(false)} className="text-white/30 hover:text-white/60"><X className="w-4 h-4" /></button>
                </div>

                <div className="p-5 space-y-5">
                  {/* Site URL row */}
                  <div>
                    <label className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" /> Your Website / Blog URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-500/50"
                        placeholder="https://yourblog.com/post-slug"
                        value={siteUrl}
                        onChange={e => handleSiteUrl(e.target.value)}
                      />
                      <Button
                        size="sm"
                        onClick={handleDownload}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-10 px-4 rounded-xl gap-1.5 shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" /> Download HTML
                      </Button>
                    </div>
                    <p className="text-xs text-white/30 mt-1.5">Used in all platform posts as your article link. Download the HTML and upload it to your site.</p>
                  </div>

                  {/* Social platforms */}
                  <div>
                    <label className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3 block flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5" /> Post to Social Media
                    </label>

                    {connectedAccounts.length === 0 ? (
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                        <p className="text-white/40 text-sm">No social accounts connected yet.</p>
                        <p className="text-white/25 text-xs mt-1">Go to <strong className="text-white/40">Social Media → Connect Accounts</strong> to add your platforms.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {connectedAccounts.map(acc => {
                          const excerpt = makeExcerpt(acc.id, generatedContent, topic);
                          const done = publishedTo.includes(acc.id);
                          const color = platformColor[acc.id] ?? "#888";
                          const emoji = platformEmoji[acc.id] ?? "📲";
                          return (
                            <div key={acc.id} className="bg-black/30 border border-white/8 rounded-xl overflow-hidden">
                              {/* Platform header */}
                              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/8" style={{ borderLeftWidth: 3, borderLeftColor: color }}>
                                <span>{emoji}</span>
                                <span className="text-white font-semibold text-sm">{acc.id}</span>
                                {acc.handle && <span className="text-white/30 text-xs">@{acc.handle}</span>}
                                {done && <span className="ml-auto text-xs text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Copied & ready</span>}
                              </div>
                              {/* Editable excerpt */}
                              <textarea
                                className="w-full bg-transparent px-4 py-3 text-white/80 text-xs resize-none focus:outline-none font-mono leading-relaxed"
                                rows={acc.id === "LinkedIn" ? 8 : acc.id === "X (Twitter)" ? 3 : 5}
                                defaultValue={excerpt}
                                id={`publish-excerpt-${acc.id}`}
                              />
                              {/* Action */}
                              <div className="flex items-center gap-2 px-4 py-2.5 border-t border-white/8 bg-white/3">
                                <span className="text-xs text-white/30">{acc.id === "X (Twitter)" ? "Max 280 chars" : acc.id === "Instagram" ? "25-30 hashtags recommended" : acc.id === "LinkedIn" ? "Professional tone — 1200+ chars" : ""}</span>
                                <button
                                  onClick={() => {
                                    const el = document.getElementById(`publish-excerpt-${acc.id}`) as HTMLTextAreaElement;
                                    navigator.clipboard.writeText(el?.value ?? excerpt);
                                    markPublished(acc.id);
                                  }}
                                  className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold text-white transition-colors"
                                  style={{ background: color }}
                                >
                                  {done ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy & Post to {acc.id}</>}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {publishedTo.length > 0 && (
                    <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-xl px-4 py-3">
                      <p className="text-emerald-300 text-sm font-semibold">✓ Ready to publish on {publishedTo.length} platform{publishedTo.length > 1 ? "s" : ""}</p>
                      <p className="text-emerald-400/60 text-xs mt-0.5">Open each platform and paste the copied text. Your article link is embedded in each post.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Blog preview in chosen template */}
          <div className="rounded-2xl border border-white/10 overflow-hidden shadow-[0_0_40px_rgba(139,92,246,0.1)]">
            {/* Template label + stats bar */}
            <div className="flex items-center justify-between px-5 py-3 bg-black/40 border-b border-white/10">
              <div className="flex items-center gap-3">
                {(isGenerating || isEditing) && <div className="flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" /><span className="text-xs text-white/40">{isEditing ? "Applying edit..." : "Generating..."}</span></div>}
                {!isGenerating && !isEditing && <><span className="text-xs text-white/40">{wordEstimate} words</span><span className="text-xs text-emerald-400/80 font-medium bg-emerald-400/10 px-2 py-0.5 rounded-full">Free AI ✓</span></>}
                {imagesReady && imageUrls.length > 0 && <span className="flex items-center gap-1 text-xs text-violet-400/80 bg-violet-400/10 px-2 py-0.5 rounded-full"><ImageIcon className="w-3 h-3" />{imageUrls.length} images</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/50">{selectedTemplate.emoji} {selectedTemplate.label}</span>
                {!isGenerating && !isEditing && generatedContent && (
                  <button onClick={handleCopyText}
                    className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5">
                    {copied === "text" ? <><Check className="w-3.5 h-3.5 text-emerald-400" />Copied</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
                  </button>
                )}
              </div>
            </div>

            {/* Rendered blog content */}
            <div className="overflow-y-auto max-h-[700px]"
              style={{ background: bg, fontFamily: font, color: textColor }}>
              {visualEditedHtml && (
                <div className="flex items-center gap-2 px-4 pt-3 pb-0">
                  <span className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">Visually Edited</span>
                  <button onClick={() => setVisualEditedHtml(null)} className="text-[10px] text-white/30 hover:text-white/60 underline">Reset to original</button>
                </div>
              )}
              <div className="max-w-3xl mx-auto px-8 py-10 blog-content"
                dangerouslySetInnerHTML={{ __html: visualEditedHtml ?? renderMarkdownToHtml(contentWithImages, template) }} />
            </div>

            {/* Bottom action row */}
            {!isGenerating && !isEditing && generatedContent && (
              <div className="px-5 py-4 border-t border-white/10 bg-black/30 flex flex-wrap gap-2 items-center">
                <Button size="sm" onClick={() => setEditOpen(true)}
                  className="bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 border border-violet-500/30 text-xs h-8 rounded-lg gap-1.5">
                  <Edit3 className="w-3 h-3" /> Edit / Improve
                </Button>
                <Button size="sm" onClick={() => setShareOpen(true)}
                  className="bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 border border-pink-500/30 text-xs h-8 rounded-lg gap-1.5">
                  <Share2 className="w-3 h-3" /> Export
                </Button>
                <Button size="sm" onClick={() => { setPublishSiteOpen(true); setShareOpen(false); setPublishSiteResult(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 border border-teal-500/30 text-xs h-8 rounded-lg gap-1.5">
                  <Upload className="w-3 h-3" /> Publish to Site
                </Button>
                <Button size="sm" onClick={handleDownload}
                  className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 text-xs h-8 rounded-lg gap-1.5">
                  <Download className="w-3 h-3" /> Download HTML
                </Button>
                <Button size="sm" onClick={handleGenerate} variant="outline"
                  className="border-white/10 text-white/40 hover:bg-white/5 text-xs h-8 rounded-lg gap-1.5 ml-auto">
                  <RefreshCw className="w-3 h-3" /> Regenerate
                </Button>
              </div>
            )}
          </div>

          {/* Image Gallery with per-image regenerate */}
          {imagesReady && imageUrls.length > 0 && !isGenerating && !isEditing && (
            <div className="mt-4 rounded-2xl border border-violet-500/20 bg-violet-500/5 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-violet-400" />
                  <span className="text-sm font-semibold text-violet-300">Generated Images</span>
                  <span className="text-xs text-white/30 bg-white/10 px-2 py-0.5 rounded-full">{imageUrls.length} image{imageUrls.length > 1 ? "s" : ""}</span>
                </div>
                <p className="text-xs text-white/30">Click a prompt to edit, then regenerate</p>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {imageUrls.map((url, i) => (
                  <ImageCard
                    key={i}
                    index={i}
                    url={url}
                    sectionLabel={imageSections[i] ?? (i === 0 ? "Cover" : `Section ${i}`)}
                    prompt={imagePrompts[i] ?? ""}
                    imageStyle={imageStyle}
                    onRegenerate={regenerateImage}
                    onRegenerateWithPrompt={regenerateImageWithPrompt}
                  />
                ))}
              </div>
            </div>
          )}

          {error && <div className="mt-4 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">{error}</div>}
        </div>
      </section>
    );
  }

  // ── Wizard ─────────────────────────────────────────────────
  return (
    <section id="blog-writer" className="py-24 relative overflow-hidden">
      <div className="absolute left-0 top-1/3 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="container px-4 mx-auto max-w-3xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-sm font-medium mb-4">
            <PenTool className="w-4 h-4 mr-2" /> AI Blog Writer
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Write Blogs That <span className="text-violet-400">Get Found</span>
          </h2>
          <p className="text-white/50 text-lg">Create long-form SEO blogs with AI images in 60 seconds — in 35 languages</p>
        </div>

        {/* Quick Generate bar — GravityWrite-style instant mode */}
        <div className="mb-8 p-5 rounded-2xl border border-violet-500/30 bg-violet-500/8 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-violet-400 fill-violet-400" />
            <span className="text-violet-300 text-sm font-semibold">Quick Generate</span>
            <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">Skip the wizard</span>
          </div>
          <div className="flex gap-3">
            <input
              value={quickTopic}
              onChange={e => setQuickTopic(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && quickTopic.trim()) {
                  setTopic(quickTopic);
                  requestGeneration(() => {
                    setTopic(quickTopic);
                    setTimeout(() => handleGenerate(), 50);
                  });
                }
              }}
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 text-sm"
              placeholder="Enter your blog title or topic and hit Generate →"
            />
            <Button
              onClick={() => {
                if (!quickTopic.trim()) return;
                setTopic(quickTopic);
                requestGeneration(() => {
                  setTopic(quickTopic);
                  setTimeout(() => handleGenerate(), 50);
                });
              }}
              disabled={!quickTopic.trim() || isGenerating}
              className="shrink-0 bg-violet-600 hover:bg-violet-500 text-white rounded-xl px-5 h-12 font-semibold">
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate Blog →"}
            </Button>
          </div>
          <p className="text-white/25 text-xs mt-2">Uses smart defaults (Standard length · Conversational · 4 AI images) · or configure below ↓</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-3">
            {STEPS.map((s, i) => (
              <button key={s} onClick={() => i < step && setStep(i)}
                className={`flex flex-col items-center gap-1 ${i < step ? "cursor-pointer" : "cursor-default"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < step ? "bg-violet-500 text-white" : i === step ? "bg-violet-500/30 border-2 border-violet-500 text-violet-400" : "bg-white/5 border border-white/10 text-white/30"}`}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span className={`text-[10px] hidden sm:block ${i === step ? "text-violet-400 font-semibold" : "text-white/30"}`}>{s}</span>
              </button>
            ))}
          </div>
          <div className="h-1 bg-white/10 rounded-full">
            <div className="h-full bg-gradient-to-r from-violet-500 to-primary rounded-full transition-all duration-500"
              style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
          </div>
        </div>

        <div className="glass-card rounded-2xl border border-white/10 p-6 md:p-8 min-h-80">
          <AnimatePresence mode="wait">

            {/* Step 0: Template */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-xl font-bold text-white mb-1">Choose your blog template 🎨</h3>
                <p className="text-white/50 text-sm mb-5">This sets the visual style of your downloaded blog</p>
                <div className="grid grid-cols-2 gap-4">
                  {TEMPLATES.map(t => (
                    <button key={t.id} onClick={() => setTemplate(t.id)}
                      className={`relative flex flex-col gap-3 p-4 rounded-2xl border-2 transition-all text-left overflow-hidden ${template === t.id ? "border-violet-500 shadow-[0_0_24px_rgba(139,92,246,0.25)]" : "border-white/10 hover:border-white/25"}`}>
                      {/* Mini preview */}
                      <div className="w-full h-20 rounded-xl overflow-hidden border border-white/10"
                        style={{ background: t.preview.bg, fontFamily: t.preview.font }}>
                        <div className="h-3 w-full" style={{ background: t.preview.accent }} />
                        <div className="p-2 space-y-1.5">
                          <div className="h-2 rounded-full w-3/4" style={{ background: t.preview.accent + "aa" }} />
                          <div className="h-1.5 rounded-full w-full" style={{ background: t.preview.text + "44" }} />
                          <div className="h-1.5 rounded-full w-5/6" style={{ background: t.preview.text + "33" }} />
                          <div className="h-1.5 rounded-full w-4/6" style={{ background: t.preview.text + "22" }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span>{t.emoji}</span>
                          <span className={`text-sm font-bold ${template === t.id ? "text-violet-300" : "text-white/80"}`}>{t.label}</span>
                          {template === t.id && <span className="ml-auto text-xs text-violet-400 font-medium">Selected ✓</span>}
                        </div>
                        <p className="text-xs text-white/40 mt-0.5">{t.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 1: Idea */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-xl font-bold text-white mb-1">What's your blog idea? 💭</h3>
                <p className="text-white/50 text-sm mb-5">A title, question, or rough idea — we'll handle the rest</p>
                <textarea className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 resize-none text-sm h-28"
                  placeholder={`e.g., "How small businesses can use AI to double their online sales" or just "AI for small business marketing"`}
                  value={topic} onChange={e => { setTopic(e.target.value); setSuggestedTitles([]); }} autoFocus />
                <button onClick={fetchTitles} disabled={!topic.trim() || loadingTitles}
                  className="mt-3 flex items-center gap-2 text-sm text-violet-400/70 hover:text-violet-400 transition-colors disabled:opacity-40">
                  {loadingTitles ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
                  Suggest 5 click-worthy titles
                </button>
                {suggestedTitles.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {suggestedTitles.map((t, i) => (
                      <button key={i} onClick={() => setTopic(t)}
                        className="w-full text-left text-sm text-white/60 hover:text-white bg-white/5 hover:bg-violet-500/10 border border-white/5 hover:border-violet-500/30 rounded-xl px-4 py-3 transition-all">
                        <span className="text-violet-400/60 mr-2">→</span>{t}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 2: Style */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-xl font-bold text-white mb-1">What kind of blog post? 📝</h3>
                <p className="text-white/50 text-sm mb-5">Choose the format that fits your goal</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {BLOG_STYLES.map(s => (
                    <button key={s.id} onClick={() => setBlogStyle(s.id)}
                      className={`flex flex-col items-start gap-1 p-4 rounded-xl border transition-all text-left ${blogStyle === s.id ? "border-violet-500/60 bg-violet-500/15" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                      <span className="text-2xl">{s.emoji}</span>
                      <span className={`text-sm font-semibold ${blogStyle === s.id ? "text-violet-300" : "text-white/80"}`}>{s.label}</span>
                      <span className="text-xs text-white/40">{s.desc}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Voice */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-xl font-bold text-white mb-1">What's your writing voice? 🎙️</h3>
                <p className="text-white/50 text-sm mb-5">Pick the tone that sounds like you</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {VOICES.map(v => (
                    <button key={v.id} onClick={() => setVoice(v.id)}
                      className={`flex flex-col items-start gap-1 p-4 rounded-xl border transition-all text-left ${voice === v.id ? "border-violet-500/60 bg-violet-500/15" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                      <span className="text-2xl">{v.emoji}</span>
                      <span className={`text-sm font-semibold ${voice === v.id ? "text-violet-300" : "text-white/80"}`}>{v.label}</span>
                      <span className="text-xs text-white/40">{v.desc}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 4: Images */}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Images 🖼️</h3>
                  <p className="text-white/50 text-sm">Set how many images, their style, and your prompt ideas</p>
                </div>

                {/* Count selector */}
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-3">Number of images</label>
                  <div className="flex flex-wrap gap-2">
                    {IMAGE_COUNT_OPTIONS.map(n => (
                      <button key={n} onClick={() => setImageCount(n)}
                        className={`w-12 h-12 rounded-xl border text-sm font-bold transition-all ${imageCount === n ? "border-violet-500/60 bg-violet-500/20 text-violet-300" : "border-white/10 bg-white/5 text-white/50 hover:border-white/30"}`}>
                        {n === 0 ? "—" : n}
                      </button>
                    ))}
                  </div>
                  {imageCount > 0 && <p className="text-xs text-white/40 mt-2">Placed at the cover and after each section heading</p>}
                </div>

                {imageCount > 0 && (
                  <>
                    {/* Style */}
                    <div>
                      <label className="block text-sm font-medium text-white/60 mb-3">Image style</label>
                      <div className="grid grid-cols-3 gap-2">
                        {IMAGE_STYLES.map(s => (
                          <button key={s.id} onClick={() => setImageStyle(s.id)}
                            className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-left ${imageStyle === s.id ? "border-violet-500/60 bg-violet-500/15" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                            <span>{s.emoji}</span>
                            <span className={`text-xs font-semibold ${imageStyle === s.id ? "text-violet-300" : "text-white/70"}`}>{s.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Prompt mode */}
                    <div>
                      <label className="block text-sm font-medium text-white/60 mb-3">Image prompts</label>
                      <div className="flex gap-2 mb-4 flex-wrap">
                        {([
                          { id: "auto", label: "✨ Auto", desc: "AI picks prompts from your sections" },
                          { id: "one_for_all", label: "🖊 One prompt", desc: "Same idea applied to all images" },
                          { id: "per_image", label: "🎛 Per image", desc: "Custom prompt for each image" },
                        ] as { id: ImgPromptMode; label: string; desc: string }[]).map(m => (
                          <button key={m.id} onClick={() => setImgPromptMode(m.id)}
                            className={`flex-1 min-w-[110px] flex flex-col items-center gap-1 p-3 rounded-xl border text-xs transition-all ${imgPromptMode === m.id ? "border-violet-500/60 bg-violet-500/15 text-violet-300" : "border-white/10 bg-white/5 text-white/50 hover:border-white/20"}`}>
                            <span className="font-bold">{m.label}</span>
                            <span className="text-white/30 text-[10px] text-center leading-tight">{m.desc}</span>
                          </button>
                        ))}
                      </div>

                      {imgPromptMode === "one_for_all" && (
                        <div>
                          <p className="text-xs text-white/40 mb-2">Describe the visual idea for all images (leave blank to auto-generate)</p>
                          <textarea
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 resize-none text-sm h-20"
                            placeholder={`e.g., "modern office scene with tech devices and charts"`}
                            value={globalImagePrompt}
                            onChange={e => setGlobalImagePrompt(e.target.value)}
                          />
                        </div>
                      )}

                      {imgPromptMode === "per_image" && (
                        <div className="space-y-2">
                          <p className="text-xs text-white/40 mb-2">Describe each image (leave blank to auto-generate from section heading)</p>
                          {Array.from({ length: imageCount }, (_, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-xs text-white/30 w-16 shrink-0">Image {i + 1}</span>
                              <input
                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 text-sm"
                                placeholder={i === 0 ? "Cover image idea…" : `Section ${i} image idea…`}
                                value={perImagePrompts[i] ?? ""}
                                onChange={e => setPerImagePrompts(prev => { const n = [...prev]; n[i] = e.target.value; return n; })}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {imgPromptMode === "auto" && (
                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                          <p className="text-xs text-white/40">
                            <span className="text-violet-400">✓ Auto mode:</span> Prompts are generated from your blog topic and each section heading. You can regenerate individual images after the blog is created.
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* Step 5: Details */}
            {step === 5 && (
              <motion.div key="s5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-xl font-bold text-white mb-1">Final details ⚙️</h3>
                <p className="text-white/50 text-sm mb-5">All optional — defaults work great</p>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">Article length</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {WORD_COUNTS.map(w => (
                        <button key={w.value} onClick={() => setWordCount(w.value)}
                          className={`p-3 rounded-xl border text-left transition-all ${wordCount === w.value ? "border-violet-500/60 bg-violet-500/15" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                          <div className={`text-sm font-semibold ${wordCount === w.value ? "text-violet-300" : "text-white/80"}`}>{w.label}</div>
                          <div className="text-xs text-white/40">{w.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">Focus keywords <span className="text-white/30">(optional)</span></label>
                    <input className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 text-sm"
                      placeholder="e.g., AI marketing tools, small business automation"
                      value={keywords} onChange={e => setKeywords(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">Language</label>
                    <select className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50 text-sm"
                      value={language} onChange={e => setLanguage(e.target.value)}>
                      {LANGUAGES_35.map(l => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                    <p className="text-xs text-white/30 mt-1">35 languages supported</p>
                  </div>
                  {/* Summary */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                    <p className="text-xs text-white/30 font-semibold uppercase tracking-wide mb-2">Your blog at a glance</p>
                    {[
                      ["Template", `${selectedTemplate.emoji} ${selectedTemplate.label}`],
                      ["Topic", topic.slice(0, 50) + (topic.length > 50 ? "…" : "")],
                      ["Style", BLOG_STYLES.find(s => s.id === blogStyle)?.label ?? ""],
                      ["Voice", VOICES.find(v => v.id === voice)?.label ?? ""],
                      ["Images", imageCount === 0 ? "None" : `${imageCount} × ${imageStyle}`],
                      ["Length", WORD_COUNTS.find(w => w.value === wordCount)?.label ?? ""],
                    ].map(([k, v]) => (
                      <div key={k} className="flex gap-3 text-sm">
                        <span className="text-white/30 w-20 shrink-0">{k}</span>
                        <span className="text-white/70">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3 mt-6">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)}
              className="border-white/10 text-white/50 hover:bg-white/5 rounded-xl h-12 px-5">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          )}
          {!isLastStep ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canGoNext}
              className="flex-1 bg-violet-600 hover:bg-violet-500 text-white rounded-xl h-12 font-semibold text-base disabled:opacity-40">
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={() => requestGeneration(handleGenerate)} disabled={isGenerating || !topic.trim()}
              className="flex-1 bg-gradient-to-r from-violet-600 to-primary hover:from-violet-500 text-white rounded-xl h-12 font-bold text-base shadow-[0_0_30px_rgba(139,92,246,0.3)] disabled:opacity-40">
              {isGenerating ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Writing your blog...</> : <><Sparkles className="w-5 h-5 mr-2" />Generate Blog</>}
            </Button>
          )}
        </div>
        {error && <div className="mt-4 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">{error}</div>}
      </div>
    </section>
  );
}
