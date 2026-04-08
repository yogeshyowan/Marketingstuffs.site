import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, PenTool, Search, LayoutTemplate, Loader2, Copy, Check, ChevronDown, Lightbulb, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const TONES = ["Professional", "Conversational", "Witty", "Persuasive", "Informative", "Inspirational", "Friendly", "Authoritative"];
const WORD_COUNTS = [300, 500, 800, 1000, 1200, 1500, 2000, 2500];
const INTRO_STYLES = ["Engaging Hook", "Shocking Statistic", "Story Opening", "Question Lead", "Contrarian View", "News Angle"];
const LANGUAGES = ["English", "Spanish", "French", "German", "Portuguese", "Italian", "Dutch", "Hindi"];

function renderMarkdown(text: string): string {
  return text
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-white mt-6 mb-3 leading-tight">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold text-white mt-5 mb-2">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-white/90 mt-4 mb-2">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic text-white/80">$1</em>')
    .replace(/^- (.+)$/gm, '<li class="ml-5 list-disc text-white/80 mb-1">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-5 list-decimal text-white/80 mb-1">$1</li>')
    .replace(/\n\n/g, '</p><p class="text-white/70 leading-relaxed mb-3">')
    .replace(/^(?!<[hlp])(.+)$/gm, (l) => l.trim() ? `<p class="text-white/70 leading-relaxed mb-3">${l}</p>` : "");
}

export default function BlogWriterSection() {
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [tone, setTone] = useState("Professional");
  const [wordCount, setWordCount] = useState(800);
  const [language, setLanguage] = useState("English");
  const [introStyle, setIntroStyle] = useState("Engaging Hook");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
  const [loadingTitles, setLoadingTitles] = useState(false);
  const [activeTab, setActiveTab] = useState<"write" | "settings">("write");
  const abortRef = useRef<AbortController | null>(null);

  const wordCountEstimate = generatedContent.split(/\s+/).filter(Boolean).length;

  async function fetchTitleSuggestions() {
    if (!topic.trim()) return;
    setLoadingTitles(true);
    try {
      const res = await fetch("/api/ai/suggest-blog-titles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, count: 5 }),
      });
      const data = await res.json() as { titles?: string[] };
      setSuggestedTitles(data.titles ?? []);
    } catch {
      /* silent — titles are optional */
    } finally {
      setLoadingTitles(false);
    }
  }

  async function handleGenerate() {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setGeneratedContent("");
    setError("");
    setSuggestedTitles([]);
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/ai/generate-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, keywords, tone: tone.toLowerCase(), wordCount, language, introStyle: introStyle.toLowerCase() }),
        signal: abortRef.current.signal,
      });
      if (!res.ok) throw new Error("Request failed");
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
              if (d.error) { setError(d.error); }
              if (d.content) setGeneratedContent(p => p + d.content);
            } catch { /* skip */ }
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError")
        setError("Generation failed. Try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleStop() {
    abortRef.current?.abort();
    setIsGenerating(false);
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
    a.href = url;
    a.download = `blog-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section id="blog-writer" className="py-24 relative overflow-hidden">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="container px-4 mx-auto">
        <div className="flex flex-col lg:flex-row items-start gap-12">

          {/* Left: Form */}
          <div className="lg:w-5/12 w-full">
            <div className="inline-flex items-center px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-6">
              AI Blog Writer
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              AI Blog Writer That <span className="gradient-text">Ranks & Converts</span>
            </h2>
            <p className="text-base text-muted-foreground mb-6 leading-relaxed">
              Input your topic, set your preferences, and publish SEO-optimized articles that drive traffic. Powered entirely by free AI — zero subscription cost.
            </p>

            {/* Tab bar */}
            <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-6">
              <button onClick={() => setActiveTab("write")} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "write" ? "bg-primary/20 text-primary" : "text-white/50 hover:text-white"}`}>
                Write
              </button>
              <button onClick={() => setActiveTab("settings")} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "settings" ? "bg-primary/20 text-primary" : "text-white/50 hover:text-white"}`}>
                Settings
              </button>
            </div>

            <div className="glass-card rounded-2xl border border-white/10 p-5 space-y-4">
              {activeTab === "write" ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Blog Topic *</label>
                    <input
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors text-sm"
                      placeholder="e.g., How AI is Revolutionizing Content Marketing in 2025"
                      value={topic}
                      onChange={e => setTopic(e.target.value)}
                    />
                    <button
                      onClick={fetchTitleSuggestions}
                      disabled={!topic.trim() || loadingTitles}
                      className="mt-2 flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary transition-colors disabled:opacity-40"
                    >
                      {loadingTitles ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lightbulb className="w-3 h-3" />}
                      Suggest 5 click-worthy titles
                    </button>
                    {suggestedTitles.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {suggestedTitles.map((t, i) => (
                          <button
                            key={i}
                            onClick={() => setTopic(t)}
                            className="w-full text-left text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg px-3 py-2 transition-colors"
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Focus Keywords <span className="text-white/30">(optional)</span></label>
                    <input
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors text-sm"
                      placeholder="e.g., AI writing, content strategy, SEO tools"
                      value={keywords}
                      onChange={e => setKeywords(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-white/60 mb-1.5">Tone</label>
                      <div className="relative">
                        <select className="w-full appearance-none bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary/50 pr-8" value={tone} onChange={e => setTone(e.target.value)}>
                          {TONES.map(t => <option key={t}>{t}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-white/60 mb-1.5">Word Count</label>
                      <div className="relative">
                        <select className="w-full appearance-none bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary/50 pr-8" value={wordCount} onChange={e => setWordCount(Number(e.target.value))}>
                          {WORD_COUNTS.map(w => <option key={w} value={w}>{w} words</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-white/60 mb-1.5">Language</label>
                      <div className="relative">
                        <select className="w-full appearance-none bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary/50 pr-8" value={language} onChange={e => setLanguage(e.target.value)}>
                          {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-white/60 mb-1.5">Intro Style</label>
                      <div className="relative">
                        <select className="w-full appearance-none bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary/50 pr-8" value={introStyle} onChange={e => setIntroStyle(e.target.value)}>
                          {INTRO_STYLES.map(s => <option key={s}>{s}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 text-white h-11 font-semibold rounded-xl text-sm"
                  onClick={handleGenerate}
                  disabled={isGenerating || !topic.trim()}
                >
                  {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Writing...</> : "Generate Blog Post →"}
                </Button>
                {isGenerating && (
                  <Button variant="outline" className="border-white/20 text-white/70 hover:bg-white/10 h-11 rounded-xl text-sm" onClick={handleStop}>
                    Stop
                  </Button>
                )}
              </div>
            </div>

            <ul className="space-y-2.5 mt-6">
              {["100% free — zero AI credit cost", "8 languages supported", "SEO-optimized structure with meta data", "Stream output in real time", "Download as Markdown"].map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-white/60 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Output */}
          <div className="lg:w-7/12 w-full lg:sticky lg:top-24">
            <AnimatePresence mode="wait">
              {!generatedContent && !isGenerating && (
                <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="glass-card rounded-2xl border border-white/10 p-10 min-h-[500px] flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
                    <PenTool className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Your blog post appears here</h3>
                  <p className="text-white/40 text-sm max-w-xs">Enter your topic and hit Generate. The article streams live as it's written — no waiting.</p>
                  <div className="mt-8 grid grid-cols-3 gap-4 w-full max-w-xs">
                    {[{ icon: PenTool, label: "AI Written" }, { icon: Search, label: "SEO Ready" }, { icon: LayoutTemplate, label: "Structured" }].map(({ icon: Icon, label }) => (
                      <div key={label} className="glass-card rounded-xl p-3 flex flex-col items-center gap-2 border border-white/5">
                        <Icon className="w-5 h-5 text-primary" />
                        <span className="text-xs text-white/50">{label}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {isGenerating && !generatedContent && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="glass-card rounded-2xl border border-white/10 p-10 min-h-[200px] flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-white/50 text-sm">Selecting best free AI model...</p>
                </motion.div>
              )}

              {generatedContent && (
                <motion.div key="content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-2xl border border-white/10 overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
                    <div className="flex items-center gap-3">
                      {isGenerating && <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
                      <span className="text-sm text-white/50">{wordCountEstimate} words</span>
                      <span className="text-xs text-white/30">•</span>
                      <span className="text-xs text-green-400/70 font-medium">Free AI</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setGeneratedContent(""); setSuggestedTitles([]); }}
                        className="text-white/30 hover:text-white/60 transition-colors">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button onClick={handleDownload} disabled={isGenerating}
                        className="text-white/30 hover:text-white/60 transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                      <button onClick={handleCopy} disabled={isGenerating}
                        className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors">
                        {copied ? <><Check className="w-4 h-4" />Copied</> : <><Copy className="w-4 h-4" />Copy</>}
                      </button>
                    </div>
                  </div>
                  <div className="p-6 max-h-[600px] overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(generatedContent) }} />
                  {!isGenerating && (
                    <div className="px-6 pb-5 pt-2 border-t border-white/5 flex gap-2">
                      <Button size="sm" onClick={handleGenerate} variant="outline" className="border-white/10 text-white/50 hover:bg-white/5 text-xs h-8">
                        <RefreshCw className="w-3 h-3 mr-1" /> Regenerate
                      </Button>
                      <Button size="sm" onClick={handleDownload} className="bg-primary/20 text-primary hover:bg-primary/30 text-xs h-8">
                        <Download className="w-3 h-3 mr-1" /> Download .md
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            {error && (
              <div className="mt-3 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">{error}</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
