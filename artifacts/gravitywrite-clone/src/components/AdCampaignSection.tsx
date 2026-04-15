import { useState, useRef } from "react";
import { useGenerationGate } from "@/components/GenerationGate";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone, Loader2, Copy, Check, RefreshCw, ChevronDown, ChevronUp,
  Sparkles, Target, Users, DollarSign, Zap, BarChart2, Globe, Instagram,
  Facebook, Search, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "") + "/__api/";

// ── Types ─────────────────────────────────────────────────────────────────────

type Platform = "google" | "facebook" | "instagram";

interface GoogleAd {
  headline1: string; headline2: string; headline3: string;
  description1: string; description2: string;
  displayPath: string; finalUrl: string;
  calloutExtensions: string[]; sitelinks: { title: string; desc: string }[];
}

interface FacebookAd {
  primaryText: string; headline: string; description: string;
  cta: string; imageCaption: string;
  audienceInsight: string; placementTips: string;
}

interface InstagramAd {
  caption: string; hashtags: string[];
  storyCopy: string[]; reelHook: string;
  ctaSticker: string; audienceNote: string;
}

type AdResult = { google?: GoogleAd; facebook?: FacebookAd; instagram?: InstagramAd };

// ── Constants ────────────────────────────────────────────────────────────────

const PLATFORMS = [
  { id: "google" as Platform,    label: "Google Ads",    emoji: "🔍", color: "from-blue-600 to-indigo-600",    border: "border-blue-500",    icon: Search },
  { id: "facebook" as Platform,  label: "Facebook Ads",  emoji: "👥", color: "from-blue-500 to-blue-700",     border: "border-blue-400",    icon: Facebook },
  { id: "instagram" as Platform, label: "Instagram Ads", emoji: "📸", color: "from-pink-500 to-purple-600",   border: "border-pink-500",    icon: Instagram },
];

const AD_GOALS = [
  { id: "awareness",   emoji: "👁️",  label: "Brand Awareness" },
  { id: "traffic",     emoji: "🌐", label: "Drive Traffic" },
  { id: "leads",       emoji: "🎯", label: "Generate Leads" },
  { id: "sales",       emoji: "💰", label: "Drive Sales" },
  { id: "installs",    emoji: "📱", label: "App Installs" },
  { id: "engagement",  emoji: "💬", label: "Engagement" },
];

const TONES = [
  { id: "urgent",       label: "Urgent / FOMO" },
  { id: "professional", label: "Professional" },
  { id: "friendly",     label: "Friendly" },
  { id: "bold",         label: "Bold / Confident" },
  { id: "playful",      label: "Playful" },
  { id: "luxury",       label: "Luxury / Premium" },
];

const BUDGETS = ["Under $500/mo", "$500–$2k/mo", "$2k–$10k/mo", "$10k+/mo"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function charBadge(text: string, max: number) {
  const len = text?.length ?? 0;
  const over = len > max;
  return (
    <span className={`text-xs font-mono ${over ? "text-red-400" : len > max * 0.85 ? "text-amber-400" : "text-slate-500"}`}>
      {len}/{max}
    </span>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
      className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors text-slate-400 hover:text-white"
    >
      {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
    </button>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function AdCampaignSection() {
  const { requestGeneration } = useGenerationGate();

  // Inputs
  const [platform, setPlatform]       = useState<Platform>("google");
  const [businessName, setBusinessName] = useState("");
  const [product, setProduct]         = useState("");
  const [audience, setAudience]       = useState("");
  const [goal, setGoal]               = useState("sales");
  const [tone, setTone]               = useState("professional");
  const [budget, setBudget]           = useState(BUDGETS[1]);
  const [usp, setUsp]                 = useState("");
  const [competitors, setCompetitors] = useState("");
  const [landingUrl, setLandingUrl]   = useState("");

  // State
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<AdResult | null>(null);
  const [error, setError]       = useState("");
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  async function generate() {
    if (!businessName.trim() || !product.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`${BASE_URL}ai/ad-campaign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, businessName, product, audience, goal, tone, budget, usp, competitors, landingUrl }),
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

  const canGenerate = businessName.trim().length > 0 && product.trim().length > 0;

  // ── Render Google Ad ──────────────────────────────────────────────────────

  function renderGoogle(ad: GoogleAd) {
    return (
      <div className="space-y-4">
        {/* Search Preview */}
        <div className="bg-white rounded-xl p-5 text-left shadow-lg">
          <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center"><span className="text-white text-[8px] font-bold">G</span></div>
            Sponsored
          </div>
          <div className="text-emerald-700 text-xs mb-0.5 font-medium">{landingUrl || "www.yourwebsite.com"} › {ad.displayPath}</div>
          <div className="text-blue-700 text-lg font-medium leading-snug mb-1 hover:underline cursor-pointer">
            {[ad.headline1, ad.headline2, ad.headline3].filter(Boolean).join(" | ")}
          </div>
          <div className="text-slate-600 text-sm leading-relaxed">
            {[ad.description1, ad.description2].filter(Boolean).join(" ")}
          </div>
          {ad.calloutExtensions?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-blue-700 text-xs">
              {ad.calloutExtensions.map((c, i) => <span key={i}>· {c}</span>)}
            </div>
          )}
        </div>

        {/* Fields */}
        <div className="grid grid-cols-1 gap-3">
          {[
            { label: "Headline 1", value: ad.headline1, max: 30 },
            { label: "Headline 2", value: ad.headline2, max: 30 },
            { label: "Headline 3", value: ad.headline3, max: 30 },
            { label: "Description 1", value: ad.description1, max: 90 },
            { label: "Description 2", value: ad.description2, max: 90 },
          ].map(f => (
            <div key={f.label} className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-400 font-medium">{f.label}</span>
                <div className="flex items-center gap-2">{charBadge(f.value, f.max)}<CopyBtn text={f.value} /></div>
              </div>
              <p className="text-white text-sm leading-relaxed">{f.value}</p>
            </div>
          ))}
        </div>

        {/* Sitelinks */}
        {ad.sitelinks?.length > 0 && (
          <div>
            <p className="text-slate-400 text-xs font-medium mb-2 uppercase tracking-wider">Sitelink Extensions</p>
            <div className="grid grid-cols-2 gap-2">
              {ad.sitelinks.map((s, i) => (
                <div key={i} className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
                  <p className="text-blue-400 text-sm font-medium">{s.title}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Render Facebook Ad ────────────────────────────────────────────────────

  function renderFacebook(ad: FacebookAd) {
    return (
      <div className="space-y-4">
        {/* Facebook Preview */}
        <div className="bg-white rounded-xl overflow-hidden shadow-lg max-w-sm mx-auto text-left">
          <div className="p-3 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">{businessName[0]?.toUpperCase() || "B"}</span>
            </div>
            <div>
              <p className="text-slate-900 text-sm font-semibold">{businessName}</p>
              <p className="text-slate-400 text-xs">Sponsored · 🌐</p>
            </div>
          </div>
          <p className="px-3 pb-3 text-slate-700 text-sm leading-relaxed">{ad.primaryText}</p>
          <div className="h-32 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
            <span className="text-slate-400 text-xs">Ad Image (1200×628)</span>
          </div>
          <div className="p-3 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-slate-800 text-sm font-bold">{ad.headline}</p>
              <p className="text-slate-400 text-xs">{ad.description}</p>
            </div>
            <div className="bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-md whitespace-nowrap">{ad.cta}</div>
          </div>
        </div>

        {/* Copy fields */}
        <div className="space-y-3">
          {[
            { label: "Primary Text", value: ad.primaryText, max: 125 },
            { label: "Headline", value: ad.headline, max: 40 },
            { label: "Description", value: ad.description, max: 30 },
            { label: "CTA Button", value: ad.cta, max: 20 },
            { label: "Image Caption Idea", value: ad.imageCaption, max: 200 },
          ].map(f => (
            <div key={f.label} className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-400 font-medium">{f.label}</span>
                <div className="flex items-center gap-2">{charBadge(f.value, f.max)}<CopyBtn text={f.value} /></div>
              </div>
              <p className="text-white text-sm leading-relaxed">{f.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <p className="text-blue-300 text-xs font-semibold mb-1 uppercase tracking-wider">💡 Audience Insight</p>
          <p className="text-slate-300 text-sm">{ad.audienceInsight}</p>
          <p className="text-blue-300 text-xs font-semibold mt-3 mb-1 uppercase tracking-wider">📍 Placement Tips</p>
          <p className="text-slate-300 text-sm">{ad.placementTips}</p>
        </div>
      </div>
    );
  }

  // ── Render Instagram Ad ──────────────────────────────────────────────────

  function renderInstagram(ad: InstagramAd) {
    return (
      <div className="space-y-4">
        {/* Instagram Post Preview */}
        <div className="bg-white rounded-xl overflow-hidden shadow-lg max-w-sm mx-auto text-left">
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">{businessName[0]?.toUpperCase() || "B"}</span>
              </div>
              <div>
                <p className="text-slate-900 text-xs font-semibold">{businessName.toLowerCase().replace(/\s/g, "")}</p>
                <p className="text-slate-400 text-[10px]">Sponsored</p>
              </div>
            </div>
            <span className="text-slate-400 text-lg">···</span>
          </div>
          <div className="aspect-square bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
            <span className="text-slate-400 text-xs">Ad Image (1080×1080)</span>
          </div>
          <div className="p-3">
            <p className="text-pink-600 text-xs font-semibold mb-1">{ad.ctaSticker} →</p>
            <p className="text-slate-700 text-xs leading-relaxed line-clamp-3">{ad.caption}</p>
            <p className="text-blue-500 text-xs mt-1 line-clamp-2">{ad.hashtags?.slice(0, 8).map(h => `#${h.replace(/^#/, "")}`).join(" ")}</p>
          </div>
        </div>

        {/* Caption */}
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Feed Caption</span>
            <CopyBtn text={ad.caption} />
          </div>
          <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{ad.caption}</p>
        </div>

        {/* Hashtags */}
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400 font-medium">Hashtags ({ad.hashtags?.length})</span>
            <CopyBtn text={ad.hashtags?.map(h => `#${h.replace(/^#/, "")}`).join(" ") || ""} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ad.hashtags?.map((h, i) => (
              <span key={i} className="bg-pink-500/15 text-pink-300 border border-pink-500/25 px-2.5 py-0.5 rounded-full text-xs">
                #{h.replace(/^#/, "")}
              </span>
            ))}
          </div>
        </div>

        {/* Story variants */}
        <div>
          <p className="text-slate-400 text-xs font-medium mb-2 uppercase tracking-wider">Story Variants</p>
          <div className="space-y-2">
            {ad.storyCopy?.map((s, i) => (
              <div key={i} className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 flex items-start justify-between gap-3">
                <p className="text-white text-sm">{s}</p>
                <CopyBtn text={s} />
              </div>
            ))}
          </div>
        </div>

        {/* Reel hook */}
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
          <p className="text-purple-300 text-xs font-semibold mb-1 uppercase tracking-wider">🎬 Reel Hook (First 3 seconds)</p>
          <p className="text-white text-sm">{ad.reelHook}</p>
        </div>

        <div className="bg-pink-500/10 border border-pink-500/30 rounded-xl p-3">
          <p className="text-pink-300 text-xs font-semibold mb-1">🎯 Audience Note</p>
          <p className="text-slate-300 text-sm">{ad.audienceNote}</p>
        </div>
      </div>
    );
  }

  // ── Layout ────────────────────────────────────────────────────────────────

  return (
    <section id="ad-campaigns" className="py-20 px-4 bg-gradient-to-b from-[#0d0d1f] to-[#0a0a1a]">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 rounded-full px-4 py-1.5 mb-4">
            <Megaphone size={14} className="text-amber-400" />
            <span className="text-amber-300 text-sm font-medium">AI Ad Campaign Generator</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Launch High-Converting <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Ad Campaigns</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Generate complete Google, Facebook & Instagram ad copy with AI — headlines, descriptions, hashtags, and targeting tips.
          </p>
        </div>

        <div className="grid lg:grid-cols-[400px,1fr] gap-8">

          {/* ── Left: Form ─────────────────────────────────────────────── */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5 h-fit">

            {/* Platform Selector */}
            <div>
              <label className="text-slate-300 text-sm font-semibold mb-3 block flex items-center gap-2">
                <Target size={14} className="text-amber-400" /> Ad Platform
              </label>
              <div className="space-y-2">
                {PLATFORMS.map(p => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.id}
                      onClick={() => { setPlatform(p.id); setResult(null); }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        platform === p.id
                          ? `bg-gradient-to-r ${p.color} ${p.border} border text-white shadow-lg`
                          : "border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-500"
                      }`}
                    >
                      <Icon size={18} />
                      <div>
                        <p className="font-semibold text-sm">{p.label}</p>
                        <p className="text-xs opacity-75">{p.emoji} AI-generated copy & strategy</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Business & Product */}
            <div>
              <label className="text-slate-300 text-sm font-medium mb-1.5 block">Business / Brand Name *</label>
              <input
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                placeholder="e.g. Luna Skincare"
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-slate-300 text-sm font-medium mb-1.5 block">Product / Service *</label>
              <textarea
                rows={2}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors text-sm resize-none"
                placeholder="e.g. Anti-aging vitamin C serum for women 30+"
                value={product}
                onChange={e => setProduct(e.target.value)}
              />
            </div>

            <div>
              <label className="text-slate-300 text-sm font-medium mb-1.5 block">Unique Selling Point</label>
              <input
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                placeholder="e.g. Dermatologist tested, no parabens, 30-day guarantee"
                value={usp}
                onChange={e => setUsp(e.target.value)}
              />
            </div>

            {/* Target Audience */}
            <div>
              <label className="text-slate-300 text-sm font-medium mb-1.5 block flex items-center gap-1.5"><Users size={13} /> Target Audience</label>
              <input
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                placeholder="e.g. Women 25-45, interested in skincare"
                value={audience}
                onChange={e => setAudience(e.target.value)}
              />
            </div>

            {/* Landing URL */}
            {platform === "google" && (
              <div>
                <label className="text-slate-300 text-sm font-medium mb-1.5 block flex items-center gap-1.5"><Globe size={13} /> Landing Page URL</label>
                <input
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                  placeholder="https://yoursite.com/product"
                  value={landingUrl}
                  onChange={e => setLandingUrl(e.target.value)}
                />
              </div>
            )}

            {/* Campaign Goal */}
            <div>
              <label className="text-slate-300 text-sm font-medium mb-2 block flex items-center gap-1.5"><BarChart2 size={13} /> Campaign Goal</label>
              <div className="grid grid-cols-2 gap-1.5">
                {AD_GOALS.map(g => (
                  <button
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    className={`flex items-center gap-1.5 p-2 rounded-lg border text-xs transition-all ${
                      goal === g.id ? "border-amber-500 bg-amber-500/15 text-amber-300" : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    <span>{g.emoji}</span>{g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tone */}
            <div>
              <label className="text-slate-300 text-sm font-medium mb-2 block">Ad Tone</label>
              <div className="grid grid-cols-2 gap-1.5">
                {TONES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    className={`p-2 rounded-lg border text-xs transition-all ${
                      tone === t.id ? "border-amber-500 bg-amber-500/15 text-amber-300" : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div>
              <label className="text-slate-300 text-sm font-medium mb-2 block flex items-center gap-1.5"><DollarSign size={13} /> Monthly Budget</label>
              <div className="grid grid-cols-2 gap-1.5">
                {BUDGETS.map(b => (
                  <button
                    key={b}
                    onClick={() => setBudget(b)}
                    className={`p-2 rounded-lg border text-xs transition-all ${
                      budget === b ? "border-amber-500 bg-amber-500/15 text-amber-300" : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={() => requestGeneration(generate)}
              disabled={!canGenerate || loading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold py-3 rounded-xl shadow-lg shadow-amber-500/25 disabled:opacity-40"
            >
              {loading ? <><Loader2 size={16} className="animate-spin mr-2" /> Generating...</> : <><Sparkles size={16} className="mr-2" /> Generate {PLATFORMS.find(p => p.id === platform)?.label} Copy</>}
            </Button>
          </div>

          {/* ── Right: Output ───────────────────────────────────────────── */}
          <div>
            <AnimatePresence mode="wait">
              {!result && !loading && !error && (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="h-full min-h-[400px] flex flex-col items-center justify-center text-center bg-slate-900/30 border border-dashed border-slate-700 rounded-2xl p-10">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
                    <Megaphone size={28} className="text-amber-400" />
                  </div>
                  <p className="text-white font-semibold text-lg mb-2">Ready to Create Your Ad</p>
                  <p className="text-slate-400 text-sm max-w-xs">Fill in your business details and click Generate to get complete {PLATFORMS.find(p => p.id === platform)?.label} copy in seconds.</p>
                  <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                    {[
                      { icon: "🎯", label: "Targeted Copy" },
                      { icon: "📊", label: "Ad Previews" },
                      { icon: "💡", label: "Strategy Tips" },
                    ].map(f => (
                      <div key={f.label} className="bg-slate-800/50 rounded-xl p-3">
                        <div className="text-2xl mb-1">{f.icon}</div>
                        <p className="text-slate-400 text-xs">{f.label}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {loading && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-900/30 border border-dashed border-slate-700 rounded-2xl p-10">
                  <Loader2 size={40} className="animate-spin text-amber-400 mb-4" />
                  <p className="text-white font-semibold mb-1">Crafting Your Ad Campaign</p>
                  <p className="text-slate-400 text-sm">Analyzing your product & creating high-converting copy…</p>
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
                <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                  {/* Header bar */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${PLATFORMS.find(p => p.id === platform)?.color}`} />
                      <span className="text-white font-semibold">{PLATFORMS.find(p => p.id === platform)?.label} Campaign</span>
                      <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs px-2 py-0.5 rounded-full">Ready</span>
                    </div>
                    <button onClick={() => requestGeneration(generate)} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 transition-colors">
                      <RefreshCw size={12} /> Regenerate
                    </button>
                  </div>

                  {platform === "google"    && result.google    && renderGoogle(result.google)}
                  {platform === "facebook"  && result.facebook  && renderFacebook(result.facebook)}
                  {platform === "instagram" && result.instagram && renderInstagram(result.instagram)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
