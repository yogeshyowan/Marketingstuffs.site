import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Code2, Loader2, Copy, Check, Download, Eye, ChevronDown, Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const WEBSITE_TYPES = [
  "SaaS Landing Page", "Portfolio", "E-commerce Store", "Agency Website",
  "Startup Landing Page", "Restaurant", "Blog", "Personal Brand", "Non-Profit", "App Landing Page"
];
const COLOR_SCHEMES = ["Professional Dark", "Clean Light", "Vibrant Colorful", "Minimal White", "Bold Dark", "Pastel Soft"];
const STYLES = ["Modern Minimalist", "Corporate Professional", "Creative Bold", "Elegant Luxury", "Playful Friendly", "Tech Startup"];

export default function WebsiteDeveloperSection() {
  const [websiteType, setWebsiteType] = useState("SaaS Landing Page");
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [audience, setAudience] = useState("");
  const [features, setFeatures] = useState("");
  const [colorScheme, setColorScheme] = useState("Professional Dark");
  const [style, setStyle] = useState("Modern Minimalist");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const steps = ["Type", "Details", "Style"];

  async function handleGenerate() {
    if (!description.trim() && !businessName.trim()) return;
    setIsGenerating(true);
    setGeneratedCode("");
    setError("");
    abortRef.current = new AbortController();

    const colorMap: Record<string, string> = {
      "Professional Dark": "dark",
      "Clean Light": "light",
      "Vibrant Colorful": "colorful",
      "Minimal White": "minimal",
      "Bold Dark": "dark",
      "Pastel Soft": "pastel",
    };

    try {
      const res = await fetch("/api/ai/generate-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteType,
          businessName,
          description,
          audience,
          features,
          colorScheme: colorMap[colorScheme] ?? "dark",
          style: style.toLowerCase(),
        }),
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
              if (d.content) setGeneratedCode(p => p + d.content);
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

  function handleCopy() {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([generatedCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${businessName || "website"}-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const previewSrc = generatedCode
    ? `data:text/html;charset=utf-8,${encodeURIComponent(generatedCode)}`
    : null;

  return (
    <section id="website-developer" className="py-24 relative overflow-hidden bg-white/[0.01] border-y border-white/5">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 via-transparent to-blue-900/10 pointer-events-none" />
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm font-medium mb-6">
            AI Website Developer
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-5">
            Build Complete Websites With <span className="text-cyan-400">Just a Description</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Describe your business and watch AI generate a full, beautiful, production-ready website in seconds. Real HTML + CSS — preview it live and download instantly.
          </p>
        </div>

        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
          {/* Left: Form */}
          <div className="lg:w-5/12 space-y-4">
            {/* Step nav */}
            <div className="flex items-center gap-2 mb-2">
              {steps.map((s, i) => (
                <button key={s} onClick={() => setActiveStep(i)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${activeStep === i ? "bg-cyan-500/20 border border-cyan-500/30 text-cyan-400" : "bg-white/5 text-white/40 hover:text-white/70"}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${activeStep === i ? "bg-cyan-500 text-black" : "bg-white/10 text-white/40"}`}>{i + 1}</span>
                  {s}
                </button>
              ))}
            </div>

            <div className="glass-card rounded-2xl border border-white/10 p-5 space-y-4">
              {activeStep === 0 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Website Type *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {WEBSITE_TYPES.map(t => (
                        <button key={t} onClick={() => setWebsiteType(t)}
                          className={`px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-all ${websiteType === t ? "border border-cyan-500/50 bg-cyan-500/15 text-cyan-400" : "border border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white/70"}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 rounded-xl h-10 text-sm"
                    onClick={() => setActiveStep(1)}>
                    Next: Add Details →
                  </Button>
                </>
              )}

              {activeStep === 1 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Business / Project Name</label>
                    <input className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-cyan-500/50 text-sm"
                      placeholder="e.g., NexaFlow" value={businessName} onChange={e => setBusinessName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">What does your business do? *</label>
                    <textarea className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-cyan-500/50 h-24 resize-none text-sm"
                      placeholder="e.g., We help e-commerce stores automate their inventory management and reduce stockouts by 90% using AI predictions."
                      value={description} onChange={e => setDescription(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Target Audience</label>
                    <input className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-cyan-500/50 text-sm"
                      placeholder="e.g., Small to medium e-commerce businesses" value={audience} onChange={e => setAudience(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Key Features / Services</label>
                    <input className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-cyan-500/50 text-sm"
                      placeholder="e.g., AI forecasting, real-time alerts, multi-channel sync" value={features} onChange={e => setFeatures(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="border-white/10 text-white/50 hover:bg-white/5 h-10 rounded-xl text-sm" onClick={() => setActiveStep(0)}>← Back</Button>
                    <Button className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 rounded-xl h-10 text-sm" onClick={() => setActiveStep(2)}>Next: Styling →</Button>
                  </div>
                </>
              )}

              {activeStep === 2 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Color Scheme</label>
                    <div className="grid grid-cols-2 gap-2">
                      {COLOR_SCHEMES.map(c => (
                        <button key={c} onClick={() => setColorScheme(c)}
                          className={`px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-all ${colorScheme === c ? "border border-cyan-500/50 bg-cyan-500/15 text-cyan-400" : "border border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white/70"}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Design Style</label>
                    <div className="relative">
                      <select className="w-full appearance-none bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50 pr-8"
                        value={style} onChange={e => setStyle(e.target.value)}>
                        {STYLES.map(s => <option key={s}>{s}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="border-white/10 text-white/50 hover:bg-white/5 h-11 rounded-xl text-sm" onClick={() => setActiveStep(1)}>← Back</Button>
                    <Button className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold h-11 rounded-xl text-sm"
                      onClick={handleGenerate} disabled={isGenerating || (!description.trim() && !businessName.trim())}>
                      {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Building site...</> : "✨ Build My Website →"}
                    </Button>
                  </div>
                </>
              )}
            </div>

            {error && (
              <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">{error}</div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              {["Complete HTML + CSS", "No external dependencies", "Instant live preview", "Download & host anywhere"].map(f => (
                <div key={f} className="flex items-center gap-2 text-white/40">
                  <Globe className="w-3.5 h-3.5 text-cyan-500/70 flex-shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Preview/Code */}
          <div className="lg:w-7/12 w-full">
            <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-black/40 border-b border-white/10">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 flex justify-center gap-1">
                  <button onClick={() => setViewMode("preview")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${viewMode === "preview" ? "bg-cyan-500/20 text-cyan-400" : "text-white/40 hover:text-white/70"}`}>
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </button>
                  <button onClick={() => setViewMode("code")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${viewMode === "code" ? "bg-cyan-500/20 text-cyan-400" : "text-white/40 hover:text-white/70"}`}>
                    <Code2 className="w-3.5 h-3.5" /> Code
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {generatedCode && (
                    <>
                      <button onClick={handleCopy} className="text-white/40 hover:text-white transition-colors">
                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button onClick={handleDownload} className="text-white/40 hover:text-white transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                      <button onClick={() => setFullscreen(true)} className="text-white/40 hover:text-white transition-colors">
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {!generatedCode && !isGenerating && (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="h-[500px] flex flex-col items-center justify-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                      <Globe className="w-10 h-10 text-cyan-500/50" />
                    </div>
                    <p className="text-white/30 text-sm text-center max-w-xs">
                      Fill in your details and click "Build My Website" — a full, live-preview ready site will appear here.
                    </p>
                  </motion.div>
                )}

                {isGenerating && !generatedCode && (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="h-[200px] flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                    <p className="text-white/50 text-sm">Building your website...</p>
                  </motion.div>
                )}

                {generatedCode && viewMode === "preview" && (
                  <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {previewSrc && (
                      <iframe
                        srcDoc={generatedCode}
                        className="w-full h-[560px] bg-white"
                        sandbox="allow-scripts"
                        title="Website Preview"
                      />
                    )}
                  </motion.div>
                )}

                {generatedCode && viewMode === "code" && (
                  <motion.div key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="h-[560px] overflow-auto">
                    <pre className="p-4 text-xs text-green-300/80 font-mono leading-relaxed whitespace-pre-wrap">
                      {generatedCode}
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>

              {isGenerating && generatedCode && (
                <div className="px-4 py-2 border-t border-white/10 bg-black/20 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 animate-pulse rounded-full" style={{ width: `${Math.min(95, (generatedCode.length / 80) * 100)}%` }} />
                  </div>
                  <span className="text-xs text-white/30">{generatedCode.length} chars</span>
                </div>
              )}
            </div>

            {generatedCode && !isGenerating && (
              <div className="mt-3 flex gap-2">
                <Button onClick={handleDownload} className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 rounded-xl h-10 text-sm">
                  <Download className="w-4 h-4 mr-2" /> Download HTML
                </Button>
                <Button onClick={handleGenerate} variant="outline" className="border-white/10 text-white/50 hover:bg-white/5 rounded-xl h-10 text-sm">
                  Regenerate
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen overlay */}
      <AnimatePresence>
        {fullscreen && generatedCode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 bg-black/80 border-b border-white/10">
              <span className="text-white/60 text-sm">{businessName || "Website"} — Live Preview</span>
              <button onClick={() => setFullscreen(false)} className="text-white/50 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <iframe srcDoc={generatedCode} className="flex-1 w-full bg-white" sandbox="allow-scripts" title="Fullscreen Preview" />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
