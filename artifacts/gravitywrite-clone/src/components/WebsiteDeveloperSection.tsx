import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Code2, Loader2, Copy, Check, Download, Eye, Maximize2, X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Kid-friendly wizard data ────────────────────────────────
const WEBSITE_TYPES = [
  { id: "shop", emoji: "🛍️", label: "Online Shop", desc: "Sell your products" },
  { id: "restaurant", emoji: "🍕", label: "Restaurant / Café", desc: "Food & menu site" },
  { id: "portfolio", emoji: "🎨", label: "My Portfolio", desc: "Show off your work" },
  { id: "saas", emoji: "💻", label: "SaaS / App", desc: "Software product" },
  { id: "agency", emoji: "🚀", label: "Agency / Service", desc: "Offer services" },
  { id: "blog", emoji: "✍️", label: "Blog / Magazine", desc: "Share your ideas" },
  { id: "event", emoji: "🎉", label: "Event / Wedding", desc: "Special occasion" },
  { id: "nonprofit", emoji: "❤️", label: "Non-Profit", desc: "Make a difference" },
  { id: "school", emoji: "📚", label: "School / Course", desc: "Teach & educate" },
  { id: "personal", emoji: "👋", label: "Personal Brand", desc: "Just about you!" },
];

const COLORS = [
  { id: "dark-pro", label: "Dark & Professional", preview: ["#0a0a1a", "#6d28d9", "#10b981"], desc: "Like Tesla or Stripe" },
  { id: "bright-blue", label: "Bright & Trustworthy", preview: ["#ffffff", "#2563eb", "#f59e0b"], desc: "Like Airbnb or Notion" },
  { id: "warm-orange", label: "Warm & Energetic", preview: ["#fff7ed", "#ea580c", "#16a34a"], desc: "Like HubSpot" },
  { id: "pink-fun", label: "Fun & Playful", preview: ["#fdf2f8", "#db2777", "#7c3aed"], desc: "Like Canva" },
  { id: "nature-green", label: "Natural & Fresh", preview: ["#f0fdf4", "#16a34a", "#0891b2"], desc: "Like Whole Foods" },
  { id: "luxury-gold", label: "Luxury & Premium", preview: ["#0c0c0c", "#b45309", "#6b7280"], desc: "Like Chanel" },
];

const WEBSITE_STYLES = [
  { id: "modern", emoji: "✨", label: "Modern & Minimal", desc: "Clean, lots of white space" },
  { id: "bold", emoji: "💥", label: "Bold & Impactful", desc: "Big text, strong visuals" },
  { id: "elegant", emoji: "🏛️", label: "Elegant & Classic", desc: "Sophisticated, refined" },
  { id: "playful", emoji: "🎈", label: "Fun & Playful", desc: "Colorful, animations" },
  { id: "tech", emoji: "🤖", label: "Tech & Futuristic", desc: "Dark, glowy, sharp" },
  { id: "warm", emoji: "🌻", label: "Warm & Friendly", desc: "Welcoming, community feel" },
];

const STEPS = ["Website Type", "Your Business", "Colors", "Style", "Review"];

export default function WebsiteDeveloperSection() {
  const [step, setStep] = useState(0);
  const [websiteType, setWebsiteType] = useState("shop");
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [audience, setAudience] = useState("");
  const [features, setFeatures] = useState("");
  const [colorTheme, setColorTheme] = useState("dark-pro");
  const [style, setStyle] = useState("modern");

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const abortRef = { current: null as AbortController | null };

  const selectedType = WEBSITE_TYPES.find(t => t.id === websiteType);
  const selectedColor = COLORS.find(c => c.id === colorTheme);
  const selectedStyle = WEBSITE_STYLES.find(s => s.id === style);

  const colorMap: Record<string, string> = {
    "dark-pro": "dark", "bright-blue": "light", "warm-orange": "warm",
    "pink-fun": "colorful", "nature-green": "light", "luxury-gold": "dark",
  };

  async function handleGenerate() {
    setIsGenerating(true);
    setGeneratedCode("");
    setError("");
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/ai/generate-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteType: selectedType?.label ?? websiteType,
          businessName,
          description,
          audience,
          features,
          colorScheme: colorMap[colorTheme] ?? "dark",
          style: selectedStyle?.label.toLowerCase() ?? style,
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
              if (d.error) setError(d.error);
              if (d.content) setGeneratedCode(p => p + d.content);
            } catch { /* skip */ }
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError")
        setError("Generation failed. Please try again.");
    } finally { setIsGenerating(false); }
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

  const isLastStep = step === STEPS.length - 1;
  const canGoNext = step === 0 ? true : step === 1 ? description.trim().length > 0 : true;

  if (generatedCode || isGenerating) {
    return (
      <section id="website-developer" className="py-24 relative overflow-hidden bg-[#050510]">
        <div className="container px-4 mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-white font-bold">{businessName || "Your Website"}</h2>
                <p className="text-white/40 text-xs">{selectedType?.label}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => { setGeneratedCode(""); setStep(0); }}
                className="border-white/10 text-white/50 hover:bg-white/5 text-xs rounded-xl">
                Start Over
              </Button>
            </div>
          </div>

          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-black/60 border-b border-white/10">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 bg-white/5 rounded-md h-6 mx-2 flex items-center px-3">
                <span className="text-xs text-white/30">🔒 your-business.com</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setViewMode("preview")}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs transition-colors ${viewMode === "preview" ? "bg-cyan-500/20 text-cyan-400" : "text-white/40 hover:text-white/70"}`}>
                  <Eye className="w-3 h-3" /> Preview
                </button>
                <button onClick={() => setViewMode("code")}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs transition-colors ${viewMode === "code" ? "bg-cyan-500/20 text-cyan-400" : "text-white/40 hover:text-white/70"}`}>
                  <Code2 className="w-3 h-3" /> Code
                </button>
                {generatedCode && (
                  <>
                    <button onClick={handleCopy} className="p-1.5 text-white/40 hover:text-white transition-colors">
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button onClick={handleDownload} className="p-1.5 text-white/40 hover:text-white transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => setFullscreen(true)} className="p-1.5 text-white/40 hover:text-white transition-colors">
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {isGenerating && !generatedCode && (
              <div className="h-64 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                <p className="text-white/50 text-sm">Building your website with free AI...</p>
              </div>
            )}

            {viewMode === "preview" && generatedCode && (
              <iframe srcDoc={generatedCode} className="w-full h-[600px] bg-white" sandbox="allow-scripts" title="Website Preview" />
            )}

            {viewMode === "code" && generatedCode && (
              <div className="h-[600px] overflow-auto bg-black/80">
                <pre className="p-6 text-xs text-green-300/80 font-mono leading-relaxed whitespace-pre-wrap">{generatedCode}</pre>
              </div>
            )}

            {isGenerating && generatedCode && (
              <div className="px-4 py-2 bg-black/40 border-t border-white/5 flex items-center gap-2">
                <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full animate-pulse" style={{ width: `${Math.min(90, (generatedCode.length / 100))}%` }} />
                </div>
                <span className="text-xs text-white/30">{generatedCode.length} chars</span>
              </div>
            )}
          </div>

          {!isGenerating && generatedCode && (
            <div className="mt-4 flex gap-3">
              <Button onClick={handleDownload} className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 rounded-xl h-10 text-sm">
                <Download className="w-4 h-4 mr-2" /> Download HTML
              </Button>
              <Button onClick={handleGenerate} variant="outline" className="border-white/10 text-white/50 hover:bg-white/5 rounded-xl h-10 text-sm">
                Regenerate
              </Button>
            </div>
          )}
          {error && <div className="mt-4 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">{error}</div>}
        </div>

        {fullscreen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 bg-black/80 border-b border-white/10">
              <span className="text-white/60 text-sm">{businessName || "Website"} — Fullscreen Preview</span>
              <button onClick={() => setFullscreen(false)} className="text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <iframe srcDoc={generatedCode} className="flex-1 w-full bg-white" sandbox="allow-scripts" />
          </motion.div>
        )}
      </section>
    );
  }

  return (
    <section id="website-developer" className="py-24 relative overflow-hidden bg-[#050510]">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 via-transparent to-blue-900/10 pointer-events-none" />
      <div className="container px-4 mx-auto max-w-3xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm font-medium mb-4">
            <Globe className="w-4 h-4 mr-2" /> AI Website Builder
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Build a Website <span className="text-cyan-400">Anyone Can Use</span>
          </h2>
          <p className="text-white/50 text-lg">Answer a few fun questions — we build the website. No coding needed, ever.</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-3">
            {STEPS.map((s, i) => (
              <button key={s} onClick={() => i < step && setStep(i)}
                className={`flex flex-col items-center gap-1 ${i < step ? "cursor-pointer" : "cursor-default"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < step ? "bg-cyan-500 text-black" : i === step ? "bg-cyan-500/30 border-2 border-cyan-500 text-cyan-400" : "bg-white/5 border border-white/10 text-white/30"}`}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span className={`text-xs hidden sm:block ${i === step ? "text-cyan-400 font-medium" : "text-white/30"}`}>{s}</span>
              </button>
            ))}
          </div>
          <div className="h-1.5 bg-white/10 rounded-full">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
          </div>
        </div>

        <div className="glass-card rounded-2xl border border-white/10 p-6 md:p-8 min-h-80">
          <AnimatePresence mode="wait">

            {/* Step 0: Type */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-2xl font-bold text-white mb-2">What kind of website do you need? 🤔</h3>
                <p className="text-white/50 text-sm mb-6">Pick the one that matches your goal</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {WEBSITE_TYPES.map(t => (
                    <button key={t.id} onClick={() => setWebsiteType(t.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${websiteType === t.id ? "border-cyan-500/60 bg-cyan-500/15 shadow-[0_0_20px_rgba(6,182,212,0.2)]" : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"}`}>
                      <span className="text-3xl">{t.emoji}</span>
                      <span className={`text-xs font-semibold text-center leading-tight ${websiteType === t.id ? "text-cyan-300" : "text-white/70"}`}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 1: Details */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-4xl">{selectedType?.emoji}</span>
                  <div>
                    <h3 className="text-xl font-bold text-white">Tell us about your {selectedType?.label} 📋</h3>
                    <p className="text-white/50 text-sm">The more you tell us, the better the website!</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">What's the name? <span className="text-white/30">(your business or project name)</span></label>
                    <input className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-cyan-500/50 text-sm"
                      placeholder={`e.g., "${selectedType?.id === "restaurant" ? "Mario's Kitchen" : selectedType?.id === "shop" ? "Luna Boutique" : "MyAwesomeBiz"}"`}
                      value={businessName} onChange={e => setBusinessName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">What do you do? <span className="text-white/30">*</span></label>
                    <textarea className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-cyan-500/50 h-24 resize-none text-sm"
                      placeholder={selectedType?.id === "restaurant" ? "e.g., We serve authentic Italian pizza and pasta in downtown Chicago. Family-owned since 1995." : selectedType?.id === "shop" ? "e.g., We sell handmade jewelry and accessories. Every piece is unique and eco-friendly." : "e.g., We help small businesses grow by creating stunning brand identities and marketing strategies."}
                      value={description} onChange={e => setDescription(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Who are your customers? <span className="text-white/30">(optional)</span></label>
                    <input className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-cyan-500/50 text-sm"
                      placeholder="e.g., Young professionals aged 25-40 who love quality food"
                      value={audience} onChange={e => setAudience(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Key things to highlight <span className="text-white/30">(optional)</span></label>
                    <input className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-cyan-500/50 text-sm"
                      placeholder="e.g., Free delivery, 24/7 support, 5-star reviews, award-winning"
                      value={features} onChange={e => setFeatures(e.target.value)} />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Colors */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-xl font-bold text-white mb-2">Pick your colors 🎨</h3>
                <p className="text-white/50 text-sm mb-5">Choose the vibe that matches your brand</p>
                <div className="space-y-3">
                  {COLORS.map(c => (
                    <button key={c.id} onClick={() => setColorTheme(c.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${colorTheme === c.id ? "border-cyan-500/60 bg-cyan-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                      <div className="flex gap-1 flex-shrink-0">
                        {c.preview.map((color, i) => (
                          <div key={i} className="w-6 h-6 rounded-full border border-white/20 shadow-sm" style={{ background: color }} />
                        ))}
                      </div>
                      <div>
                        <div className={`text-sm font-semibold ${colorTheme === c.id ? "text-cyan-300" : "text-white/80"}`}>{c.label}</div>
                        <div className="text-xs text-white/40">{c.desc}</div>
                      </div>
                      {colorTheme === c.id && <div className="ml-auto text-cyan-400 text-lg">✓</div>}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Style */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-xl font-bold text-white mb-2">Choose your design style ✨</h3>
                <p className="text-white/50 text-sm mb-5">How do you want your website to feel?</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {WEBSITE_STYLES.map(s => (
                    <button key={s.id} onClick={() => setStyle(s.id)}
                      className={`flex flex-col items-start gap-2 p-4 rounded-xl border transition-all text-left ${style === s.id ? "border-cyan-500/60 bg-cyan-500/15 shadow-[0_0_20px_rgba(6,182,212,0.15)]" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                      <span className="text-3xl">{s.emoji}</span>
                      <span className={`text-sm font-semibold ${style === s.id ? "text-cyan-300" : "text-white/80"}`}>{s.label}</span>
                      <span className="text-xs text-white/40">{s.desc}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-xl font-bold text-white mb-2">Ready to build! 🚀</h3>
                <p className="text-white/50 text-sm mb-6">Here's a summary of your website. Click Build when ready!</p>
                <div className="space-y-3">
                  {[
                    { label: "Website type", value: `${selectedType?.emoji} ${selectedType?.label}` },
                    { label: "Business name", value: businessName || "Not specified" },
                    { label: "What you do", value: description.length > 80 ? description.slice(0, 80) + "…" : description },
                    { label: "Color theme", value: `${selectedColor?.label}` },
                    { label: "Design style", value: `${selectedStyle?.emoji} ${selectedStyle?.label}` },
                  ].map(row => (
                    <div key={row.label} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-xs font-medium text-white/40 w-28 flex-shrink-0 pt-0.5">{row.label}</span>
                      <span className="text-sm text-white/80">{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                  <span className="text-emerald-400 text-lg">✅</span>
                  <div>
                    <p className="text-emerald-400 text-sm font-semibold">100% Free — No credit card needed</p>
                    <p className="text-emerald-400/70 text-xs mt-0.5">Your website is built using free AI. Download the HTML file and host it anywhere.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav buttons */}
        <div className="flex items-center gap-3 mt-6">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)}
              className="border-white/10 text-white/50 hover:bg-white/5 rounded-xl h-12 px-5">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          )}
          {!isLastStep ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canGoNext}
              className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-xl h-12 text-base">
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleGenerate} disabled={isGenerating || !description.trim()}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold rounded-xl h-12 text-base shadow-[0_0_30px_rgba(6,182,212,0.3)]">
              {isGenerating ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Building...</> : <><Sparkles className="w-5 h-5 mr-2" />Build My Website!</>}
            </Button>
          )}
        </div>
        {error && <div className="mt-4 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">{error}</div>}
      </div>
    </section>
  );
}
