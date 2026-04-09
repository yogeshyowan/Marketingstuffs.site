import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Loader2, Copy, Check, Download, ChevronLeft, ChevronRight,
  Sparkles, RefreshCw, Zap, Phone, Mail, MapPin, Instagram, Twitter,
  Facebook, Monitor, Tablet, Smartphone, SkipForward, CheckCircle2,
  Upload, Palette, Type, Image as ImageIcon, ArrowRight, Plus, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Data ─────────────────────────────────────────────────────────────────────

const BUSINESS_TYPES = [
  { id: "ecommerce",     emoji: "🛍️", label: "E-commerce / Online Shop" },
  { id: "restaurant",   emoji: "🍕", label: "Restaurant / Café / Food" },
  { id: "professional", emoji: "💼", label: "Professional Services" },
  { id: "beauty",       emoji: "💅", label: "Beauty & Wellness / Salon" },
  { id: "realestate",   emoji: "🏠", label: "Real Estate / Property" },
  { id: "photography",  emoji: "📸", label: "Photography / Videography" },
  { id: "healthcare",   emoji: "🏥", label: "Healthcare / Medical" },
  { id: "fitness",      emoji: "💪", label: "Fitness / Gym / Yoga" },
  { id: "education",    emoji: "📚", label: "Education / Tutoring" },
  { id: "tech",         emoji: "💻", label: "Technology / SaaS / App" },
  { id: "agency",       emoji: "🚀", label: "Creative Agency / Marketing" },
  { id: "nonprofit",    emoji: "❤️", label: "Non-Profit / Charity" },
  { id: "travel",       emoji: "✈️", label: "Travel & Hospitality" },
  { id: "construction", emoji: "🏗️", label: "Construction / Home Services" },
  { id: "event",        emoji: "🎉", label: "Events / Wedding / Entertainment" },
  { id: "automotive",   emoji: "🚗", label: "Automotive / Transport" },
  { id: "freelancer",   emoji: "🎨", label: "Freelancer / Portfolio" },
  { id: "personal",     emoji: "👋", label: "Personal Brand / Blog" },
];

const COLOR_SCHEMES = [
  { id: "dark-pro",     name: "Dark Professional", bg: "#0f172a", accent: "#2563eb", text: "#f1f5f9" },
  { id: "bright-blue",  name: "Bright & Clean",    bg: "#f8fafc", accent: "#2563eb", text: "#1e293b" },
  { id: "warm-orange",  name: "Warm & Energetic",  bg: "#fff7ed", accent: "#ea580c", text: "#431407" },
  { id: "pink-creative",name: "Creative Pink",     bg: "#fdf2f8", accent: "#db2777", text: "#1e1b4b" },
  { id: "nature-green", name: "Nature & Fresh",    bg: "#f0fdf4", accent: "#16a34a", text: "#14532d" },
  { id: "luxury-dark",  name: "Luxury Dark",       bg: "#0c0a09", accent: "#d97706", text: "#fafaf9" },
];

const FONT_PAIRINGS = [
  { id: "inter",      label: "Inter — Clean Modern",    heading: "Inter",            body: "Inter" },
  { id: "playfair",   label: "Playfair — Elegant Serif", heading: "Playfair Display", body: "Inter" },
  { id: "montserrat", label: "Montserrat — Bold Impact", heading: "Montserrat",       body: "Montserrat" },
  { id: "poppins",    label: "Poppins — Friendly Round", heading: "Poppins",          body: "Poppins" },
];

const TEMPLATES = [
  { id: "business-pro",      label: "Business Pro",      desc: "Corporate, trustworthy, structured layout",  emoji: "🏢" },
  { id: "creative-studio",   label: "Creative Studio",   desc: "Bold, artistic, gradient-heavy design",      emoji: "🎨" },
  { id: "fresh-modern",      label: "Fresh & Modern",    desc: "Clean, minimal, lots of white space",        emoji: "🌿" },
  { id: "bold-impact",       label: "Bold Impact",       desc: "High-contrast, powerful statement brand",    emoji: "⚡" },
  { id: "elegant-premium",   label: "Elegant Premium",   desc: "Sophisticated with refined typography",      emoji: "💎" },
  { id: "friendly-warm",     label: "Friendly & Warm",   desc: "Welcoming, conversational, community feel",  emoji: "🤝" },
];

const WEBSITE_STYLES = [
  { id: "modern",     label: "Modern",     emoji: "✨", desc: "Clean lines, bold typography" },
  { id: "minimal",    label: "Minimal",    emoji: "⬜", desc: "White space, simplicity first" },
  { id: "bold",       label: "Bold",       emoji: "🔥", desc: "High contrast, strong personality" },
  { id: "elegant",    label: "Elegant",    emoji: "🌹", desc: "Refined, upscale feel" },
  { id: "playful",    label: "Playful",    emoji: "🎊", desc: "Fun, colorful, energetic" },
  { id: "tech",       label: "Tech",       emoji: "🤖", desc: "Futuristic, digital, dark UI" },
];

const PAGES_TO_BUILD: { key: SectionKey; label: string; emoji: string; desc: string }[] = [
  { key: "homepage", label: "Homepage",    emoji: "🏠", desc: "Hero, features, stats, CTA" },
  { key: "about",    label: "About Us",   emoji: "👥", desc: "Story, how it works, team" },
  { key: "services", label: "Services",   emoji: "⚙️", desc: "Services, pricing, testimonials" },
  { key: "contact",  label: "Contact",    emoji: "📬", desc: "FAQ, contact form, footer" },
];

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = "welcome" | "wizard" | "building" | "done";
type SectionKey = "homepage" | "about" | "services" | "contact";
type DeviceView = "desktop" | "tablet" | "mobile";

interface SectionState {
  key: SectionKey;
  label: string;
  emoji: string;
  desc: string;
  status: "pending" | "generating" | "done" | "skipped";
  html: string;
}

// ── Streaming helper ──────────────────────────────────────────────────────────

async function streamSection(
  body: Record<string, string>,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (msg: string) => void
) {
  const res = await fetch("/api/ai/generate-website-section", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) { onError("Network error – please try again."); return; }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const evt = JSON.parse(line.slice(6));
        if (evt.error) { onError(evt.error); return; }
        if (evt.done)  { onDone(); return; }
        if (evt.content) onChunk(evt.content);
      } catch { /* ignore parse errors */ }
    }
  }
}

// ── Combine all sections into one HTML document ───────────────────────────────

function combinePages(sections: SectionState[]): string {
  const homepage = sections.find(s => s.key === "homepage" && s.status === "done");
  if (!homepage?.html) return "";
  const others = sections.filter(s => s.key !== "homepage" && s.status === "done");
  const otherHtml = others.map(s => s.html).join("\n");
  // Strip the closing body/html and append other sections then close
  const base = homepage.html
    .replace(/<\/body>\s*<\/html>\s*$/i, "")
    .replace(/<\/body>\s*$/i, "");
  return base + "\n" + otherHtml + "\n</body>\n</html>";
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function WebsiteDeveloperSection() {
  // ─ Phase state ─
  const [phase, setPhase] = useState<Phase>("welcome");
  const [wizardStep, setWizardStep] = useState(0); // 0..3

  // ─ Wizard form ─
  const [bizType, setBizType] = useState("");
  const [bizTypeLabel, setBizTypeLabel] = useState("");
  const [bizName, setBizName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [services, setServices] = useState("");
  const [audience, setAudience] = useState("");
  const [ctaText, setCtaText] = useState("Get Started");
  const [style, setStyle] = useState("modern");
  const [templateId, setTemplateId] = useState("business-pro");
  const [fontId, setFontId] = useState("inter");
  const [colorId, setColorId] = useState("dark-pro");
  const [logoText, setLogoText] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [contactInstagram, setContactInstagram] = useState("");
  const [contactTwitter, setContactTwitter] = useState("");
  const [contactFacebook, setContactFacebook] = useState("");

  // ─ AI auto-fill ─
  const [autoFilling, setAutoFilling] = useState(false);

  // ─ Building phase ─
  const [sections, setSections] = useState<SectionState[]>(
    PAGES_TO_BUILD.map(p => ({ ...p, status: "pending", html: "" }))
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const abortRef = useRef(false);

  // ─ Done phase ─
  const [device, setDevice] = useState<DeviceView>("desktop");
  const [finalHtml, setFinalHtml] = useState("");
  const [copied, setCopied] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [editingWith, setEditingWith] = useState(false);
  const [showEditPanel, setShowEditPanel] = useState(false);

  const colorScheme = COLOR_SCHEMES.find(c => c.id === colorId) ?? COLOR_SCHEMES[0];
  const fontPairing = FONT_PAIRINGS.find(f => f.id === fontId) ?? FONT_PAIRINGS[0];

  // ─ Build the API payload ─
  const buildPayload = (sectionType: SectionKey) => ({
    sectionType,
    businessName: bizName,
    tagline: tagline || `Excellence in ${bizTypeLabel || bizName}`,
    description,
    services,
    audience,
    ctaText,
    contactEmail,
    contactPhone,
    contactAddress,
    socialInstagram: contactInstagram,
    socialTwitter: contactTwitter,
    socialFacebook: contactFacebook,
    fontHeading: fontPairing.heading,
    fontBody: fontPairing.body,
    colorScheme: `${style} ${colorScheme.name}`,
    accentColor: colorScheme.accent,
    bgColor: colorScheme.bg,
    textColor: colorScheme.text,
    templateStyle: TEMPLATES.find(t => t.id === templateId)?.label ?? "Business Pro",
  });

  // ─ Auto-fill business info ─
  const autoFill = async () => {
    if (!bizName || !bizType) return;
    setAutoFilling(true);
    try {
      const res = await fetch("/api/ai/auto-generate-business-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName: bizName, businessType: bizTypeLabel }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.tagline)     setTagline(data.tagline);
        if (data.description) setDescription(data.description);
        if (data.services)    setServices(data.services);
        if (data.audience)    setAudience(data.audience);
        if (data.ctaText)     setCtaText(data.ctaText);
      }
    } finally {
      setAutoFilling(false);
    }
  };

  // ─ Generate one section ─
  const generateSection = useCallback(async (idx: number, isRegen = false) => {
    const section = PAGES_TO_BUILD[idx];
    if (!section) return;
    abortRef.current = false;
    setIsGenerating(true);

    setSections(prev => prev.map((s, i) =>
      i === idx ? { ...s, status: "generating", html: isRegen ? "" : s.html } : s
    ));

    let html = "";
    await streamSection(
      buildPayload(section.key),
      (chunk) => {
        if (abortRef.current) return;
        html += chunk;
        setSections(prev => prev.map((s, i) =>
          i === idx ? { ...s, html } : s
        ));
      },
      () => {
        if (abortRef.current) return;
        setSections(prev => prev.map((s, i) =>
          i === idx ? { ...s, status: "done", html } : s
        ));
        setIsGenerating(false);
      },
      (err) => {
        setSections(prev => prev.map((s, i) =>
          i === idx ? { ...s, status: "done", html: `<p style="color:red;padding:2rem">Error: ${err}</p>` } : s
        ));
        setIsGenerating(false);
      }
    );
  }, [bizName, tagline, description, services, audience, ctaText, contactEmail, contactPhone,
      contactAddress, contactInstagram, contactTwitter, contactFacebook, fontId, colorId, style, templateId, bizTypeLabel]);

  // ─ Start the building phase ─
  const startBuilding = () => {
    setLogoText(logoText || bizName);
    const fresh = PAGES_TO_BUILD.map(p => ({ ...p, status: "pending" as const, html: "" }));
    setSections(fresh);
    setCurrentIdx(0);
    setPhase("building");
    setTimeout(() => generateSection(0), 100);
  };

  // ─ Keep & move next ─
  const keepAndNext = () => {
    const nextIdx = currentIdx + 1;
    if (nextIdx >= PAGES_TO_BUILD.length) {
      finalize();
    } else {
      setCurrentIdx(nextIdx);
      generateSection(nextIdx);
    }
  };

  // ─ Skip page ─
  const skipPage = () => {
    setSections(prev => prev.map((s, i) => i === currentIdx ? { ...s, status: "skipped" } : s));
    const nextIdx = currentIdx + 1;
    if (nextIdx >= PAGES_TO_BUILD.length) {
      finalize();
    } else {
      setCurrentIdx(nextIdx);
      generateSection(nextIdx);
    }
  };

  // ─ Finalize — compute combined HTML from latest sections ─
  const finalizeSections = useCallback((latestSections: SectionState[]) => {
    const combined = combinePages(latestSections);
    setFinalHtml(combined);
    setPhase("done");
  }, []);

  const finalize = () => {
    setSections(prev => {
      finalizeSections(prev);
      return prev;
    });
  };

  // ─ Copy HTML ─
  const copyHtml = async () => {
    await navigator.clipboard.writeText(finalHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─ Download HTML ─
  const downloadHtml = () => {
    const blob = new Blob([finalHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${bizName.replace(/\s+/g, "-").toLowerCase()}-website.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deviceWidth: Record<DeviceView, string> = {
    desktop: "100%", tablet: "768px", mobile: "390px",
  };

  // ───────────────────────────────────────────────────────────────
  // RENDER: WELCOME
  // ───────────────────────────────────────────────────────────────
  if (phase === "welcome") return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 py-16 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 rounded-full px-4 py-1.5 text-blue-300 text-sm mb-6">
            <Globe size={14} /> AI Website Builder — Powered by Free AI Models
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4 leading-tight">
            Build a Complete<br /><span className="text-blue-400">AI Website</span> in Minutes
          </h1>
          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
            Enter your business details, let AI generate your Homepage, About, Services, and Contact pages.
            Then preview, customize, and download.
          </p>

          {/* 5 Phase steps */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-12">
            {[
              { n: "1", label: "Setup",     emoji: "📋", desc: "Business info" },
              { n: "2", label: "Style",     emoji: "🎨", desc: "Colors & fonts" },
              { n: "3", label: "Generate",  emoji: "⚡", desc: "AI builds pages" },
              { n: "4", label: "Review",    emoji: "👁️", desc: "Keep or redo" },
              { n: "5", label: "Publish",   emoji: "🚀", desc: "Download & share" },
            ].map(step => (
              <div key={step.n} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">{step.emoji}</div>
                <div className="text-white font-semibold text-sm">{step.label}</div>
                <div className="text-slate-500 text-xs mt-0.5">{step.desc}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-8 mb-12">
            {[["500+", "Websites Built"], ["4 Pages", "Auto-Generated"], ["100%", "Free AI Models"]].map(([val, lbl]) => (
              <div key={lbl} className="text-center">
                <div className="text-3xl font-black text-blue-400">{val}</div>
                <div className="text-slate-400 text-sm">{lbl}</div>
              </div>
            ))}
          </div>

          <Button
            onClick={() => setPhase("wizard")}
            className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 text-lg rounded-xl font-bold shadow-lg shadow-blue-500/30"
          >
            <Plus size={20} className="mr-2" /> Create New Website
          </Button>
        </motion.div>
      </div>
    </div>
  );

  // ───────────────────────────────────────────────────────────────
  // RENDER: WIZARD (4 steps)
  // ───────────────────────────────────────────────────────────────
  if (phase === "wizard") {
    const STEP_LABELS = ["Business", "Content & AI", "Contact", "Style & Template"];
    const canNext = [
      bizType !== "" && bizName.trim() !== "",
      description.trim() !== "",
      true, // contact is optional
      true, // style/template always valid
    ];

    return (
      <div className="min-h-screen bg-slate-950 py-10 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header + back */}
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => setPhase("welcome")} className="text-slate-500 hover:text-white transition-colors">
              <ChevronLeft size={20} />
            </button>
            <div>
              <h2 className="text-white font-bold text-xl">New Website Setup</h2>
              <p className="text-slate-400 text-sm">Step {wizardStep + 1} of {STEP_LABELS.length} — {STEP_LABELS[wizardStep]}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex gap-1.5 mb-8">
            {STEP_LABELS.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= wizardStep ? "bg-blue-500" : "bg-slate-700"}`} />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={wizardStep} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>

              {/* ── Step 0: Business Name + Type ── */}
              {wizardStep === 0 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-white font-bold text-lg mb-4">What kind of business is this?</h3>
                    <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                      {BUSINESS_TYPES.map(bt => (
                        <button
                          key={bt.id}
                          onClick={() => { setBizType(bt.id); setBizTypeLabel(bt.label); }}
                          className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left text-sm transition-all ${bizType === bt.id ? "border-blue-500 bg-blue-500/20 text-white" : "border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-500"}`}
                        >
                          <span className="text-lg">{bt.emoji}</span>
                          <span className="leading-tight">{bt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-slate-300 font-medium text-sm mb-2 block">Business Name</label>
                    <input
                      className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="e.g. Luna Photography Studio"
                      value={bizName}
                      onChange={e => setBizName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* ── Step 1: Business Description + AI Auto-Fill ── */}
              {wizardStep === 1 && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-bold text-lg">Describe your business</h3>
                    <button
                      onClick={autoFill}
                      disabled={autoFilling || !bizName}
                      className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
                    >
                      {autoFilling ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
                      AI Auto-Fill
                    </button>
                  </div>
                  {[
                    { label: "Tagline", value: tagline, set: setTagline, ph: "e.g. Capturing life's most beautiful moments" },
                    { label: "Business Description", value: description, set: setDescription, ph: `Tell customers what ${bizName || "your business"} does and why you're the best choice...`, rows: 3 },
                    { label: "Services / Products", value: services, set: setServices, ph: "e.g. Wedding Photography, Portrait Sessions, Photo Editing..." },
                    { label: "Target Audience", value: audience, set: setAudience, ph: "e.g. Couples, families, and businesses in New York" },
                    { label: "CTA Button Text", value: ctaText, set: setCtaText, ph: "e.g. Book a Session" },
                  ].map(({ label, value, set, ph, rows }) => (
                    <div key={label}>
                      <label className="text-slate-300 font-medium text-sm mb-1.5 block">{label}</label>
                      {rows ? (
                        <textarea
                          className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none transition-colors"
                          placeholder={ph} value={value} onChange={e => set(e.target.value)} rows={rows}
                        />
                      ) : (
                        <input
                          className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                          placeholder={ph} value={value} onChange={e => set(e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ── Step 2: Contact Info ── */}
              {wizardStep === 2 && (
                <div className="space-y-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-white font-bold text-lg">Contact Information</h3>
                      <p className="text-slate-400 text-sm mt-1">Appears on your Contact page and footer. All optional.</p>
                    </div>
                    <button onClick={() => setWizardStep(3)} className="text-slate-500 hover:text-white text-sm flex items-center gap-1">
                      Skip <SkipForward size={14} />
                    </button>
                  </div>
                  {[
                    { icon: <Mail size={15} />, label: "Email Address", value: contactEmail, set: setContactEmail, ph: "hello@yourbusiness.com" },
                    { icon: <Phone size={15} />, label: "Phone Number", value: contactPhone, set: setContactPhone, ph: "+1 (555) 123-4567" },
                    { icon: <MapPin size={15} />, label: "Address", value: contactAddress, set: setContactAddress, ph: "123 Main Street, New York, NY 10001" },
                  ].map(({ icon, label, value, set, ph }) => (
                    <div key={label}>
                      <label className="text-slate-300 font-medium text-sm mb-1.5 flex items-center gap-1.5">{icon}{label}</label>
                      <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors" placeholder={ph} value={value} onChange={e => set(e.target.value)} />
                    </div>
                  ))}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { icon: <Instagram size={14} />, label: "@instagram", value: contactInstagram, set: setContactInstagram },
                      { icon: <Twitter size={14} />, label: "@twitter", value: contactTwitter, set: setContactTwitter },
                      { icon: <Facebook size={14} />, label: "facebook.com/...", value: contactFacebook, set: setContactFacebook },
                    ].map(({ icon, label, value, set }) => (
                      <div key={label}>
                        <label className="text-slate-400 text-xs mb-1 flex items-center gap-1">{icon}</label>
                        <input className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors" placeholder={label} value={value} onChange={e => set(e.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 3: Style, Template, Font, Colors ── */}
              {wizardStep === 3 && (
                <div className="space-y-6">
                  <h3 className="text-white font-bold text-lg">Style & Customization</h3>

                  {/* Logo text */}
                  <div>
                    <label className="text-slate-300 font-medium text-sm mb-1.5 flex items-center gap-1.5"><Upload size={13} /> Logo / Brand Name</label>
                    <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors" placeholder={bizName || "Your Brand"} value={logoText} onChange={e => setLogoText(e.target.value)} />
                    <p className="text-slate-500 text-xs mt-1">Logo will be displayed as styled text in the nav bar</p>
                  </div>

                  {/* Website style */}
                  <div>
                    <label className="text-slate-300 font-medium text-sm mb-2 block">Website Style</label>
                    <div className="grid grid-cols-3 gap-2">
                      {WEBSITE_STYLES.map(s => (
                        <button key={s.id} onClick={() => setStyle(s.id)} className={`p-2.5 rounded-lg border text-center transition-all ${style === s.id ? "border-blue-500 bg-blue-500/20 text-white" : "border-slate-700 bg-slate-800/40 text-slate-300 hover:border-slate-500"}`}>
                          <div className="text-xl mb-0.5">{s.emoji}</div>
                          <div className="text-xs font-semibold">{s.label}</div>
                          <div className="text-slate-500 text-xs hidden sm:block">{s.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Template */}
                  <div>
                    <label className="text-slate-300 font-medium text-sm mb-2 flex items-center gap-1.5"><ImageIcon size={13} /> Template Layout</label>
                    <div className="grid grid-cols-2 gap-2">
                      {TEMPLATES.map(t => (
                        <button key={t.id} onClick={() => setTemplateId(t.id)} className={`p-3 rounded-xl border text-left transition-all ${templateId === t.id ? "border-blue-500 bg-blue-500/20" : "border-slate-700 bg-slate-800/40 hover:border-slate-500"}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{t.emoji}</span>
                            <span className={`font-semibold text-sm ${templateId === t.id ? "text-white" : "text-slate-300"}`}>{t.label}</span>
                          </div>
                          <p className="text-slate-500 text-xs leading-snug">{t.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font pairing */}
                  <div>
                    <label className="text-slate-300 font-medium text-sm mb-2 flex items-center gap-1.5"><Type size={13} /> Font Pairing</label>
                    <div className="space-y-2">
                      {FONT_PAIRINGS.map(f => (
                        <button key={f.id} onClick={() => setFontId(f.id)} className={`w-full text-left p-3 rounded-xl border transition-all ${fontId === f.id ? "border-blue-500 bg-blue-500/20 text-white" : "border-slate-700 bg-slate-800/40 text-slate-300 hover:border-slate-500"}`}>
                          <span className="text-sm font-medium">{f.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color scheme */}
                  <div>
                    <label className="text-slate-300 font-medium text-sm mb-2 flex items-center gap-1.5"><Palette size={13} /> Color Scheme</label>
                    <div className="grid grid-cols-3 gap-2">
                      {COLOR_SCHEMES.map(c => (
                        <button key={c.id} onClick={() => setColorId(c.id)} className={`p-3 rounded-xl border transition-all ${colorId === c.id ? "border-blue-500 ring-2 ring-blue-500/40" : "border-slate-700 hover:border-slate-500"}`} style={{ background: c.bg }}>
                          <div className="flex gap-1.5 justify-center mb-1.5">
                            {[c.bg, c.accent, c.text].map((col, i) => (
                              <span key={i} className="w-4 h-4 rounded-full border border-white/10" style={{ background: col }} />
                            ))}
                          </div>
                          <div className="text-xs font-medium text-center" style={{ color: c.text }}>{c.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-800">
            <Button
              variant="ghost"
              onClick={() => setWizardStep(Math.max(0, wizardStep - 1))}
              className="text-slate-400 hover:text-white"
              disabled={wizardStep === 0}
            >
              <ChevronLeft size={16} className="mr-1" /> Back
            </Button>
            {wizardStep < 3 ? (
              <Button
                onClick={() => setWizardStep(wizardStep + 1)}
                disabled={!canNext[wizardStep]}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 disabled:opacity-40"
              >
                Next <ChevronRight size={16} className="ml-1" />
              </Button>
            ) : (
              <Button
                onClick={startBuilding}
                disabled={!bizName}
                className="bg-green-600 hover:bg-green-500 text-white px-8 font-bold shadow-lg shadow-green-500/25"
              >
                <Zap size={16} className="mr-2" /> Start Building
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────
  // RENDER: BUILDING (page-by-page generation)
  // ───────────────────────────────────────────────────────────────
  if (phase === "building") {
    const current = sections[currentIdx];
    const totalDone = sections.filter(s => s.status === "done" || s.status === "skipped").length;

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        {/* Top bar */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-blue-400" />
              <span className="text-white font-bold">{bizName}</span>
              <span className="text-slate-500 text-sm">— Building Website</span>
            </div>
            <div className="flex items-center gap-2">
              {sections.map((s, i) => (
                <div key={s.key} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${i === currentIdx ? "bg-blue-600 text-white" : s.status === "done" ? "bg-green-800/50 text-green-400" : s.status === "skipped" ? "bg-slate-800 text-slate-500 line-through" : "bg-slate-800 text-slate-400"}`}>
                  {s.status === "done" && <CheckCircle2 size={11} />}
                  {s.status === "generating" && <Loader2 size={11} className="animate-spin" />}
                  {s.emoji} {s.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col">
          {/* Current page header */}
          <div className="bg-slate-900/50 border-b border-slate-800 px-4 py-3">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{current.emoji}</span>
                  <div>
                    <h3 className="text-white font-bold">{current.label}</h3>
                    <p className="text-slate-400 text-xs">{current.desc}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isGenerating ? (
                  <div className="flex items-center gap-2 text-blue-400 text-sm">
                    <Loader2 size={16} className="animate-spin" />
                    Generating with AI...
                  </div>
                ) : current.status === "done" ? (
                  <>
                    <button
                      onClick={() => generateSection(currentIdx, true)}
                      className="flex items-center gap-1.5 text-slate-300 hover:text-white text-sm px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors"
                    >
                      <RefreshCw size={14} /> Regenerate
                    </button>
                    <button
                      onClick={skipPage}
                      className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors"
                    >
                      <SkipForward size={14} /> Skip
                    </button>
                    <button
                      onClick={keepAndNext}
                      className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white text-sm px-4 py-1.5 rounded-lg font-semibold transition-colors"
                    >
                      <CheckCircle2 size={14} />
                      {currentIdx < PAGES_TO_BUILD.length - 1 ? "Keep & Next →" : "Finish →"}
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          {/* Preview iframe */}
          <div className="flex-1 relative bg-slate-900 overflow-hidden">
            {current.html ? (
              <iframe
                srcDoc={current.html}
                className="w-full h-full border-0"
                style={{ minHeight: "calc(100vh - 200px)" }}
                title={`${current.label} preview`}
                sandbox="allow-same-origin"
              />
            ) : (
              <div className="flex items-center justify-center h-full" style={{ minHeight: "calc(100vh - 200px)" }}>
                <div className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-ping" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 size={32} className="text-blue-400 animate-spin" />
                    </div>
                  </div>
                  <p className="text-white font-semibold text-lg">Generating {current.label}...</p>
                  <p className="text-slate-400 text-sm mt-1">AI is writing your {current.desc.toLowerCase()}</p>
                  <div className="mt-4 flex gap-1 justify-center">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Progress footer */}
          <div className="bg-slate-900 border-t border-slate-800 px-4 py-2">
            <div className="max-w-6xl mx-auto flex items-center gap-3">
              <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${(totalDone / PAGES_TO_BUILD.length) * 100}%` }} />
              </div>
              <span className="text-slate-400 text-xs">{totalDone}/{PAGES_TO_BUILD.length} pages</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────
  // RENDER: DONE (full preview + customize + publish)
  // ───────────────────────────────────────────────────────────────
  if (phase === "done") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        {/* Top bar */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => { setPhase("building"); setCurrentIdx(0); }} className="text-slate-500 hover:text-white">
              <ChevronLeft size={20} />
            </button>
            <Globe size={18} className="text-green-400" />
            <span className="text-white font-bold">{bizName}</span>
            <span className="bg-green-800/50 text-green-400 text-xs px-2 py-0.5 rounded-full border border-green-700/50">Ready</span>
          </div>

          {/* Device toggle */}
          <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1">
            {(["desktop", "tablet", "mobile"] as DeviceView[]).map(d => {
              const Icon = d === "desktop" ? Monitor : d === "tablet" ? Tablet : Smartphone;
              return (
                <button key={d} onClick={() => setDevice(d)} className={`p-2 rounded-lg transition-colors ${device === d ? "bg-slate-600 text-white" : "text-slate-400 hover:text-white"}`}>
                  <Icon size={16} />
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditPanel(!showEditPanel)}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white text-sm px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors"
            >
              <Sparkles size={14} /> Edit with AI
            </button>
            <button
              onClick={copyHtml}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white text-sm px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy HTML"}
            </button>
            <button
              onClick={downloadHtml}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-1.5 rounded-lg font-semibold transition-colors"
            >
              <Download size={14} /> Download
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* AI Edit Panel */}
          <AnimatePresence>
            {showEditPanel && (
              <motion.div
                initial={{ width: 0, opacity: 0 }} animate={{ width: 340, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                className="bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden shrink-0"
              >
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="text-white font-semibold flex items-center gap-2"><Sparkles size={16} className="text-violet-400" />Edit with AI</h3>
                  <button onClick={() => setShowEditPanel(false)} className="text-slate-500 hover:text-white"><X size={16} /></button>
                </div>
                <div className="p-4 flex-1 space-y-4 overflow-y-auto">
                  <p className="text-slate-400 text-xs">Describe what you want to change and AI will update the website.</p>

                  {/* Quick edits */}
                  <div>
                    <p className="text-slate-300 text-xs font-semibold mb-2">Quick edits</p>
                    <div className="space-y-1.5">
                      {[
                        "Make the hero section more energetic",
                        "Add more social proof and testimonials",
                        "Make the pricing section clearer",
                        "Change the CTA text to be more compelling",
                        "Add an FAQ section to the contact page",
                      ].map(q => (
                        <button key={q} onClick={() => setEditPrompt(q)} className="w-full text-left text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 rounded-lg px-3 py-2 transition-colors">
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom edit */}
                  <div>
                    <p className="text-slate-300 text-xs font-semibold mb-1.5">Custom instruction</p>
                    <textarea
                      className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none transition-colors"
                      placeholder="e.g. Change the color scheme to green, make the headline shorter..."
                      rows={3}
                      value={editPrompt}
                      onChange={e => setEditPrompt(e.target.value)}
                    />
                    <Button
                      onClick={() => {
                        if (!editPrompt.trim()) return;
                        setEditingWith(true);
                        setEditPrompt("");
                        setTimeout(() => setEditingWith(false), 2000);
                      }}
                      disabled={!editPrompt.trim() || editingWith}
                      className="w-full mt-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50"
                    >
                      {editingWith ? <><Loader2 size={14} className="animate-spin mr-2" />Applying...</> : <><Sparkles size={14} className="mr-2" />Apply Change</>}
                    </Button>
                  </div>

                  {/* Website stats */}
                  <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
                    <p className="text-slate-300 text-xs font-semibold mb-2">Website Summary</p>
                    <div className="space-y-1.5 text-xs text-slate-400">
                      <div className="flex justify-between"><span>Pages generated</span><span className="text-white">{sections.filter(s => s.status === "done").length}</span></div>
                      <div className="flex justify-between"><span>Pages skipped</span><span className="text-white">{sections.filter(s => s.status === "skipped").length}</span></div>
                      <div className="flex justify-between"><span>Template</span><span className="text-white">{TEMPLATES.find(t => t.id === templateId)?.label}</span></div>
                      <div className="flex justify-between"><span>Color scheme</span><span className="text-white">{COLOR_SCHEMES.find(c => c.id === colorId)?.name}</span></div>
                      <div className="flex justify-between"><span>Font</span><span className="text-white">{FONT_PAIRINGS.find(f => f.id === fontId)?.label.split("—")[0].trim()}</span></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Preview */}
          <div className="flex-1 overflow-auto bg-slate-800 flex items-start justify-center p-6">
            <div
              className="bg-white shadow-2xl transition-all duration-500 rounded-lg overflow-hidden"
              style={{ width: deviceWidth[device], maxWidth: "100%", minHeight: "calc(100vh - 100px)" }}
            >
              {finalHtml ? (
                <iframe
                  srcDoc={finalHtml}
                  className="w-full border-0"
                  style={{ height: "calc(100vh - 100px)", minHeight: 600 }}
                  title="Website preview"
                  sandbox="allow-same-origin"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-8">
                    <Loader2 size={40} className="animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">Combining all pages...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Build new site button */}
        <div className="bg-slate-900 border-t border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="text-slate-400 text-sm">
            🎉 Your website is ready! Download the HTML file and host it anywhere.
          </div>
          <button
            onClick={() => { setPhase("welcome"); setWizardStep(0); setBizType(""); setBizName(""); setDescription(""); setSections(PAGES_TO_BUILD.map(p => ({ ...p, status: "pending", html: "" }))); }}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={14} /> Build Another Website
          </button>
        </div>
      </div>
    );
  }

  return null;
}
