import { useState, useRef } from "react";
import { useGenerationGate } from "@/components/GenerationGate";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Loader2, Copy, Check, RefreshCw, Sparkles, Download,
  AlertCircle, Send, Users, Target, BarChart2, Eye, Code2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "") + "/__api/";

// ── Types ─────────────────────────────────────────────────────────────────────

interface EmailResult {
  subject: string;
  preheader: string;
  body: string;
  htmlEmail: string;
  subjectVariants: string[];
  tips: string[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const EMAIL_TYPES = [
  { id: "newsletter",    emoji: "📰", label: "Newsletter",        desc: "Regular content updates" },
  { id: "promotional",   emoji: "🏷️", label: "Promotional",       desc: "Sales, discounts & offers" },
  { id: "welcome",       emoji: "👋", label: "Welcome Email",      desc: "Onboard new subscribers" },
  { id: "abandoned",     emoji: "🛒", label: "Abandoned Cart",     desc: "Recover lost sales" },
  { id: "reengagement",  emoji: "🔄", label: "Re-engagement",      desc: "Win back inactive users" },
  { id: "cold",          emoji: "❄️", label: "Cold Outreach",      desc: "B2B prospecting email" },
  { id: "drip",          emoji: "💧", label: "Drip / Nurture",     desc: "Automated sequence email" },
  { id: "announcement",  emoji: "📢", label: "Announcement",       desc: "Product launch or news" },
];

const TONES = [
  { id: "professional",  label: "Professional" },
  { id: "friendly",      label: "Friendly & Warm" },
  { id: "urgent",        label: "Urgent / Time-sensitive" },
  { id: "storytelling",  label: "Storytelling" },
  { id: "luxury",        label: "Luxury / Premium" },
  { id: "casual",        label: "Casual & Fun" },
];

const INDUSTRIES = [
  "E-commerce", "SaaS / Software", "Consulting / Services", "Healthcare", "Education",
  "Finance", "Real Estate", "Food & Beverage", "Fashion & Beauty", "Travel",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function CopyBtn({ text, label = "" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg transition-colors"
    >
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
      {copied ? "Copied!" : label || "Copy"}
    </button>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function EmailMarketingSection() {
  const { requestGeneration } = useGenerationGate();

  const [emailType, setEmailType]   = useState("promotional");
  const [brand, setBrand]           = useState("");
  const [product, setProduct]       = useState("");
  const [tone, setTone]             = useState("professional");
  const [goal, setGoal]             = useState("");
  const [cta, setCta]               = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [industry, setIndustry]     = useState("E-commerce");
  const [offer, setOffer]           = useState("");

  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState<EmailResult | null>(null);
  const [error, setError]           = useState("");
  const [viewMode, setViewMode]     = useState<"preview" | "html">("preview");

  const abortRef = useRef<AbortController | null>(null);

  async function generate() {
    if (!brand.trim() || !product.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`${BASE_URL}ai/email-campaign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailType, brand, product, tone, goal, cta, recipientName, industry, offer }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data);
    } catch (e: unknown) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function downloadHtml() {
    if (!result) return;
    const blob = new Blob([result.htmlEmail], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${brand.toLowerCase().replace(/\s/g, "-")}-email.html`;
    a.click();
  }

  const canGenerate = brand.trim().length > 0 && product.trim().length > 0;

  return (
    <section id="email-marketing" className="py-20 px-4 bg-gradient-to-b from-[#0a0a1a] to-[#0d0d20]">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-4 py-1.5 mb-4">
            <Mail size={14} className="text-emerald-400" />
            <span className="text-emerald-300 text-sm font-medium">AI Email Marketing</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Write Emails That <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Actually Convert</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Generate complete email campaigns with subject lines, preview text, body copy and full HTML templates — ready to send.
          </p>
        </div>

        <div className="grid lg:grid-cols-[420px,1fr] gap-8">

          {/* ── Left: Form ─────────────────────────────────────────────── */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5 h-fit">

            {/* Email Type */}
            <div>
              <label className="text-slate-300 text-sm font-semibold mb-3 block flex items-center gap-2">
                <Send size={14} className="text-emerald-400" /> Email Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {EMAIL_TYPES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setEmailType(t.id)}
                    className={`flex flex-col p-2.5 rounded-xl border transition-all text-left ${
                      emailType === t.id
                        ? "border-emerald-500 bg-emerald-500/15 text-white"
                        : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    <span className="text-base mb-0.5">{t.emoji}</span>
                    <span className="text-xs font-semibold leading-tight">{t.label}</span>
                    <span className="text-[10px] opacity-60 leading-tight mt-0.5">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Brand & Product */}
            <div>
              <label className="text-slate-300 text-sm font-medium mb-1.5 block">Brand / Company Name *</label>
              <input
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                placeholder="e.g. ShopEase"
                value={brand}
                onChange={e => setBrand(e.target.value)}
              />
            </div>

            <div>
              <label className="text-slate-300 text-sm font-medium mb-1.5 block">Product / Service / Topic *</label>
              <textarea
                rows={2}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors text-sm resize-none"
                placeholder="e.g. Summer sale — 40% off all sneakers this weekend"
                value={product}
                onChange={e => setProduct(e.target.value)}
              />
            </div>

            <div>
              <label className="text-slate-300 text-sm font-medium mb-1.5 block">Special Offer / Key Message</label>
              <input
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                placeholder="e.g. 40% off + free shipping ends Sunday"
                value={offer}
                onChange={e => setOffer(e.target.value)}
              />
            </div>

            {/* CTA */}
            <div>
              <label className="text-slate-300 text-sm font-medium mb-1.5 block flex items-center gap-1.5"><Target size={13} /> Call-to-Action</label>
              <input
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                placeholder="e.g. Shop Now, Get 40% Off, Book a Call"
                value={cta}
                onChange={e => setCta(e.target.value)}
              />
            </div>

            {/* Personalization */}
            <div>
              <label className="text-slate-300 text-sm font-medium mb-1.5 block flex items-center gap-1.5"><Users size={13} /> Recipient Name (for personalization)</label>
              <input
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                placeholder="e.g. {first_name} or leave blank"
                value={recipientName}
                onChange={e => setRecipientName(e.target.value)}
              />
            </div>

            {/* Industry */}
            <div>
              <label className="text-slate-300 text-sm font-medium mb-1.5 block">Industry</label>
              <select
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                value={industry}
                onChange={e => setIndustry(e.target.value)}
              >
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>

            {/* Tone */}
            <div>
              <label className="text-slate-300 text-sm font-medium mb-2 block">Tone & Style</label>
              <div className="grid grid-cols-2 gap-1.5">
                {TONES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    className={`p-2 rounded-lg border text-xs transition-all ${
                      tone === t.id ? "border-emerald-500 bg-emerald-500/15 text-emerald-300" : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={() => requestGeneration(generate)}
              disabled={!canGenerate || loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/25 disabled:opacity-40"
            >
              {loading ? <><Loader2 size={16} className="animate-spin mr-2" /> Writing Email...</> : <><Sparkles size={16} className="mr-2" /> Generate Email Campaign</>}
            </Button>
          </div>

          {/* ── Right: Output ───────────────────────────────────────────── */}
          <div>
            <AnimatePresence mode="wait">
              {!result && !loading && !error && (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="h-full min-h-[500px] flex flex-col items-center justify-center text-center bg-slate-900/30 border border-dashed border-slate-700 rounded-2xl p-10">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
                    <Mail size={28} className="text-emerald-400" />
                  </div>
                  <p className="text-white font-semibold text-lg mb-2">Your Email Will Appear Here</p>
                  <p className="text-slate-400 text-sm max-w-xs">Fill in the form and generate a complete email with subject lines, body copy, and an HTML template.</p>
                  <div className="mt-8 grid grid-cols-2 gap-3 max-w-xs text-left">
                    {[
                      { emoji: "✉️", label: "Subject line + 3 variants" },
                      { emoji: "👁️", label: "Preheader / preview text" },
                      { emoji: "📝", label: "Full email body copy" },
                      { emoji: "🎨", label: "Styled HTML template" },
                    ].map(f => (
                      <div key={f.label} className="bg-slate-800/50 rounded-xl p-3 flex items-start gap-2">
                        <span className="text-lg mt-0.5">{f.emoji}</span>
                        <p className="text-slate-400 text-xs">{f.label}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {loading && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="h-full min-h-[500px] flex flex-col items-center justify-center bg-slate-900/30 border border-dashed border-slate-700 rounded-2xl p-10">
                  <Loader2 size={40} className="animate-spin text-emerald-400 mb-4" />
                  <p className="text-white font-semibold mb-1">Crafting Your Email</p>
                  <p className="text-slate-400 text-sm">Writing subject lines, body copy and HTML template…</p>
                </motion.div>
              )}

              {error && (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-300 font-semibold">Generation Failed</p>
                    <p className="text-red-400/70 text-sm mt-1">{error}</p>
                    <button onClick={() => requestGeneration(generate)} className="mt-3 text-sm text-red-300 hover:text-white flex items-center gap-1"><RefreshCw size={13} /> Try again</button>
                  </div>
                </motion.div>
              )}

              {result && !loading && (
                <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

                  {/* Action bar */}
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-1 rounded-full">✓ Email Ready</span>
                      <button onClick={() => requestGeneration(generate)} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 transition-colors">
                        <RefreshCw size={12} /> Regenerate
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewMode(viewMode === "preview" ? "html" : "preview")}
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 transition-colors"
                      >
                        {viewMode === "preview" ? <Code2 size={12} /> : <Eye size={12} />}
                        {viewMode === "preview" ? "View HTML" : "View Preview"}
                      </button>
                      <button onClick={downloadHtml} className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-1.5 transition-colors">
                        <Download size={12} /> Download HTML
                      </button>
                    </div>
                  </div>

                  {/* Subject & Preheader */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Subject Line</span>
                        <CopyBtn text={result.subject} />
                      </div>
                      <p className="text-white font-semibold text-base">{result.subject}</p>
                    </div>
                    <div className="border-t border-slate-800 pt-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Preview Text / Preheader</span>
                        <CopyBtn text={result.preheader} />
                      </div>
                      <p className="text-slate-300 text-sm">{result.preheader}</p>
                    </div>
                  </div>

                  {/* Subject Variants */}
                  {result.subjectVariants?.length > 0 && (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-3">Subject Line Variants (A/B Test)</p>
                      <div className="space-y-2">
                        {result.subjectVariants.map((s, i) => (
                          <div key={i} className="flex items-center justify-between bg-slate-800/50 rounded-xl px-4 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">{i + 1}</span>
                              <span className="text-white text-sm">{s}</span>
                            </div>
                            <CopyBtn text={s} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Body / HTML Preview */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
                      <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                        {viewMode === "preview" ? "Email Preview" : "HTML Source"}
                      </span>
                      <CopyBtn text={viewMode === "preview" ? result.body : result.htmlEmail} label={viewMode === "preview" ? "Copy Text" : "Copy HTML"} />
                    </div>
                    {viewMode === "preview" ? (
                      <div className="p-5">
                        <iframe
                          srcDoc={result.htmlEmail}
                          className="w-full rounded-xl border border-slate-700 bg-white"
                          style={{ height: "600px" }}
                          title="Email Preview"
                        />
                      </div>
                    ) : (
                      <div className="p-5">
                        <pre className="text-xs text-slate-300 bg-slate-950 rounded-xl p-4 overflow-auto max-h-[500px] leading-relaxed whitespace-pre-wrap">
                          {result.htmlEmail}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Tips */}
                  {result.tips?.length > 0 && (
                    <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-2xl p-5">
                      <p className="text-emerald-300 text-sm font-semibold mb-3 flex items-center gap-2"><BarChart2 size={14} /> Campaign Performance Tips</p>
                      <ul className="space-y-2">
                        {result.tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                            <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
