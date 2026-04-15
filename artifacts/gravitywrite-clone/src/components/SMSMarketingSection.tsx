import { useState, useRef } from "react";
import { useGenerationGate } from "@/components/GenerationGate";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Loader2, Copy, Check, RefreshCw, Sparkles,
  AlertCircle, Smartphone, Target, Zap, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "") + "/__api/";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SMSVariant {
  text: string;
  charCount: number;
  segments: number;
  tone: string;
}

interface SMSResult {
  variants: SMSVariant[];
  followUp?: string;
  complianceNote: string;
  bestPractices: string[];
  estimatedOpenRate: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SMS_TYPES = [
  { id: "flash_sale",    emoji: "⚡", label: "Flash Sale",          desc: "Time-limited discount alert" },
  { id: "promotional",   emoji: "🏷️", label: "Promotional",         desc: "Product or service promotion" },
  { id: "reminder",      emoji: "⏰", label: "Appointment Reminder", desc: "Booking or appointment alert" },
  { id: "event",         emoji: "🎉", label: "Event / Launch",       desc: "Event or product launch" },
  { id: "loyalty",       emoji: "⭐", label: "Loyalty / VIP",        desc: "Rewards and loyalty perks" },
  { id: "restock",       emoji: "📦", label: "Back in Stock",        desc: "Product availability alert" },
  { id: "abandoned",     emoji: "🛒", label: "Cart Recovery",        desc: "SMS cart abandonment" },
  { id: "survey",        emoji: "📊", label: "Survey / Feedback",    desc: "Customer feedback request" },
];

const INDUSTRIES = [
  "Retail / E-commerce", "Restaurant / Food", "Beauty & Spa", "Healthcare / Clinic",
  "Real Estate", "Fitness / Gym", "Education", "Events / Entertainment",
  "Automotive", "Finance / Insurance",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function charColor(count: number) {
  if (count <= 160) return "text-emerald-400";
  if (count <= 320) return "text-amber-400";
  return "text-red-400";
}

function segmentLabel(segments: number) {
  if (segments === 1) return "1 SMS";
  return `${segments} SMS segments`;
}

function PhonePreview({ text, brand }: { text: string; brand: string }) {
  return (
    <div className="bg-slate-950 rounded-3xl border-4 border-slate-700 p-3 w-52 mx-auto shadow-2xl">
      <div className="bg-slate-800 rounded-full w-12 h-1.5 mx-auto mb-3" />
      <div className="bg-slate-900 rounded-2xl p-3 min-h-[120px]">
        <div className="text-slate-500 text-[10px] text-center mb-2 font-medium">{brand || "Business"}</div>
        <div className="bg-slate-700 rounded-2xl rounded-tl-sm px-3 py-2 max-w-[85%]">
          <p className="text-white text-xs leading-relaxed">{text || "Your SMS will appear here..."}</p>
        </div>
        <div className="text-slate-600 text-[9px] mt-1 ml-1">Delivered</div>
      </div>
      <div className="bg-slate-800 rounded-full w-8 h-1.5 mx-auto mt-3" />
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg transition-colors shrink-0"
    >
      {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function SMSMarketingSection() {
  const { requestGeneration } = useGenerationGate();

  const [smsType, setSmsType]       = useState("flash_sale");
  const [business, setBusiness]     = useState("");
  const [offer, setOffer]           = useState("");
  const [cta, setCta]               = useState("");
  const [landingUrl, setLandingUrl] = useState("");
  const [industry, setIndustry]     = useState("Retail / E-commerce");
  const [optOut, setOptOut]         = useState("Reply STOP to opt out");
  const [previewIdx, setPreviewIdx] = useState(0);

  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState<SMSResult | null>(null);
  const [error, setError]           = useState("");

  const abortRef = useRef<AbortController | null>(null);

  async function generate() {
    if (!business.trim() || !offer.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError("");
    setResult(null);
    setPreviewIdx(0);

    try {
      const res = await fetch(`${BASE_URL}ai/sms-campaign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smsType, business, offer, cta, landingUrl, industry, optOut }),
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

  const canGenerate = business.trim().length > 0 && offer.trim().length > 0;
  const activeVariant = result?.variants?.[previewIdx];

  return (
    <section id="sms-marketing" className="py-20 px-4 bg-gradient-to-b from-[#0d0d20] to-[#0a0a1a]">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/25 rounded-full px-4 py-1.5 mb-4">
            <MessageSquare size={14} className="text-violet-400" />
            <span className="text-violet-300 text-sm font-medium">AI SMS Marketing</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            SMS Campaigns That <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-500">Get Read</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Generate compliant, high-impact SMS campaigns with character counts, A/B variants, and TCPA compliance notes.
          </p>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><Zap size={13} className="text-violet-400" /> 98% open rate</span>
            <span className="flex items-center gap-1.5"><Smartphone size={13} className="text-violet-400" /> Avg 3 min response</span>
            <span className="flex items-center gap-1.5"><Target size={13} className="text-violet-400" /> 45% click-through</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-[420px,1fr] gap-8">

          {/* ── Left: Form ─────────────────────────────────────────────── */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5 h-fit">

            {/* SMS Type */}
            <div>
              <label className="text-slate-300 text-sm font-semibold mb-3 block flex items-center gap-2">
                <MessageSquare size={14} className="text-violet-400" /> Campaign Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SMS_TYPES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSmsType(t.id)}
                    className={`flex flex-col p-2.5 rounded-xl border transition-all text-left ${
                      smsType === t.id
                        ? "border-violet-500 bg-violet-500/15 text-white"
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

            {/* Business */}
            <div>
              <label className="text-slate-300 text-sm font-medium mb-1.5 block">Business / Brand Name *</label>
              <input
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors text-sm"
                placeholder="e.g. Nike, Joe's Pizza, DrSmith Clinic"
                value={business}
                onChange={e => setBusiness(e.target.value)}
              />
            </div>

            {/* Offer/Message */}
            <div>
              <label className="text-slate-300 text-sm font-medium mb-1.5 block">Key Message / Offer *</label>
              <textarea
                rows={3}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors text-sm resize-none"
                placeholder="e.g. 50% off all shoes this weekend only, ends Sunday midnight"
                value={offer}
                onChange={e => setOffer(e.target.value)}
              />
            </div>

            {/* CTA & URL */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 text-sm font-medium mb-1.5 block">Call-to-Action</label>
                <input
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors text-sm"
                  placeholder="Shop Now"
                  value={cta}
                  onChange={e => setCta(e.target.value)}
                />
              </div>
              <div>
                <label className="text-slate-300 text-sm font-medium mb-1.5 block">Short URL</label>
                <input
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors text-sm"
                  placeholder="bit.ly/abc123"
                  value={landingUrl}
                  onChange={e => setLandingUrl(e.target.value)}
                />
              </div>
            </div>

            {/* Industry */}
            <div>
              <label className="text-slate-300 text-sm font-medium mb-1.5 block">Industry</label>
              <select
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 transition-colors text-sm"
                value={industry}
                onChange={e => setIndustry(e.target.value)}
              >
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>

            {/* Opt-out text */}
            <div>
              <label className="text-slate-300 text-sm font-medium mb-1.5 block flex items-center gap-1.5">
                <Info size={12} className="text-violet-400" /> Opt-out / Compliance Line
              </label>
              <input
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors text-sm"
                value={optOut}
                onChange={e => setOptOut(e.target.value)}
              />
              <p className="text-slate-500 text-xs mt-1">Required for TCPA / GDPR compliance</p>
            </div>

            <Button
              onClick={() => requestGeneration(generate)}
              disabled={!canGenerate || loading}
              className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-violet-500/25 disabled:opacity-40"
            >
              {loading ? <><Loader2 size={16} className="animate-spin mr-2" /> Generating...</> : <><Sparkles size={16} className="mr-2" /> Generate SMS Variants</>}
            </Button>
          </div>

          {/* ── Right: Output ───────────────────────────────────────────── */}
          <div>
            <AnimatePresence mode="wait">
              {!result && !loading && !error && (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="h-full min-h-[500px] flex flex-col items-center justify-center text-center bg-slate-900/30 border border-dashed border-slate-700 rounded-2xl p-10">
                  <PhonePreview text="" brand={business} />
                  <p className="text-white font-semibold text-lg mt-6 mb-2">Your SMS Variants Will Appear Here</p>
                  <p className="text-slate-400 text-sm max-w-xs">You'll get 4 A/B-testable SMS variants with character counts, compliance notes, and best practice tips.</p>
                </motion.div>
              )}

              {loading && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="h-full min-h-[500px] flex flex-col items-center justify-center bg-slate-900/30 border border-dashed border-slate-700 rounded-2xl p-10">
                  <Loader2 size={40} className="animate-spin text-violet-400 mb-4" />
                  <p className="text-white font-semibold mb-1">Writing Your SMS Campaign</p>
                  <p className="text-slate-400 text-sm">Creating high-converting variants with compliance language…</p>
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

                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="bg-violet-500/15 text-violet-400 border border-violet-500/30 text-xs px-2.5 py-1 rounded-full">✓ {result.variants?.length} Variants Ready</span>
                      <span className="text-slate-400 text-xs">{result.estimatedOpenRate}</span>
                    </div>
                    <button onClick={() => requestGeneration(generate)} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 transition-colors">
                      <RefreshCw size={12} /> Regenerate
                    </button>
                  </div>

                  {/* Phone preview + variant selector */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                    <div className="flex gap-6 flex-col sm:flex-row items-start">
                      <div className="shrink-0">
                        <PhonePreview text={activeVariant?.text || ""} brand={business} />
                      </div>
                      <div className="flex-1 space-y-2 min-w-0">
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-3">Select Variant</p>
                        {result.variants?.map((v, i) => (
                          <button
                            key={i}
                            onClick={() => setPreviewIdx(i)}
                            className={`w-full text-left p-3 rounded-xl border transition-all ${
                              previewIdx === i ? "border-violet-500 bg-violet-500/10" : "border-slate-700 bg-slate-800/40 hover:border-slate-600"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                previewIdx === i ? "bg-violet-500/20 text-violet-300" : "bg-slate-700 text-slate-400"
                              }`}>Variant {i + 1} · {v.tone}</span>
                              <span className={`text-xs font-mono ${charColor(v.charCount)}`}>{v.charCount} chars · {segmentLabel(v.segments)}</span>
                            </div>
                            <p className="text-white text-xs leading-relaxed line-clamp-2">{v.text}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Active variant full view */}
                  {activeVariant && (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-white font-semibold">Variant {previewIdx + 1} — Full Text</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-mono ${charColor(activeVariant.charCount)}`}>
                            {activeVariant.charCount}/160 · {segmentLabel(activeVariant.segments)}
                          </span>
                          <CopyBtn text={activeVariant.text} />
                        </div>
                      </div>
                      <div className="bg-slate-800 rounded-xl p-4">
                        <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{activeVariant.text}</p>
                      </div>
                    </div>
                  )}

                  {/* All variants copy list */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-3">All Variants</p>
                    <div className="space-y-3">
                      {result.variants?.map((v, i) => (
                        <div key={i} className="flex items-start gap-3 bg-slate-800/50 rounded-xl p-3">
                          <span className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm leading-relaxed">{v.text}</p>
                            <p className={`text-xs mt-1 font-mono ${charColor(v.charCount)}`}>{v.charCount} chars · {segmentLabel(v.segments)} · {v.tone}</p>
                          </div>
                          <CopyBtn text={v.text} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Follow-up */}
                  {result.followUp && (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">Suggested Follow-up SMS (24h later)</p>
                      <div className="flex items-start gap-3">
                        <p className="text-slate-300 text-sm flex-1">{result.followUp}</p>
                        <CopyBtn text={result.followUp} />
                      </div>
                    </div>
                  )}

                  {/* Compliance */}
                  <div className="bg-amber-500/8 border border-amber-500/20 rounded-2xl p-4">
                    <p className="text-amber-300 text-xs font-semibold mb-1 flex items-center gap-1.5"><Info size={12} /> Compliance Note</p>
                    <p className="text-slate-300 text-sm">{result.complianceNote}</p>
                  </div>

                  {/* Best Practices */}
                  {result.bestPractices?.length > 0 && (
                    <div className="bg-violet-500/8 border border-violet-500/20 rounded-2xl p-4">
                      <p className="text-violet-300 text-xs font-semibold mb-3">📱 SMS Best Practices</p>
                      <ul className="space-y-1.5">
                        {result.bestPractices.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                            <span className="text-violet-400 mt-0.5 shrink-0">→</span>{tip}
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
