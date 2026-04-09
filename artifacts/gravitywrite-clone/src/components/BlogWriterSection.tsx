import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PenTool, Loader2, Copy, Check, Download, RefreshCw,
  Lightbulb, ChevronRight, ChevronLeft, Sparkles, Edit3, Wand2, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const BLOG_STYLES = [
  { id: "how-to", emoji: "🛠️", label: "How-To Guide", desc: "Step-by-step instructions" },
  { id: "listicle", emoji: "📝", label: "Listicle", desc: "Top 10, Best of..." },
  { id: "opinion", emoji: "💡", label: "Opinion / Thought Leadership", desc: "Your expert take" },
  { id: "case-study", emoji: "📊", label: "Case Study", desc: "Story-driven results" },
  { id: "news", emoji: "📰", label: "News & Trends", desc: "What's happening now" },
  { id: "review", emoji: "⭐", label: "Review", desc: "Honest product/service review" },
];

const VOICES = [
  { id: "professional", emoji: "👔", label: "Professional", desc: "Authoritative, trusted, formal" },
  { id: "conversational", emoji: "☕", label: "Conversational", desc: "Friendly, casual, relatable" },
  { id: "inspiring", emoji: "🔥", label: "Inspiring", desc: "Motivational, energetic, bold" },
  { id: "educational", emoji: "🎓", label: "Educational", desc: "Clear, structured, thorough" },
  { id: "witty", emoji: "😄", label: "Witty", desc: "Fun, clever, memorable" },
  { id: "storytelling", emoji: "📖", label: "Storytelling", desc: "Narrative-driven, emotional" },
];

const IMAGE_STYLES = [
  { id: "photography", emoji: "📷", label: "Photography", desc: "Real, authentic photos" },
  { id: "illustration", emoji: "🎨", label: "Illustration", desc: "Artistic, hand-drawn style" },
  { id: "infographic", emoji: "📊", label: "Infographic", desc: "Data visualizations" },
  { id: "minimal", emoji: "⬜", label: "Minimalist", desc: "Clean, simple, elegant" },
  { id: "3d", emoji: "🎭", label: "3D / CGI", desc: "Polished 3D renders" },
  { id: "none", emoji: "❌", label: "No Images", desc: "Text-only article" },
];

const WORD_COUNTS = [
  { value: 500, label: "Short", desc: "~2 min read" },
  { value: 800, label: "Standard", desc: "~4 min read" },
  { value: 1200, label: "Long-form", desc: "~6 min read" },
  { value: 2000, label: "In-depth", desc: "~10 min read" },
];

const QUICK_EDITS = [
  "Make it shorter and punchier",
  "Make the tone more casual",
  "Improve the SEO and headlines",
  "Add more examples and statistics",
  "Strengthen the intro — make it more attention-grabbing",
  "Add a stronger call-to-action at the end",
  "Break up long paragraphs for easier reading",
  "Add a FAQ section at the end",
];

function renderMarkdown(text: string): string {
  return text
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-white mt-6 mb-3 leading-tight">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold text-violet-300 mt-5 mb-2">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-white/90 mt-4 mb-2">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic text-white/80">$1</em>')
    .replace(/^- (.+)$/gm, '<li class="ml-5 list-disc text-white/75 mb-1.5">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-5 list-decimal text-white/75 mb-1.5">$1</li>')
    .replace(/\n\n/g, '</p><p class="text-white/65 leading-relaxed mb-4">')
    .replace(/^(?!<[hlp])(.+)$/gm, (l) => l.trim() ? `<p class="text-white/65 leading-relaxed mb-4">${l}</p>` : "");
}

const STEPS = ["Your Idea", "Blog Style", "Your Voice", "Images", "Details"];

export default function BlogWriterSection() {
  const [step, setStep] = useState(0);
  const [topic, setTopic] = useState("");
  const [blogStyle, setBlogStyle] = useState("how-to");
  const [voice, setVoice] = useState("conversational");
  const [imageStyle, setImageStyle] = useState("photography");
  const [imageIdea, setImageIdea] = useState("");
  const [wordCount, setWordCount] = useState(800);
  const [keywords, setKeywords] = useState("");
  const [language, setLanguage] = useState("English");

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
  const [loadingTitles, setLoadingTitles] = useState(false);

  // Edit mode state
  const [editOpen, setEditOpen] = useState(false);
  const [editInstruction, setEditInstruction] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState("");

  const abortRef = useRef<AbortController | null>(null);

  const wordEstimate = generatedContent.split(/\s+/).filter(Boolean).length;

  async function fetchTitles() {
    if (!topic.trim()) return;
    setLoadingTitles(true);
    try {
      const res = await fetch("/api/ai/suggest-blog-titles", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, count: 5 }),
      });
      const data = await res.json() as { titles?: string[] };
      setSuggestedTitles(data.titles ?? []);
    } catch { /* optional */ }
    finally { setLoadingTitles(false); }
  }

  async function generateImage() {
    if (imageStyle === "none" || !imageIdea.trim()) return;
    const prompt = `${imageIdea} for a blog about "${topic}", ${imageStyle} style, high quality, professional`;
    const encoded = encodeURIComponent(prompt);
    setGeneratedImageUrl(`https://image.pollinations.ai/prompt/${encoded}?width=1200&height=630&nologo=true&enhance=true&model=flux`);
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setGeneratedContent("");
    setError("");
    setEditOpen(false);
    abortRef.current = new AbortController();

    if (imageStyle !== "none" && imageIdea.trim()) generateImage();

    const selectedStyle = BLOG_STYLES.find(s => s.id === blogStyle)?.label ?? blogStyle;
    const selectedVoice = VOICES.find(v => v.id === voice)?.label ?? voice;

    try {
      const res = await fetch("/api/ai/generate-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, keywords, tone: selectedVoice.toLowerCase(), wordCount, language, introStyle: blogStyle === "how-to" ? "step opening" : blogStyle === "opinion" ? "contrarian view" : "engaging hook", blogStyle: selectedStyle }),
        signal: abortRef.current.signal,
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const d = JSON.parse(line.slice(6));
              if (d.error) setError(d.error);
              if (d.content) setGeneratedContent(p => p + d.content);
            } catch { /* skip */ }
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError")
        setError("Generation failed. Please try again.");
    } finally { setIsGenerating(false); }
  }

  async function handleEdit() {
    if (!editInstruction.trim()) return;
    setIsEditing(true);
    setEditError("");
    const previous = generatedContent;

    try {
      setGeneratedContent("");
      const res = await fetch("/api/ai/improve-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: previous, instruction: editInstruction }),
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const d = JSON.parse(line.slice(6));
              if (d.error) { setEditError(d.error); setGeneratedContent(previous); }
              if (d.content) setGeneratedContent(p => p + d.content);
            } catch { /* skip */ }
          }
        }
      }
      setEditInstruction("");
      setEditOpen(false);
    } catch {
      setGeneratedContent(previous);
      setEditError("Edit failed. Please try again.");
    } finally { setIsEditing(false); }
  }

  function handleCopy() {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([generatedContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `blog-${Date.now()}.md`; a.click();
    URL.revokeObjectURL(url);
  }

  const canGoNext = step === 0 ? topic.trim().length > 0 : true;
  const isLastStep = step === STEPS.length - 1;

  if (generatedContent || isGenerating) {
    return (
      <section id="blog-writer" className="py-24 relative overflow-hidden">
        <div className="absolute left-0 top-1/3 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="container px-4 mx-auto max-w-4xl">

          {/* Header bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <PenTool className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Blog Writer</h2>
                <p className="text-white/40 text-xs truncate max-w-xs">{topic}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isGenerating && !isEditing && (
                <Button size="sm" onClick={() => setEditOpen(o => !o)}
                  className={`text-xs h-8 rounded-xl gap-1.5 ${editOpen ? "bg-violet-500/30 text-violet-300 border border-violet-500/50" : "bg-violet-500/15 text-violet-400 border border-violet-500/20 hover:bg-violet-500/25"}`}>
                  <Edit3 className="w-3.5 h-3.5" /> Edit Blog
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => { setGeneratedContent(""); setStep(0); setEditOpen(false); }}
                className="border-white/10 text-white/40 hover:bg-white/5 text-xs h-8 rounded-xl">
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> New Blog
              </Button>
            </div>
          </div>

          {/* Edit panel */}
          <AnimatePresence>
            {editOpen && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-5 rounded-2xl border border-violet-500/30 bg-violet-500/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-violet-400" />
                    <span className="text-sm font-semibold text-violet-300">What would you like to change?</span>
                  </div>
                  <button onClick={() => setEditOpen(false)} className="text-white/30 hover:text-white/60">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick suggestions */}
                <div className="flex flex-wrap gap-2">
                  {QUICK_EDITS.map(q => (
                    <button key={q} onClick={() => setEditInstruction(q)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${editInstruction === q ? "border-violet-500/60 bg-violet-500/25 text-violet-300" : "border-white/10 bg-white/5 text-white/50 hover:border-violet-500/40 hover:text-violet-300"}`}>
                      {q}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <input
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 text-sm"
                    placeholder="Or type your own edit... (e.g., 'add a section about pricing' or 'make the tone warmer')"
                    value={editInstruction}
                    onChange={e => setEditInstruction(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleEdit()}
                  />
                  <Button onClick={handleEdit} disabled={isEditing || !editInstruction.trim()}
                    className="bg-violet-600 hover:bg-violet-500 text-white rounded-xl px-5 text-sm h-10 shrink-0">
                    {isEditing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Wand2 className="w-4 h-4 mr-1.5" />Apply</>}
                  </Button>
                </div>
                {editError && <p className="text-red-400 text-xs">{editError}</p>}
              </motion.div>
            )}
          </AnimatePresence>

          {generatedImageUrl && (
            <div className="mb-5 rounded-2xl overflow-hidden border border-white/10">
              <img src={generatedImageUrl} alt="Blog cover" className="w-full h-56 object-cover" />
            </div>
          )}

          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
              <div className="flex items-center gap-3">
                {(isGenerating || isEditing) && <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />}
                <span className="text-sm text-white/40">{wordEstimate} words</span>
                <span className="text-xs text-emerald-400/70 font-medium bg-emerald-400/10 px-2 py-0.5 rounded-full">Free AI</span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleDownload} disabled={isGenerating || isEditing} className="text-white/30 hover:text-white/70 transition-colors disabled:opacity-40">
                  <Download className="w-4 h-4" />
                </button>
                <button onClick={handleCopy} disabled={isGenerating || isEditing} className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors disabled:opacity-40">
                  {copied ? <><Check className="w-4 h-4 text-emerald-400" />Copied</> : <><Copy className="w-4 h-4" />Copy</>}
                </button>
              </div>
            </div>
            <div className="p-6 md:p-8 max-h-[640px] overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(generatedContent) }} />
            {!isGenerating && !isEditing && generatedContent && (
              <div className="px-6 pb-6 pt-3 border-t border-white/5 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => setEditOpen(true)}
                  className="bg-violet-500/15 text-violet-400 hover:bg-violet-500/25 border border-violet-500/20 text-xs h-8 rounded-lg gap-1.5">
                  <Edit3 className="w-3 h-3" /> Edit / Improve
                </Button>
                <Button size="sm" onClick={handleGenerate} variant="outline"
                  className="border-white/10 text-white/50 hover:bg-white/5 text-xs h-8 rounded-lg">
                  <RefreshCw className="w-3 h-3 mr-1.5" /> Regenerate
                </Button>
                <Button size="sm" onClick={handleDownload}
                  className="bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 border border-violet-500/30 text-xs h-8 rounded-lg">
                  <Download className="w-3 h-3 mr-1.5" /> Download .md
                </Button>
                <Button size="sm" onClick={handleCopy}
                  className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 text-xs h-8 rounded-lg">
                  {copied ? "Copied!" : <><Copy className="w-3 h-3 mr-1.5" />Copy All</>}
                </Button>
              </div>
            )}
          </div>
          {error && <div className="mt-4 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">{error}</div>}
        </div>
      </section>
    );
  }

  return (
    <section id="blog-writer" className="py-24 relative overflow-hidden">
      <div className="absolute left-0 top-1/3 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="container px-4 mx-auto max-w-3xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-sm font-medium mb-4">
            <PenTool className="w-4 h-4 mr-2" /> AI Blog Writer
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Write Blogs That <span className="text-violet-400">Get Found</span>
          </h2>
          <p className="text-white/50 text-lg">Answer 5 simple questions — we'll write a full, SEO-optimized article for you</p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-3">
            {STEPS.map((s, i) => (
              <button key={s} onClick={() => i < step && setStep(i)}
                className={`flex flex-col items-center gap-1.5 ${i <= step ? "cursor-pointer" : "cursor-default"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < step ? "bg-violet-500 text-white" : i === step ? "bg-violet-500/30 border-2 border-violet-500 text-violet-400" : "bg-white/5 border border-white/10 text-white/30"}`}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span className={`text-xs hidden sm:block ${i === step ? "text-violet-400 font-medium" : "text-white/30"}`}>{s}</span>
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

            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-xl font-bold text-white mb-2">What's your blog idea? 💭</h3>
                <p className="text-white/50 text-sm mb-5">Type your topic below — it can be a title, question, or just a rough idea</p>
                <textarea
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 resize-none text-sm h-28 transition-colors"
                  placeholder={`e.g., "How small businesses can use AI to double their online sales" or just "AI for small business marketing"`}
                  value={topic} onChange={e => { setTopic(e.target.value); setSuggestedTitles([]); }} autoFocus />
                <button onClick={fetchTitles} disabled={!topic.trim() || loadingTitles}
                  className="mt-3 flex items-center gap-2 text-sm text-violet-400/70 hover:text-violet-400 transition-colors disabled:opacity-40">
                  {loadingTitles ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
                  Suggest 5 click-worthy titles based on my idea
                </button>
                {suggestedTitles.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <p className="text-xs text-white/30 font-medium uppercase tracking-wide">Pick one or use as inspiration:</p>
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

            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-xl font-bold text-white mb-2">What kind of blog post? 📝</h3>
                <p className="text-white/50 text-sm mb-5">Choose the style that fits your goal</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {BLOG_STYLES.map(s => (
                    <button key={s.id} onClick={() => setBlogStyle(s.id)}
                      className={`flex flex-col items-start gap-1 p-4 rounded-xl border transition-all text-left ${blogStyle === s.id ? "border-violet-500/60 bg-violet-500/15 shadow-[0_0_20px_rgba(139,92,246,0.15)]" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                      <span className="text-2xl">{s.emoji}</span>
                      <span className={`text-sm font-semibold ${blogStyle === s.id ? "text-violet-300" : "text-white/80"}`}>{s.label}</span>
                      <span className="text-xs text-white/40">{s.desc}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-xl font-bold text-white mb-2">What's your writing voice? 🎙️</h3>
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

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-xl font-bold text-white mb-2">What about images? 🖼️</h3>
                <p className="text-white/50 text-sm mb-5">Choose a visual style for your blog's cover</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                  {IMAGE_STYLES.map(s => (
                    <button key={s.id} onClick={() => setImageStyle(s.id)}
                      className={`flex flex-col items-start gap-1 p-4 rounded-xl border transition-all text-left ${imageStyle === s.id ? "border-violet-500/60 bg-violet-500/15" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                      <span className="text-2xl">{s.emoji}</span>
                      <span className={`text-sm font-semibold ${imageStyle === s.id ? "text-violet-300" : "text-white/80"}`}>{s.label}</span>
                      <span className="text-xs text-white/40">{s.desc}</span>
                    </button>
                  ))}
                </div>
                {imageStyle !== "none" && (
                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">Describe the image you want:</label>
                    <input className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 text-sm"
                      placeholder={`e.g., "A business owner working on a laptop in a modern cafe, warm lighting"`}
                      value={imageIdea} onChange={e => setImageIdea(e.target.value)} />
                  </div>
                )}
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-xl font-bold text-white mb-2">Fine-tune your blog ⚙️</h3>
                <p className="text-white/50 text-sm mb-5">All optional — defaults work great too</p>
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
                      placeholder="e.g., AI marketing tools, small business automation, ROI"
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
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {step > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {topic && <span className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1 text-white/50">📝 {topic.slice(0, 30)}{topic.length > 30 ? "…" : ""}</span>}
            {step > 1 && <span className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1 text-white/50">{BLOG_STYLES.find(s => s.id === blogStyle)?.emoji} {BLOG_STYLES.find(s => s.id === blogStyle)?.label}</span>}
            {step > 2 && <span className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1 text-white/50">{VOICES.find(v => v.id === voice)?.emoji} {VOICES.find(v => v.id === voice)?.label}</span>}
          </div>
        )}

        <div className="flex items-center gap-3 mt-6">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)}
              className="border-white/10 text-white/50 hover:bg-white/5 rounded-xl h-12 px-5">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          )}
          {!isLastStep ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canGoNext}
              className="flex-1 bg-violet-600 hover:bg-violet-500 text-white rounded-xl h-12 font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed">
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleGenerate} disabled={isGenerating || !topic.trim()}
              className="flex-1 bg-gradient-to-r from-violet-600 to-primary hover:from-violet-500 hover:to-primary/90 text-white rounded-xl h-12 font-bold text-base shadow-[0_0_30px_rgba(139,92,246,0.3)] disabled:opacity-40">
              {isGenerating ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Writing your blog...</> : <><Sparkles className="w-5 h-5 mr-2" />Generate Blog Post</>}
            </Button>
          )}
        </div>
        {error && <div className="mt-4 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">{error}</div>}
      </div>
    </section>
  );
}
