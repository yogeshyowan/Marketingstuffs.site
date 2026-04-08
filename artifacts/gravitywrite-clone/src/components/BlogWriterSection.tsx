import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, PenTool, Search, LayoutTemplate, Loader2, Copy, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const tones = ["Professional", "Conversational", "Witty", "Persuasive", "Informative", "Inspirational"];
const wordCounts = [500, 800, 1200, 1500, 2000];

function renderMarkdown(text: string) {
  return text
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-white mt-6 mb-3">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold text-white mt-5 mb-2">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-white/90 mt-4 mb-2">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic text-white/80">$1</em>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-white/80">$1</li>')
    .replace(/\n\n/g, '</p><p class="text-white/70 leading-relaxed mb-3">')
    .replace(/^(?!<[h|l|p])(.+)$/gm, (line) => line.trim() ? `<p class="text-white/70 leading-relaxed mb-3">${line}</p>` : "");
}

export default function BlogWriterSection() {
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [tone, setTone] = useState("Professional");
  const [wordCount, setWordCount] = useState(800);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  async function handleGenerate() {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setGeneratedContent("");
    setError("");
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/ai/generate-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, keywords, tone: tone.toLowerCase(), wordCount }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error("Failed to generate");
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
              const data = JSON.parse(line.slice(6));
              if (data.error) { setError(data.error); break; }
              if (data.done) break;
              if (data.content) setGeneratedContent(prev => prev + data.content);
            } catch { /* skip */ }
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") setError("Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="container px-4 mx-auto">
        <div className="flex flex-col lg:flex-row items-start gap-16">
          <div className="lg:w-1/2">
            <div className="inline-flex items-center px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-6">
              AI-Blog Writer
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              AI Blog Writer That <span className="gradient-text">Beats Your Competition</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Input your topic and watch our AI craft a well-structured, SEO-optimized article with click-worthy headlines that drive organic traffic. While others research for hours, you publish and rank.
            </p>

            <div className="glass-card rounded-2xl border border-white/10 p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Blog Topic *</label>
                <input
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors"
                  placeholder="e.g., 10 Ways AI is Transforming Content Marketing in 2025"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Focus Keywords (optional)</label>
                <input
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors"
                  placeholder="e.g., AI content, marketing automation, SEO"
                  value={keywords}
                  onChange={e => setKeywords(e.target.value)}
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-white/80 mb-2">Tone</label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 pr-10"
                      value={tone}
                      onChange={e => setTone(e.target.value)}
                    >
                      {tones.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-white/80 mb-2">Word Count</label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 pr-10"
                      value={wordCount}
                      onChange={e => setWordCount(Number(e.target.value))}
                    >
                      {wordCounts.map(w => <option key={w} value={w}>{w} words</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                  </div>
                </div>
              </div>
              <Button
                className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 text-white h-12 text-base font-semibold rounded-xl"
                onClick={handleGenerate}
                disabled={isGenerating || !topic.trim()}
              >
                {isGenerating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating your blog...</>
                ) : "Generate Blog Post →"}
              </Button>
            </div>

            <ul className="space-y-3 mt-8">
              {["SEO-optimized structure", "Click-worthy headlines", "Factually accurate content", "Plagiarism-free writing", "Export-ready markdown"].map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-white/70">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:w-1/2 w-full lg:sticky lg:top-24">
            <AnimatePresence mode="wait">
              {!generatedContent && !isGenerating && (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-card rounded-2xl border border-white/10 p-8 min-h-[500px] flex flex-col items-center justify-center text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
                    <PenTool className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Your blog will appear here</h3>
                  <p className="text-white/50 text-sm max-w-xs">Enter your topic and click generate to create an SEO-optimized blog post in seconds</p>
                  <div className="mt-8 grid grid-cols-3 gap-4 w-full max-w-xs">
                    {[{ icon: PenTool, label: "AI Written" }, { icon: Search, label: "SEO Ready" }, { icon: LayoutTemplate, label: "Structured" }].map(({ icon: Icon, label }) => (
                      <div key={label} className="glass-card rounded-xl p-3 flex flex-col items-center gap-2">
                        <Icon className="w-5 h-5 text-primary" />
                        <span className="text-xs text-white/60">{label}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {isGenerating && !generatedContent && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-card rounded-2xl border border-white/10 p-8 min-h-[500px] flex flex-col items-center justify-center"
                >
                  <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                  <p className="text-white/70">Writing your blog post...</p>
                </motion.div>
              )}

              {(generatedContent || (isGenerating && generatedContent)) && (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-2xl border border-white/10 overflow-hidden"
                >
                  <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-sm text-white/70">
                        {isGenerating ? "Writing..." : `${generatedContent.split(" ").length} words generated`}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopy}
                      disabled={isGenerating}
                      className="text-white/60 hover:text-white"
                    >
                      {copied ? <><Check className="w-4 h-4 mr-1" /> Copied!</> : <><Copy className="w-4 h-4 mr-1" /> Copy</>}
                    </Button>
                  </div>
                  <div
                    className="p-6 max-h-[600px] overflow-y-auto prose-sm prose-invert"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(generatedContent) }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <div className="mt-4 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-24">
          {[
            { icon: PenTool, color: "primary", title: "Intelligent Headlines", desc: "Stop guessing what works. Our AI analyzes trending topics and creates headlines that demand clicks and drive traffic." },
            { icon: Search, color: "blue-400", title: "Search Engine Mastery", desc: "Built-in SEO intelligence means your content doesn't just get written - it gets found by the right people." },
            { icon: LayoutTemplate, color: "purple-400", title: "Professional Structure", desc: "From compelling intros to persuasive conclusions, every article follows proven frameworks that keep readers engaged." },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="glass-card p-8 rounded-2xl">
              <div className={`w-12 h-12 rounded-lg bg-${color}/20 flex items-center justify-center mb-6`}>
                <Icon className={`w-6 h-6 text-${color}`} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
              <p className="text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
