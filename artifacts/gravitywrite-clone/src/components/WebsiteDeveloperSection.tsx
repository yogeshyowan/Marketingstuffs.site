import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Code2, Loader2, Copy, Check, Download, Eye,
  Maximize2, X, ChevronLeft, ChevronRight, Sparkles, Edit3, Wand2, RefreshCw,
  Zap, Building2, Phone, Mail, MapPin, Instagram, Twitter, Facebook,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Data ──────────────────────────────────────────────────
const BUSINESS_TYPES = [
  { id: "ecommerce", emoji: "🛍️", label: "E-commerce / Online Shop" },
  { id: "restaurant", emoji: "🍕", label: "Restaurant / Café / Food" },
  { id: "professional", emoji: "💼", label: "Professional Services" },
  { id: "beauty", emoji: "💅", label: "Beauty & Wellness / Salon" },
  { id: "realestate", emoji: "🏠", label: "Real Estate / Property" },
  { id: "photography", emoji: "📸", label: "Photography / Videography" },
  { id: "healthcare", emoji: "🏥", label: "Healthcare / Medical" },
  { id: "fitness", emoji: "💪", label: "Fitness / Gym / Yoga" },
  { id: "education", emoji: "📚", label: "Education / Tutoring" },
  { id: "tech", emoji: "💻", label: "Technology / SaaS / App" },
  { id: "agency", emoji: "🚀", label: "Creative Agency / Marketing" },
  { id: "nonprofit", emoji: "❤️", label: "Non-Profit / Charity" },
  { id: "travel", emoji: "✈️", label: "Travel & Hospitality" },
  { id: "construction", emoji: "🏗️", label: "Construction / Home Services" },
  { id: "event", emoji: "🎉", label: "Events / Wedding / Entertainment" },
  { id: "automotive", emoji: "🚗", label: "Automotive / Transport" },
  { id: "freelancer", emoji: "🎨", label: "Freelancer / Portfolio" },
  { id: "personal", emoji: "👋", label: "Personal Brand / Blog" },
];

const TEMPLATES = [
  {
    id: "business-pro",
    label: "Business Pro",
    desc: "Corporate, trustworthy, structured layout",
    colors: { bg: "#0f172a", header: "#2563eb", accent: "#60a5fa", text: "#f1f5f9" },
  },
  {
    id: "creative-studio",
    label: "Creative Studio",
    desc: "Bold, artistic, gradient-heavy design",
    colors: { bg: "#0a0a14", header: "#7c3aed", accent: "#a78bfa", text: "#faf5ff" },
  },
  {
    id: "fresh-modern",
    label: "Fresh & Modern",
    desc: "Clean, minimal, lots of white space",
    colors: { bg: "#f0fdf4", header: "#16a34a", accent: "#22c55e", text: "#14532d" },
  },
  {
    id: "bold-impact",
    label: "Bold Impact",
    desc: "High contrast, powerful headlines",
    colors: { bg: "#0c0c0c", header: "#f59e0b", accent: "#fbbf24", text: "#fafafa" },
  },
  {
    id: "elegant-premium",
    label: "Elegant Premium",
    desc: "Luxury feel, serif fonts, gold accents",
    colors: { bg: "#fffbf0", header: "#92400e", accent: "#b45309", text: "#1c1917" },
  },
  {
    id: "friendly-warm",
    label: "Friendly & Warm",
    desc: "Welcoming, community-focused, bright",
    colors: { bg: "#fff7ed", header: "#ea580c", accent: "#fb923c", text: "#431407" },
  },
];

const FONT_PAIRINGS = [
  {
    id: "clean-modern",
    label: "Clean & Modern",
    heading: "Inter",
    body: "Inter",
    desc: "Minimal, professional",
    sample: "Aa",
  },
  {
    id: "elegant-serif",
    label: "Elegant Serif",
    heading: "Playfair Display",
    body: "Lato",
    desc: "Sophisticated, classic",
    sample: "Aa",
  },
  {
    id: "bold-strong",
    label: "Bold & Strong",
    heading: "Montserrat",
    body: "Open Sans",
    desc: "Energetic, impactful",
    sample: "Aa",
  },
  {
    id: "friendly-rounded",
    label: "Friendly Rounded",
    heading: "Poppins",
    body: "Nunito",
    desc: "Approachable, warm",
    sample: "Aa",
  },
];

const COLOR_SCHEMES = [
  { id: "dark-pro", label: "Dark & Professional", swatch: ["#0a0a1a", "#6d28d9", "#10b981"] },
  { id: "bright-blue", label: "Bright & Trustworthy", swatch: ["#ffffff", "#2563eb", "#f59e0b"] },
  { id: "warm-orange", label: "Warm & Energetic", swatch: ["#fff7ed", "#ea580c", "#16a34a"] },
  { id: "pink-fun", label: "Fun & Playful", swatch: ["#fdf2f8", "#db2777", "#7c3aed"] },
  { id: "nature-green", label: "Natural & Fresh", swatch: ["#f0fdf4", "#16a34a", "#0891b2"] },
  { id: "luxury-gold", label: "Luxury & Premium", swatch: ["#0c0c0c", "#b45309", "#6b7280"] },
];

const QUICK_EDITS = [
  "Change the color scheme to blue and white",
  "Make the hero section more impactful",
  "Add an FAQ section",
  "Add a newsletter signup form",
  "Make the design more minimalist",
  "Add more testimonials",
  "Update placeholder text with better copy",
  "Add a contact form",
  "Make it look more premium",
  "Add a mobile hamburger menu",
];

const STEPS = ["Business Type", "Business Name", "Business Info", "Contact", "Template", "Font & Colors", "Review"];

export default function WebsiteDeveloperSection() {
  const [step, setStep] = useState(0);

  // Step fields
  const [businessType, setBusinessType] = useState("ecommerce");
  const [businessName, setBusinessName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [services, setServices] = useState("");
  const [audience, setAudience] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialTwitter, setSocialTwitter] = useState("");
  const [socialFacebook, setSocialFacebook] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("business-pro");
  const [fontPairing, setFontPairing] = useState("clean-modern");
  const [colorScheme, setColorScheme] = useState("dark-pro");

  // Generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [fullscreen, setFullscreen] = useState(false);

  // AI auto-fill
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [autoFillError, setAutoFillError] = useState("");

  // Edit mode
  const [editOpen, setEditOpen] = useState(false);
  const [editInstruction, setEditInstruction] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState("");

  const selectedBusinessType = BUSINESS_TYPES.find(t => t.id === businessType);
  const selectedTemplateData = TEMPLATES.find(t => t.id === selectedTemplate);
  const selectedFont = FONT_PAIRINGS.find(f => f.id === fontPairing);
  const selectedColor = COLOR_SCHEMES.find(c => c.id === colorScheme);

  async function handleAutoFill() {
    if (!businessName.trim()) return;
    setIsAutoFilling(true);
    setAutoFillError("");
    try {
      const res = await fetch("/api/ai/auto-generate-business-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessType: selectedBusinessType?.label ?? businessType,
          businessName,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json() as {
        tagline?: string; description?: string; services?: string; audience?: string; cta?: string;
      };
      if (data.tagline) setTagline(data.tagline);
      if (data.description) setDescription(data.description);
      if (data.services) setServices(data.services);
      if (data.audience) setAudience(data.audience);
      if (data.cta) setCtaText(data.cta);
    } catch {
      setAutoFillError("AI auto-fill failed. Please fill in manually.");
    } finally { setIsAutoFilling(false); }
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setGeneratedCode("");
    setError("");
    setEditOpen(false);

    const colorMap: Record<string, string> = {
      "dark-pro": "dark professional", "bright-blue": "clean light blue",
      "warm-orange": "warm orange", "pink-fun": "fun colorful pink-purple",
      "nature-green": "natural fresh green", "luxury-gold": "dark luxury gold",
    };

    let fullCode = "";
    try {
      const res = await fetch("/api/ai/generate-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteType: selectedBusinessType?.label ?? businessType,
          businessName,
          tagline,
          description: `${description}${services ? `. Key services: ${services}` : ""}`,
          audience,
          features: services,
          ctaText: ctaText || "Get Started",
          contactEmail, contactPhone, contactAddress,
          socialInstagram, socialTwitter, socialFacebook,
          templateStyle: selectedTemplateData?.label ?? selectedTemplate,
          fontHeading: selectedFont?.heading ?? "Inter",
          fontBody: selectedFont?.body ?? "Inter",
          colorScheme: colorMap[colorScheme] ?? "dark",
          style: selectedTemplateData?.desc ?? "modern professional",
        }),
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
            if (d.error) setError(d.error);
            if (d.content) { fullCode += d.content; setGeneratedCode(fullCode); }
          } catch { /* skip */ }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Generation failed. Please try again.");
    } finally { setIsGenerating(false); }
  }

  async function handleEdit() {
    if (!editInstruction.trim()) return;
    setIsEditing(true);
    setEditError("");
    const previous = generatedCode;
    let fullCode = "";
    try {
      setGeneratedCode("");
      setViewMode("preview");
      const res = await fetch("/api/ai/improve-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: previous, instruction: editInstruction }),
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
            if (d.error) { setEditError(d.error); setGeneratedCode(previous); }
            if (d.content) { fullCode += d.content; setGeneratedCode(fullCode); }
          } catch { /* skip */ }
        }
      }
      setEditInstruction("");
      setEditOpen(false);
    } catch {
      setGeneratedCode(previous);
      setEditError("Edit failed. Please try again.");
    } finally { setIsEditing(false); }
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
    a.download = `${(businessName || "website").replace(/\s+/g, "-").toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const isLastStep = step === STEPS.length - 1;
  const canContinue = step === 1 ? businessName.trim().length > 0
    : step === 2 ? description.trim().length > 0
    : true;

  // ── Generated website view ─────────────────────────────────
  if (generatedCode || isGenerating) {
    const cleanHtml = generatedCode
      .replace(/^```html\s*/i, "")
      .replace(/^```\s*/m, "")
      .replace(/\s*```\s*$/, "")
      .trim();

    return (
      <section id="website-developer" className="py-24 relative overflow-hidden bg-[#050510]">
        <div className="container px-4 mx-auto max-w-6xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">{businessName || "Your Website"}</h2>
                <p className="text-white/40 text-xs">{selectedBusinessType?.label} · {selectedTemplateData?.label} template</p>
              </div>
            </div>
            <div className="flex items-center flex-wrap gap-2">
              {!isGenerating && !isEditing && generatedCode && (
                <>
                  {/* View toggle */}
                  <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
                    <button onClick={() => setViewMode("preview")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === "preview" ? "bg-cyan-500/20 text-cyan-400" : "text-white/40 hover:text-white"}`}>
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </button>
                    <button onClick={() => setViewMode("code")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === "code" ? "bg-cyan-500/20 text-cyan-400" : "text-white/40 hover:text-white"}`}>
                      <Code2 className="w-3.5 h-3.5" /> HTML
                    </button>
                  </div>
                  <Button size="sm" onClick={() => setEditOpen(o => !o)}
                    className={`h-8 text-xs rounded-xl gap-1.5 ${editOpen ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/50" : "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/25"}`}>
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button size="sm" onClick={handleDownload}
                    className="h-8 text-xs rounded-xl gap-1.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25">
                    <Download className="w-3.5 h-3.5" /> Download
                  </Button>
                  <Button size="sm" onClick={handleCopy}
                    className="h-8 text-xs rounded-xl gap-1.5 bg-white/5 text-white/50 border border-white/10 hover:bg-white/10">
                    {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" />Copied</> : <><Copy className="w-3.5 h-3.5" />Copy HTML</>}
                  </Button>
                  <button onClick={() => setFullscreen(true)}
                    className="h-8 w-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={() => { setGeneratedCode(""); setStep(0); setEditOpen(false); }}
                className="border-white/10 text-white/40 hover:bg-white/5 text-xs h-8 rounded-xl gap-1.5">
                <RefreshCw className="w-3 h-3" /> New Website
              </Button>
            </div>
          </div>

          {/* Edit panel */}
          <AnimatePresence>
            {editOpen && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="mb-4 p-5 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Wand2 className="w-4 h-4 text-cyan-400" /><span className="text-sm font-semibold text-cyan-300">What would you like to change?</span></div>
                  <button onClick={() => setEditOpen(false)} className="text-white/30 hover:text-white/60"><X className="w-4 h-4" /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {QUICK_EDITS.map(q => (
                    <button key={q} onClick={() => setEditInstruction(q)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${editInstruction === q ? "border-cyan-500/60 bg-cyan-500/25 text-cyan-300" : "border-white/10 bg-white/5 text-white/50 hover:border-cyan-500/40 hover:text-cyan-300"}`}>
                      {q}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <input className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/25 focus:outline-none focus:border-cyan-500/50 text-sm"
                    placeholder="Or describe your change... (e.g. 'change hero headline to Welcome to Luna Boutique')"
                    value={editInstruction} onChange={e => setEditInstruction(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleEdit()} />
                  <Button onClick={handleEdit} disabled={isEditing || !editInstruction.trim()}
                    className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-xl px-5 text-sm h-10 shrink-0 disabled:opacity-50">
                    {isEditing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Wand2 className="w-4 h-4 mr-1.5" />Apply</>}
                  </Button>
                </div>
                {editError && <p className="text-red-400 text-xs">{editError}</p>}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Preview / Code */}
          <div className="rounded-2xl border border-white/10 overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.1)]">
            <div className="flex items-center gap-3 px-5 py-3 bg-black/50 border-b border-white/10">
              <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500/60" /><div className="w-3 h-3 rounded-full bg-yellow-500/60" /><div className="w-3 h-3 rounded-full bg-green-500/60" /></div>
              <div className="flex-1 text-xs text-center text-white/30 truncate">{businessName || "yourwebsite"}.html</div>
              {(isGenerating || isEditing) && <div className="flex items-center gap-1.5"><Loader2 className="w-3 h-3 text-cyan-400 animate-spin" /><span className="text-xs text-white/40">{isEditing ? "Applying..." : "Building..."}</span></div>}
            </div>

            {viewMode === "preview" ? (
              <div className="relative">
                {cleanHtml ? (
                  <iframe
                    srcDoc={cleanHtml}
                    className="w-full bg-white"
                    style={{ height: "720px", border: "none" }}
                    sandbox="allow-scripts allow-same-origin"
                    title="Website Preview"
                  />
                ) : isGenerating ? (
                  <div className="h-96 flex flex-col items-center justify-center gap-4 bg-[#080818]">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping" />
                      <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                        <Globe className="w-7 h-7 text-cyan-400 animate-pulse" />
                      </div>
                    </div>
                    <p className="text-white/50 text-sm">Building your website...</p>
                    <p className="text-white/25 text-xs">This usually takes 30–60 seconds</p>
                  </div>
                ) : null}
              </div>
            ) : (
              <pre className="overflow-auto max-h-[720px] bg-[#0d1117] p-5 text-xs text-green-400/90 leading-relaxed font-mono">
                {generatedCode}
              </pre>
            )}
          </div>

          {error && <div className="mt-4 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">{error}</div>}
        </div>

        {/* Fullscreen overlay */}
        <AnimatePresence>
          {fullscreen && cleanHtml && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black flex flex-col">
              <div className="flex items-center justify-between px-5 py-3 bg-black/80 border-b border-white/10 shrink-0">
                <span className="text-white/50 text-sm">{businessName || "Website"} — Fullscreen Preview</span>
                <div className="flex gap-3">
                  <Button size="sm" onClick={handleDownload} className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs h-8 rounded-xl gap-1.5"><Download className="w-3.5 h-3.5" />Download</Button>
                  <button onClick={() => setFullscreen(false)} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
              </div>
              <iframe srcDoc={cleanHtml} className="flex-1 w-full bg-white" sandbox="allow-scripts allow-same-origin" title="Fullscreen Preview" />
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    );
  }

  // ── Wizard ─────────────────────────────────────────────────
  return (
    <section id="website-developer" className="py-24 relative overflow-hidden bg-[#050510]">
      <div className="absolute right-0 top-1/4 w-[600px] h-[600px] bg-cyan-600/8 rounded-full blur-[130px] pointer-events-none" />
      <div className="container px-4 mx-auto max-w-3xl">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm font-medium mb-4">
            <Globe className="w-4 h-4 mr-2" /> AI Website Builder
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Build Your Website in <span className="text-cyan-400">Minutes</span>
          </h2>
          <p className="text-white/50 text-lg">Answer 7 quick questions — get a complete, professional website ready to publish</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-3 overflow-x-auto gap-1">
            {STEPS.map((s, i) => (
              <button key={s} onClick={() => i < step && setStep(i)} className={`flex flex-col items-center gap-1 min-w-fit ${i < step ? "cursor-pointer" : "cursor-default"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < step ? "bg-cyan-500 text-black" : i === step ? "bg-cyan-500/20 border-2 border-cyan-500 text-cyan-400" : "bg-white/5 border border-white/10 text-white/30"}`}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span className={`text-[10px] hidden sm:block whitespace-nowrap ${i === step ? "text-cyan-400 font-semibold" : "text-white/30"}`}>{s}</span>
              </button>
            ))}
          </div>
          <div className="h-1 bg-white/10 rounded-full">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
          </div>
        </div>

        <div className="glass-card rounded-2xl border border-white/10 p-6 md:p-8 min-h-80">
          <AnimatePresence mode="wait">

            {/* Step 0: Business Type */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-xl font-bold text-white mb-1">Choose your business type 🏢</h3>
                <p className="text-white/50 text-sm mb-5">What kind of website are you building?</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-96 overflow-y-auto pr-1">
                  {BUSINESS_TYPES.map(t => (
                    <button key={t.id} onClick={() => setBusinessType(t.id)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left ${businessType === t.id ? "border-cyan-500/60 bg-cyan-500/15" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                      <span className="text-xl shrink-0">{t.emoji}</span>
                      <span className={`text-xs font-semibold leading-tight ${businessType === t.id ? "text-cyan-300" : "text-white/70"}`}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 1: Business Name */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{selectedBusinessType?.emoji}</span>
                  <h3 className="text-xl font-bold text-white">What's your business name? ✍️</h3>
                </div>
                <p className="text-white/50 text-sm mb-6">This will appear throughout your website</p>
                <input
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white text-lg placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 transition-all"
                  placeholder={`e.g., "Luna Boutique" or "TechFlow Solutions"`}
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  autoFocus
                />
                <p className="text-white/30 text-xs mt-3">In the next step, AI can automatically fill in all your business details based on this name.</p>
              </motion.div>
            )}

            {/* Step 2: Business Info */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-xl font-bold text-white mb-1">Tell us about your business 📋</h3>
                <p className="text-white/50 text-sm mb-4">Fill in the details or let AI fill them for you</p>

                {/* AI Auto-Generate button */}
                <button onClick={handleAutoFill} disabled={isAutoFilling || !businessName.trim()}
                  className="w-full mb-5 flex items-center justify-center gap-2.5 py-3 px-5 rounded-xl border-2 border-dashed border-cyan-500/40 bg-cyan-500/10 text-cyan-400 hover:border-cyan-500/70 hover:bg-cyan-500/20 transition-all disabled:opacity-50 text-sm font-semibold">
                  {isAutoFilling ? <><Loader2 className="w-4 h-4 animate-spin" />AI is generating your business content...</> : <><Zap className="w-4 h-4" />AI Auto-Generate — Fill all fields instantly</>}
                </button>
                {autoFillError && <p className="text-red-400 text-xs mb-3">{autoFillError}</p>}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/50 mb-1.5">Tagline <span className="text-white/25">(optional)</span></label>
                    <input className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/40 text-sm transition-all"
                      placeholder="e.g., Your Style, Our Passion" value={tagline} onChange={e => setTagline(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/50 mb-1.5">Business Description <span className="text-white/30">*</span></label>
                    <textarea className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/40 text-sm resize-none h-24 transition-all"
                      placeholder="What does your business do? What makes it special?" value={description} onChange={e => setDescription(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-white/50 mb-1.5">Services / Products <span className="text-white/25">(comma-separated)</span></label>
                      <input className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/40 text-sm transition-all"
                        placeholder="e.g., Dresses, Accessories, Custom Orders" value={services} onChange={e => setServices(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/50 mb-1.5">Target Audience <span className="text-white/25">(optional)</span></label>
                      <input className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/40 text-sm transition-all"
                        placeholder="e.g., Women aged 25-45" value={audience} onChange={e => setAudience(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/50 mb-1.5">CTA Button Text <span className="text-white/25">(optional)</span></label>
                    <input className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/40 text-sm transition-all"
                      placeholder="e.g., Shop Now, Book a Call, Get Started" value={ctaText} onChange={e => setCtaText(e.target.value)} />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Contact Info */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-xl font-bold text-white mb-1">Contact Information 📞</h3>
                <p className="text-white/50 text-sm mb-2">This appears on your Contact Us page — all fields are optional</p>
                <p className="text-xs text-white/30 mb-5">You can skip this step if you don't want contact details on the site</p>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-white/50 mb-1.5"><Mail className="w-3.5 h-3.5" />Email Address</label>
                      <input className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/40 text-sm transition-all"
                        placeholder="hello@yourbusiness.com" type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-white/50 mb-1.5"><Phone className="w-3.5 h-3.5" />Phone Number</label>
                      <input className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/40 text-sm transition-all"
                        placeholder="+1 (555) 000-0000" type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-white/50 mb-1.5"><MapPin className="w-3.5 h-3.5" />Business Address</label>
                    <input className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/40 text-sm transition-all"
                      placeholder="123 Main St, New York, NY 10001" value={contactAddress} onChange={e => setContactAddress(e.target.value)} />
                  </div>
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-white/50 mb-3">Social Media Links <span className="text-white/25">(optional)</span></label>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="flex items-center gap-1 text-xs text-pink-400/70 mb-1.5"><Instagram className="w-3 h-3" />Instagram</label>
                        <input className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder:text-white/20 focus:outline-none focus:border-pink-500/40 text-xs transition-all"
                          placeholder="@username" value={socialInstagram} onChange={e => setSocialInstagram(e.target.value)} />
                      </div>
                      <div>
                        <label className="flex items-center gap-1 text-xs text-sky-400/70 mb-1.5"><Twitter className="w-3 h-3" />Twitter / X</label>
                        <input className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder:text-white/20 focus:outline-none focus:border-sky-500/40 text-xs transition-all"
                          placeholder="@username" value={socialTwitter} onChange={e => setSocialTwitter(e.target.value)} />
                      </div>
                      <div>
                        <label className="flex items-center gap-1 text-xs text-blue-400/70 mb-1.5"><Facebook className="w-3 h-3" />Facebook</label>
                        <input className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/40 text-xs transition-all"
                          placeholder="facebook.com/page" value={socialFacebook} onChange={e => setSocialFacebook(e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Template */}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-xl font-bold text-white mb-1">Select a template 🎨</h3>
                <p className="text-white/50 text-sm mb-5">Choose the visual style for your website</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {TEMPLATES.map(t => {
                    const c = t.colors;
                    return (
                      <button key={t.id} onClick={() => setSelectedTemplate(t.id)}
                        className={`flex flex-col gap-3 p-3 rounded-2xl border-2 transition-all text-left ${selectedTemplate === t.id ? "border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.2)]" : "border-white/10 hover:border-white/25"}`}>
                        {/* Mini website preview */}
                        <div className="w-full rounded-xl overflow-hidden border border-white/10" style={{ background: c.bg }}>
                          {/* Nav bar */}
                          <div className="h-4 flex items-center px-2 gap-1" style={{ background: c.header }}>
                            <div className="w-8 h-1.5 rounded-full opacity-80" style={{ background: c.text }} />
                            <div className="ml-auto flex gap-1">
                              {[1,2,3].map(i => <div key={i} className="w-3 h-1 rounded-full opacity-50" style={{ background: c.text }} />)}
                            </div>
                          </div>
                          {/* Hero */}
                          <div className="px-2 py-3 space-y-1.5">
                            <div className="h-3 rounded w-4/5" style={{ background: c.accent + "cc" }} />
                            <div className="h-1.5 rounded w-full" style={{ background: c.text + "44" }} />
                            <div className="h-1.5 rounded w-5/6" style={{ background: c.text + "33" }} />
                            <div className="mt-2 h-4 w-14 rounded-lg" style={{ background: c.accent }} />
                          </div>
                          {/* Sections */}
                          <div className="grid grid-cols-3 gap-1 px-2 pb-2">
                            {[1,2,3].map(i => (
                              <div key={i} className="rounded-lg p-1.5" style={{ background: c.text + "11" }}>
                                <div className="h-1.5 rounded w-full mb-1" style={{ background: c.accent + "88" }} />
                                <div className="h-1 rounded w-3/4" style={{ background: c.text + "33" }} />
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-bold ${selectedTemplate === t.id ? "text-cyan-300" : "text-white/80"}`}>{t.label}</span>
                            {selectedTemplate === t.id && <span className="text-xs text-cyan-400">✓</span>}
                          </div>
                          <p className="text-xs text-white/35 mt-0.5 leading-tight">{t.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 5: Font & Colors */}
            {step === 5 && (
              <motion.div key="s5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-xl font-bold text-white mb-1">Font pairing & colors 🖋️</h3>
                <p className="text-white/50 text-sm mb-5">Choose what matches your brand personality</p>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-white/60 mb-3">Font Pairing</label>
                  <div className="grid grid-cols-2 gap-3">
                    {FONT_PAIRINGS.map(f => (
                      <button key={f.id} onClick={() => setFontPairing(f.id)}
                        className={`flex flex-col gap-1.5 p-4 rounded-xl border-2 transition-all text-left ${fontPairing === f.id ? "border-cyan-500/60 bg-cyan-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                        <span className={`text-2xl font-bold ${fontPairing === f.id ? "text-cyan-300" : "text-white/80"}`}
                          style={{ fontFamily: f.heading }}>
                          {f.sample}
                        </span>
                        <div>
                          <div className={`text-sm font-semibold ${fontPairing === f.id ? "text-cyan-300" : "text-white/80"}`}>{f.label}</div>
                          <div className="text-xs text-white/35">{f.heading} + {f.body}</div>
                          <div className="text-xs text-white/25 mt-0.5">{f.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white/60 mb-3">Color Scheme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {COLOR_SCHEMES.map(c => (
                      <button key={c.id} onClick={() => setColorScheme(c.id)}
                        className={`flex flex-col gap-2 p-3 rounded-xl border-2 transition-all ${colorScheme === c.id ? "border-cyan-500/60 bg-cyan-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                        <div className="flex gap-1.5">
                          {c.swatch.map((s, i) => <div key={i} className="w-6 h-6 rounded-md border border-white/10" style={{ background: s }} />)}
                        </div>
                        <span className={`text-xs font-semibold text-left leading-tight ${colorScheme === c.id ? "text-cyan-300" : "text-white/60"}`}>{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 6: Review */}
            {step === 6 && (
              <motion.div key="s6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-xl font-bold text-white mb-1">Review your details ✅</h3>
                <p className="text-white/50 text-sm mb-5">Confirm everything looks right before we build your website</p>
                <div className="space-y-3">
                  {[
                    { icon: Building2, label: "Business", value: `${selectedBusinessType?.emoji} ${selectedBusinessType?.label}` },
                    { icon: Globe, label: "Name", value: businessName },
                    { icon: Zap, label: "Tagline", value: tagline || "—" },
                    { icon: Edit3, label: "Description", value: description.slice(0, 80) + (description.length > 80 ? "…" : "") },
                    { icon: Sparkles, label: "Services", value: services || "—" },
                    { icon: Mail, label: "Contact", value: contactEmail || contactPhone || "Not provided" },
                    { icon: Globe, label: "Template", value: selectedTemplateData?.label ?? selectedTemplate },
                    { icon: Edit3, label: "Font", value: `${selectedFont?.label} (${selectedFont?.heading})` },
                    { icon: Sparkles, label: "Colors", value: selectedColor?.label ?? colorScheme },
                  ].map(({ icon: Icon, label, value }) => value && value !== "—" && (
                    <div key={label} className="flex gap-4 items-start p-3 rounded-xl bg-white/5 border border-white/5">
                      <Icon className="w-4 h-4 text-cyan-400/60 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-white/40 font-medium">{label}</div>
                        <div className="text-sm text-white/80 mt-0.5 truncate">{value}</div>
                      </div>
                      <button onClick={() => {
                        const stepMap: Record<string, number> = { Business: 0, Name: 1, Tagline: 2, Description: 2, Services: 2, Contact: 3, Template: 4, Font: 5, Colors: 5 };
                        setStep(stepMap[label] ?? 0);
                      }} className="text-xs text-white/30 hover:text-cyan-400 transition-colors shrink-0">Edit</button>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-semibold text-cyan-300">Ready to build!</span>
                  </div>
                  <p className="text-xs text-white/40">AI will generate a complete {selectedBusinessType?.label} website with all sections — hero, services, about, testimonials, pricing, contact, and footer.</p>
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
          {/* Skip contact step */}
          {step === 3 && (
            <Button variant="outline" onClick={() => setStep(s => s + 1)}
              className="border-white/5 text-white/30 hover:bg-white/5 rounded-xl h-12 px-5 text-sm">
              Skip this step →
            </Button>
          )}
          {!isLastStep ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canContinue}
              className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-xl h-12 text-base disabled:opacity-40">
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleGenerate} disabled={isGenerating || !description.trim()}
              className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl h-12 font-bold text-base shadow-[0_0_30px_rgba(6,182,212,0.3)] disabled:opacity-40">
              {isGenerating ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Building your website...</> : <><Sparkles className="w-5 h-5 mr-2" />Start Building →</>}
            </Button>
          )}
        </div>
        {error && <div className="mt-4 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">{error}</div>}
      </div>
    </section>
  );
}
