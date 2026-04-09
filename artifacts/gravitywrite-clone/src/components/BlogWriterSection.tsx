import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PenTool, Loader2, Copy, Check, Download, RefreshCw,
  Lightbulb, ChevronRight, ChevronLeft, Sparkles, Edit3, Wand2, X,
  Share2, Image as ImageIcon, PenLine, FileText, RotateCcw, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
  { id: "how-to", emoji: "🛠️", label: "How-To Guide", desc: "Step-by-step instructions" },
  { id: "listicle", emoji: "📝", label: "Listicle", desc: "Top 10, Best of..." },
  { id: "opinion", emoji: "💡", label: "Opinion", desc: "Thought leadership" },
  { id: "case-study", emoji: "📊", label: "Case Study", desc: "Story-driven results" },
  { id: "news", emoji: "📰", label: "News & Trends", desc: "What's happening now" },
  { id: "review", emoji: "⭐", label: "Review", desc: "Honest evaluation" },
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
  { value: 600, label: "Short", desc: "~3 min read" },
  { value: 900, label: "Standard", desc: "~5 min read" },
  { value: 1400, label: "Long-form", desc: "~7 min read" },
  { value: 2000, label: "In-depth", desc: "~10 min read" },
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

    let fullContent = "";

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
            const d = JSON.parse(line.slice(6)) as { content?: string; error?: string };
            if (d.error) { setError(d.error); }
            if (d.content) {
              fullContent += d.content;
              setGeneratedContent(fullContent);
            }
          } catch { /* malformed chunk */ }
        }
      }

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
    const html = buildHtmlExport(contentWithImages, topic, template);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${topic.slice(0, 40).replace(/\s+/g, "-").toLowerCase()}-blog.html`;
    a.click();
    URL.revokeObjectURL(url);
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
                  <Button size="sm" onClick={() => { setEditOpen(o => !o); setDirectEditOpen(false); }}
                    className={`h-8 text-xs rounded-xl gap-1.5 ${editOpen ? "bg-violet-500/30 text-violet-300 border border-violet-500/50" : "bg-violet-500/15 text-violet-400 border border-violet-500/20 hover:bg-violet-500/25"}`}>
                    <Wand2 className="w-3.5 h-3.5" /> AI Edit
                  </Button>
                  <Button size="sm" onClick={() => { setDirectEditOpen(o => !o); setDirectEditContent(generatedContent); setEditOpen(false); }}
                    className={`h-8 text-xs rounded-xl gap-1.5 ${directEditOpen ? "bg-sky-500/30 text-sky-300 border border-sky-500/50" : "bg-sky-500/15 text-sky-400 border border-sky-500/20 hover:bg-sky-500/25"}`}>
                    <PenLine className="w-3.5 h-3.5" /> Direct Edit
                  </Button>
                  <Button size="sm" onClick={() => setShareOpen(o => !o)}
                    className="h-8 text-xs rounded-xl gap-1.5 bg-pink-500/15 text-pink-400 border border-pink-500/20 hover:bg-pink-500/25">
                    <Share2 className="w-3.5 h-3.5" /> Share
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
                    <span className="text-sm font-semibold text-sky-300">Direct Edit — write in markdown</span>
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
              <div className="max-w-3xl mx-auto px-8 py-10"
                dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(contentWithImages, template) }} />
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
                  <Share2 className="w-3 h-3" /> Share / Export
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
          <p className="text-white/50 text-lg">Pick a template, answer a few questions — get a full SEO blog with AI images</p>
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
                      {["English", "Spanish", "French", "German", "Portuguese", "Hindi", "Arabic", "Japanese"].map(l => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
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
            <Button onClick={handleGenerate} disabled={isGenerating || !topic.trim()}
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
