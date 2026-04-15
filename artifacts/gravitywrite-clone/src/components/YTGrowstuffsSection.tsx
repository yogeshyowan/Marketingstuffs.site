import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, GrowthStep } from "@/context/UserContext";
import { useGenerationGate } from "@/components/GenerationGate";
import {
  Zap, Bot, Loader2, Copy, Check, Sparkles, AlertCircle,
  Send, ArrowRight, ChevronRight, Map, BarChart2, Layers,
  Smartphone, Globe, BookOpen, DollarSign, RefreshCw,
  CheckCircle2, Circle, ExternalLink, TrendingUp, Gift,
  Youtube, Star, Play, LayoutDashboard, Megaphone, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "") + "/__api/";

// ── Site tools registry ───────────────────────────────────────────────────────

export const SITE_TOOLS: Record<string, { name: string; anchor: string; icon: string; color: string }> = {
  blog:     { name: "Blog Writer",         anchor: "#blog-writer",          icon: "✍️",  color: "bg-violet-500/20 text-violet-300 border-violet-500/30" },
  website:  { name: "Website Builder",     anchor: "#website-developer",    icon: "🌐",  color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  writing:  { name: "Writing Tools",       anchor: "#writing-tools",        icon: "📝",  color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
  social:   { name: "Social Media",        anchor: "#social-media-section", icon: "📱",  color: "bg-pink-500/20 text-pink-300 border-pink-500/30" },
  ads:      { name: "Ad Campaigns",        anchor: "#ad-campaigns",         icon: "🎯",  color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  email:    { name: "Email Marketing",     anchor: "#email-marketing",      icon: "📧",  color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  sms:      { name: "SMS Marketing",       anchor: "#sms-marketing",        icon: "💬",  color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  image:    { name: "AI Image Studio",     anchor: "#ai-image",             icon: "✨",  color: "bg-teal-500/20 text-teal-300 border-teal-500/30" },
  video:    { name: "AI Video Studio",     anchor: "#ai-video",             icon: "🎬",  color: "bg-red-500/20 text-red-300 border-red-500/30" },
  voice:    { name: "AI Voice Studio",     anchor: "#ai-voice",             icon: "🎙️", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
  aitools:  { name: "AI Tools Hub",        anchor: "#ai-tools",             icon: "🤖",  color: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
  pricing:  { name: "Pricing",             anchor: "#pricing",              icon: "💎",  color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
};

function scrollToTool(anchor: string) {
  const el = document.querySelector(anchor);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

function ToolBtn({ name, anchor, reason }: { name: string; anchor: string; reason?: string }) {
  const entry = Object.values(SITE_TOOLS).find(t => t.anchor === anchor);
  const colorClass = entry?.color ?? "bg-slate-700 text-slate-300 border-slate-600";
  return (
    <button onClick={() => scrollToTool(anchor)} title={reason}
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all hover:scale-105 ${colorClass}`}>
      {entry?.icon} {name} <ExternalLink size={9} />
    </button>
  );
}

function PhaseTag({ phase }: { phase: string }) {
  const colors: Record<string, string> = {
    Foundation: "bg-blue-500/20 text-blue-300",
    Audience:   "bg-orange-500/20 text-orange-300",
    Capture:    "bg-purple-500/20 text-purple-300",
    Sell:       "bg-emerald-500/20 text-emerald-300",
    Advertise:  "bg-red-500/20 text-red-300",
    Scale:      "bg-amber-500/20 text-amber-300",
  };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${colors[phase] ?? "bg-slate-700 text-slate-400"}`}>{phase}</span>;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
      className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-white transition-colors shrink-0">
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
    </button>
  );
}

function ErrorBox({ msg, onRetry }: { msg: string; onRetry: () => void }) {
  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 flex items-start gap-3">
      <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
      <div>
        <p className="text-red-300 font-semibold text-sm">Generation Failed</p>
        <p className="text-red-400/70 text-xs mt-1 break-words">{msg}</p>
        <button onClick={onRetry} className="mt-2 text-xs text-red-300 hover:text-white flex items-center gap-1"><RefreshCw size={11} />Try again</button>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc }: { icon: React.FC<any>; title: string; desc: string }) {
  return (
    <div className="min-h-52 flex flex-col items-center justify-center text-center bg-slate-900/30 border border-dashed border-slate-700 rounded-2xl p-8">
      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3"><Icon size={22} className="text-emerald-400" /></div>
      <p className="text-white font-semibold text-sm mb-1">{title}</p>
      <p className="text-slate-400 text-xs max-w-xs">{desc}</p>
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="min-h-52 flex flex-col items-center justify-center text-center bg-slate-900/30 border border-dashed border-slate-700 rounded-2xl p-8">
      <Loader2 size={32} className="animate-spin text-emerald-400 mb-3" />
      <p className="text-white font-medium text-sm">{label}</p>
    </div>
  );
}

async function callAPI(endpoint: string, body: object, signal: AbortSignal) {
  const res = await fetch(`${BASE_URL}ai/${endpoint}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body), signal,
  });
  if (!res.ok) throw new Error(await res.text() || res.statusText);
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 0: MY GROWTH PLAN (Personalized, suggestion-based)
// ═══════════════════════════════════════════════════════════════════════════

function GrowthPlanTab({ onStartOnboarding }: { onStartOnboarding: () => void }) {
  const { profile, updateStepDone } = useUser();
  const plan = profile.growthPlan;
  const steps = plan?.steps ?? [];
  const doneCount = steps.filter(s => s.done).length;
  const pct = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;

  if (!profile.onboardingComplete) {
    return (
      <div className="min-h-[420px] flex flex-col items-center justify-center text-center p-8">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center">
            <Sparkles size={32} className="text-white" />
          </div>
        </div>
        <h3 className="text-2xl font-extrabold text-white mb-2">Build Your Personal Growth Plan</h3>
        <p className="text-slate-400 text-sm max-w-md mb-6">
          Answer 3 quick questions about your business and get a custom, step-by-step digital marketing roadmap — with every tool linked and ready to use.
        </p>
        <button onClick={onStartOnboarding}
          className="px-8 py-3.5 rounded-xl font-bold text-white text-base flex items-center gap-2 mx-auto shadow-lg hover:scale-105 transition-transform"
          style={{ background: "linear-gradient(135deg,#10b981,#3b82f6)" }}>
          <Zap size={18} />Create My Growth Plan — Free
        </button>
        <p className="text-slate-600 text-xs mt-3">Takes 60 seconds • No credit card needed</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-white font-bold text-base">Hey {profile.name || "there"}! 👋</p>
            <p className="text-slate-300 text-sm mt-0.5">{plan?.greeting || `Your personalized ${profile.businessLabel} growth plan is ready.`}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full font-semibold">{profile.businessLabel}</span>
              <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded-full">{profile.goal}</span>
            </div>
          </div>
          <button onClick={onStartOnboarding} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 shrink-0 transition-colors">
            <RefreshCw size={11} />Redo Setup
          </button>
        </div>
        {/* Progress */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-slate-400 text-xs">Progress</span>
            <span className="text-white font-bold text-sm">{doneCount}/{steps.length} steps • {pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-blue-500"
              initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} />
          </div>
        </div>
      </div>

      {/* Quick Win + Warning */}
      {(plan?.quickWin || plan?.warningSign) && (
        <div className="grid sm:grid-cols-2 gap-3">
          {plan.quickWin && (
            <div className="bg-emerald-500/8 border border-emerald-500/25 rounded-xl p-3.5">
              <p className="text-emerald-400 text-xs font-bold mb-1">⚡ 30-Minute Quick Win</p>
              <p className="text-slate-300 text-xs">{plan.quickWin}</p>
            </div>
          )}
          {plan.warningSign && (
            <div className="bg-amber-500/8 border border-amber-500/25 rounded-xl p-3.5">
              <p className="text-amber-400 text-xs font-bold mb-1">⚠️ Biggest Mistake to Avoid</p>
              <p className="text-slate-300 text-xs">{plan.warningSign}</p>
            </div>
          )}
        </div>
      )}

      {/* Business summary */}
      {plan?.businessSummary && (
        <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-3.5">
          <p className="text-slate-400 text-xs">🎯 <strong className="text-white">Your 12-month vision:</strong> {plan.businessSummary}</p>
        </div>
      )}

      {/* Steps */}
      <div className="space-y-2.5">
        {steps.map((step: GrowthStep) => (
          <div key={step.step}
            className={`bg-slate-900/60 border rounded-xl p-4 transition-all ${step.done ? "border-emerald-500/25 opacity-70" : "border-slate-700/60 hover:border-slate-600"}`}>
            <div className="flex items-start gap-3">
              <button onClick={() => updateStepDone(step.step, !step.done)} className="shrink-0 mt-0.5 hover:scale-110 transition-transform">
                {step.done ? <CheckCircle2 size={20} className="text-emerald-400" /> : <Circle size={20} className="text-slate-600 hover:text-emerald-400 transition-colors" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-slate-500 text-xs font-mono">#{step.step}</span>
                  <PhaseTag phase={step.phase} />
                  <p className={`text-sm font-bold ${step.done ? "line-through text-slate-500" : "text-white"}`}>{step.title}</p>
                </div>
                {!step.done && (
                  <>
                    <p className="text-slate-400 text-xs mb-2">{step.description}</p>
                    {step.action && (
                      <div className="bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 mb-2">
                        <p className="text-emerald-400 text-[10px] font-bold mb-0.5">NEXT ACTION</p>
                        <p className="text-slate-200 text-xs">{step.action}</p>
                      </div>
                    )}
                    {step.tools?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-1">
                        {step.tools.map((t, i) => (
                          <ToolBtn key={i} name={t.name} anchor={t.anchor} reason={t.reason} />
                        ))}
                      </div>
                    )}
                  </>
                )}
                <div className="flex items-center gap-3 mt-1.5">
                  {step.timeline && <span className="text-slate-600 text-[10px]">⏱ {step.timeline}</span>}
                  {step.metric && <span className="text-slate-600 text-[10px]">✓ {step.metric}</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 1: CHANNEL ANALYZER
// ═══════════════════════════════════════════════════════════════════════════

function AnalyzerTab() {
  const { requestGeneration } = useGenerationGate();
  const [niche, setNiche] = useState(""); const [channelName, setChannelName] = useState("");
  const [videoTitle, setVideoTitle] = useState(""); const [views, setViews] = useState("");
  const [ctr, setCtr] = useState(""); const [watchTime, setWatchTime] = useState("");
  const [likes, setLikes] = useState(""); const [comments, setComments] = useState("");
  const [subscribers, setSubscribers] = useState("");
  const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const [result, setResult] = useState<any>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function analyze() {
    if (!niche.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController(); abortRef.current = ctrl;
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await callAPI("yt-channel-analyzer", { channelName, niche, videoTitle, views, ctr, watchTime, likes, comments, subscribers }, ctrl.signal);
      setResult(data);
    } catch (e: any) { if (e.name !== "AbortError") setError(e.message); }
    finally { setLoading(false); }
  }

  const SEVERITY_COLOR: Record<string, string> = { Critical: "text-red-400 bg-red-500/10 border-red-500/30", High: "text-orange-400 bg-orange-500/10 border-orange-500/30", Medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30", Low: "text-slate-400 bg-slate-500/10 border-slate-500/30" };

  return (
    <div className="grid lg:grid-cols-[300px,1fr] gap-6">
      <div className="space-y-3">
        <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-3">
          <p className="text-blue-300 text-xs font-semibold mb-1">📊 Performance Analyzer</p>
          <p className="text-slate-400 text-xs">Input your metrics and get a diagnosis of what's working, what's broken, and which Marketingstuffs tools to use for each fix.</p>
        </div>
        {[
          { label: "Your Niche *", val: niche, set: setNiche, ph: "e.g. Personal Finance, Fitness, Tech Reviews" },
          { label: "Channel Name", val: channelName, set: setChannelName, ph: "e.g. FinanceWithPriya" },
          { label: "Video Title (optional)", val: videoTitle, set: setVideoTitle, ph: "Paste your video title" },
        ].map(f => (
          <div key={f.label}>
            <label className="text-slate-300 text-xs font-medium mb-1 block">{f.label}</label>
            <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
              placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)} />
          </div>
        ))}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Views", val: views, set: setViews, ph: "e.g. 1200" },
            { label: "CTR %", val: ctr, set: setCtr, ph: "e.g. 4.2" },
            { label: "Watch Time %", val: watchTime, set: setWatchTime, ph: "e.g. 45" },
            { label: "Likes", val: likes, set: setLikes, ph: "e.g. 80" },
            { label: "Comments", val: comments, set: setComments, ph: "e.g. 12" },
            { label: "New Subs", val: subscribers, set: setSubscribers, ph: "e.g. 25" },
          ].map(f => (
            <div key={f.label}>
              <label className="text-slate-400 text-[10px] font-medium mb-1 block">{f.label}</label>
              <input className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs"
                placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)} />
            </div>
          ))}
        </div>
        <Button onClick={() => requestGeneration(analyze)} disabled={!niche.trim() || loading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl disabled:opacity-40">
          {loading ? <><Loader2 size={14} className="animate-spin mr-2" />Analyzing…</> : <><BarChart2 size={14} className="mr-2" />Diagnose My Channel</>}
        </Button>
      </div>
      <div>
        {!result && !loading && !error && <EmptyState icon={BarChart2} title="Channel Diagnosis + Tool Fixes" desc="Paste your metrics and get a specific diagnosis of every problem — with the exact Marketingstuffs tool to fix each one" />}
        {loading && <LoadingState label="Analyzing your channel metrics and mapping tool fixes…" />}
        {error && <ErrorBox msg={error} onRetry={() => requestGeneration(analyze)} />}
        {result && (
          <div className="space-y-4">
            <div className={`rounded-2xl p-4 border ${result.healthScore >= 70 ? "bg-emerald-500/8 border-emerald-500/20" : result.healthScore >= 40 ? "bg-amber-500/8 border-amber-500/20" : "bg-red-500/8 border-red-500/20"}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-white font-bold">{result.overallHealth}</p>
                <div className="text-right">
                  <p className={`text-2xl font-extrabold ${result.healthScore >= 70 ? "text-emerald-400" : result.healthScore >= 40 ? "text-amber-400" : "text-red-400"}`}>{result.healthScore}/100</p>
                </div>
              </div>
              <p className="text-slate-300 text-xs">{result.summary}</p>
              {result.strengths?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {result.strengths.map((s: string, i: number) => <span key={i} className="text-[10px] bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-full">✓ {s}</span>)}
                </div>
              )}
            </div>
            {result.topPriority && (
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3.5">
                <p className="text-white text-xs font-bold mb-1">🎯 Top Priority Right Now</p>
                <p className="text-slate-300 text-xs">{result.topPriority}</p>
              </div>
            )}
            <div className="space-y-3">
              {(result.issues || []).map((issue: any, i: number) => (
                <div key={i} className={`border rounded-xl p-3.5 ${SEVERITY_COLOR[issue.severity] || "bg-slate-800/50 border-slate-700 text-slate-400"}`}>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${SEVERITY_COLOR[issue.severity]}`}>{issue.severity}</span>
                    <p className="text-white font-semibold text-sm">{issue.area}</p>
                  </div>
                  <p className="text-slate-300 text-xs mb-2">{issue.diagnosis}</p>
                  {issue.fix && <p className="text-slate-200 text-xs mb-2.5 bg-slate-800/50 rounded-lg px-3 py-2">🔧 {issue.fix}</p>}
                  {issue.tools?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {issue.tools.map((t: any, j: number) => <ToolBtn key={j} name={t.name} anchor={t.anchor} reason={t.reason} />)}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {result.adReadiness && (
              <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-3.5">
                <p className="text-amber-400 text-xs font-bold mb-1">📢 Ad Readiness</p>
                <p className="text-slate-300 text-xs">{result.adReadiness}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 2: CONTENT MACHINE (Full-Funnel, All Tools)
// ═══════════════════════════════════════════════════════════════════════════

function ContentMachineTab() {
  const { requestGeneration } = useGenerationGate();
  const [niche, setNiche] = useState(""); const [product, setProduct] = useState("");
  const [audience, setAudience] = useState(""); const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const [result, setResult] = useState<any>(null);
  const [view, setView] = useState<"youtube"|"blog"|"social"|"email"|"sms"|"ads">("youtube");
  const abortRef = useRef<AbortController | null>(null);

  async function generate() {
    if (!niche.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController(); abortRef.current = ctrl;
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await callAPI("yt-content-machine", { niche, product, audience, goal }, ctrl.signal);
      setResult(data);
    } catch (e: any) { if (e.name !== "AbortError") setError(e.message); }
    finally { setLoading(false); }
  }

  const CHANNELS = [
    { id: "youtube", label: "YouTube",  emoji: "▶️", toolKey: "video" },
    { id: "blog",    label: "Blog",     emoji: "✍️",  toolKey: "blog" },
    { id: "social",  label: "Social",   emoji: "📱",  toolKey: "social" },
    { id: "email",   label: "Email",    emoji: "📧",  toolKey: "email" },
    { id: "sms",     label: "SMS",      emoji: "💬",  toolKey: "sms" },
    { id: "ads",     label: "Ads",      emoji: "🎯",  toolKey: "ads" },
  ] as const;

  function renderChannel() {
    if (!result) return null;
    const ch = result[view];
    if (!ch) return null;
    const toolDef = ch.toolLink ? SITE_TOOLS[Object.keys(SITE_TOOLS).find(k => SITE_TOOLS[k].anchor === ch.toolLink.anchor) ?? ""] : null;
    const toolBtn = ch.toolLink ? <ToolBtn name={ch.toolLink.name} anchor={ch.toolLink.anchor} /> : null;

    if (view === "youtube") return (
      <div className="space-y-3">
        {toolBtn && <div className="flex justify-end">{toolBtn}</div>}
        {(ch.videos || []).map((v: any, i: number) => (
          <div key={i} className="bg-slate-800/60 border border-slate-700 rounded-xl p-3.5">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full">{v.type}</span>
              <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{v.purpose}</span>
            </div>
            <div className="flex justify-between gap-2">
              <p className="text-white font-semibold text-sm">{v.title}</p>
              <CopyBtn text={v.title} />
            </div>
            {v.hook && <p className="text-slate-400 text-xs mt-1 italic">Hook: "{v.hook}"</p>}
            {v.cta && <p className="text-emerald-400 text-xs mt-1">CTA: {v.cta}</p>}
          </div>
        ))}
      </div>
    );
    if (view === "blog") return (
      <div className="space-y-3">
        {toolBtn && <div className="flex justify-end">{toolBtn}</div>}
        {(ch.posts || []).map((p: any, i: number) => (
          <div key={i} className="bg-slate-800/60 border border-slate-700 rounded-xl p-3.5">
            <div className="flex justify-between gap-2 mb-1">
              <p className="text-white font-semibold text-sm">{p.title}</p>
              <CopyBtn text={p.title} />
            </div>
            {p.keyword && <p className="text-violet-400 text-xs">🔑 Keyword: {p.keyword}</p>}
            {p.purpose && <p className="text-slate-400 text-xs">{p.purpose}</p>}
            {p.outline?.length > 0 && (
              <ul className="mt-2 space-y-0.5">{p.outline.map((o: string, j: number) => <li key={j} className="text-slate-400 text-xs flex items-start gap-1.5"><span className="text-violet-400">→</span>{o}</li>)}</ul>
            )}
          </div>
        ))}
      </div>
    );
    if (view === "social") return (
      <div className="space-y-3">
        {toolBtn && <div className="flex justify-end">{toolBtn}</div>}
        {ch.instagramThemes?.length > 0 && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3.5">
            <p className="text-pink-300 text-xs font-semibold mb-2">📸 Instagram Content Themes</p>
            {ch.instagramThemes.map((t: string, i: number) => <p key={i} className="text-slate-300 text-xs flex items-start gap-1.5 mb-1"><span className="text-pink-400">→</span>{t}</p>)}
          </div>
        )}
        {ch.linkedinAngle && <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3.5"><p className="text-blue-300 text-xs font-semibold mb-1">💼 LinkedIn Angle</p><p className="text-slate-300 text-xs">{ch.linkedinAngle}</p></div>}
        {ch.twitterSeries && <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3.5"><p className="text-sky-300 text-xs font-semibold mb-1">🐦 Twitter/X Series</p><p className="text-slate-300 text-xs">{ch.twitterSeries}</p></div>}
      </div>
    );
    if (view === "email") return (
      <div className="space-y-3">
        {toolBtn && <div className="flex justify-end">{toolBtn}</div>}
        {(ch.sequences || []).map((s: any, i: number) => (
          <div key={i} className="bg-slate-800/60 border border-slate-700 rounded-xl p-3.5">
            <p className="text-emerald-300 text-sm font-semibold">{s.name}</p>
            <div className="flex gap-3 mt-1 flex-wrap">
              <span className="text-[10px] text-slate-400">Trigger: {s.trigger}</span>
              <span className="text-[10px] text-slate-400">{s.emails} emails</span>
            </div>
            <p className="text-slate-400 text-xs mt-1">{s.goal}</p>
          </div>
        ))}
      </div>
    );
    if (view === "sms") return (
      <div className="space-y-3">
        {toolBtn && <div className="flex justify-end">{toolBtn}</div>}
        {(ch.campaigns || []).map((c: any, i: number) => (
          <div key={i} className="bg-slate-800/60 border border-slate-700 rounded-xl p-3.5">
            <p className="text-purple-300 text-sm font-semibold">{c.type}</p>
            <p className="text-slate-400 text-xs">{c.timing}</p>
            <p className="text-slate-300 text-xs mt-1">{c.goal}</p>
          </div>
        ))}
      </div>
    );
    if (view === "ads") return (
      <div className="space-y-3">
        {toolBtn && <div className="flex justify-end">{toolBtn}</div>}
        {[
          { label: "🔍 Google Search Ads", val: ch.googleConcept },
          { label: "📘 Facebook/Instagram Ads", val: ch.facebookConcept },
          { label: "▶️ YouTube Video Ads", val: ch.youtubeConcept },
        ].map(ad => ad.val ? (
          <div key={ad.label} className="bg-slate-800/60 border border-slate-700 rounded-xl p-3.5 flex justify-between gap-2">
            <div><p className="text-amber-300 text-xs font-semibold mb-1">{ad.label}</p><p className="text-slate-300 text-xs">{ad.val}</p></div>
            <CopyBtn text={ad.val} />
          </div>
        ) : null)}
      </div>
    );
    return null;
  }

  return (
    <div className="grid lg:grid-cols-[280px,1fr] gap-6">
      <div className="space-y-3">
        <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-3">
          <p className="text-emerald-300 text-xs font-semibold mb-1">🎬 Full-Funnel Content Machine</p>
          <p className="text-slate-400 text-xs">One input → a complete content strategy across YouTube, Blog, Social, Email, SMS, and Ads — each channel linked to the right Marketingstuffs tool.</p>
        </div>
        {[
          { label: "Your Niche *", val: niche, set: setNiche, ph: "e.g. Health & Fitness, SaaS, Fashion" },
          { label: "Product / Service", val: product, set: setProduct, ph: "e.g. Fitness app, Online course, Consulting" },
          { label: "Target Audience", val: audience, set: setAudience, ph: "e.g. Working professionals aged 25–35 in India" },
          { label: "Content Goal", val: goal, set: setGoal, ph: "e.g. Generate leads, Build brand, Drive sales" },
        ].map(f => (
          <div key={f.label}>
            <label className="text-slate-300 text-xs font-medium mb-1 block">{f.label}</label>
            <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
              placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)} />
          </div>
        ))}
        <Button onClick={() => requestGeneration(generate)} disabled={!niche.trim() || loading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl disabled:opacity-40">
          {loading ? <><Loader2 size={14} className="animate-spin mr-2" />Building…</> : <><Layers size={14} className="mr-2" />Generate Full Funnel</>}
        </Button>
      </div>
      <div>
        {!result && !loading && !error && <EmptyState icon={Layers} title="Complete Multi-Channel Content Plan" desc="Get YouTube videos, blog posts, social content, email sequences, SMS campaigns, and ad concepts — all linked to the right tools" />}
        {loading && <LoadingState label="Building your complete content machine across all channels…" />}
        {error && <ErrorBox msg={error} onRetry={() => requestGeneration(generate)} />}
        {result && (
          <div className="space-y-4">
            {result.funnelOverview && (
              <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-3.5">
                <p className="text-emerald-400 text-xs font-bold mb-1">🔄 Your Funnel</p>
                <p className="text-slate-300 text-xs">{result.funnelOverview}</p>
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              {CHANNELS.map(c => (
                <button key={c.id} onClick={() => setView(c.id as any)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${view === c.id ? "bg-emerald-500 border-emerald-400 text-white" : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"}`}>
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
            {renderChannel()}
            {result.conversionPath && (
              <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-3.5">
                <p className="text-white text-xs font-bold mb-1">🛣️ Customer Journey</p>
                <p className="text-slate-400 text-xs">{result.conversionPath}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 3: SHORTS PLANNER (Quick)
// ═══════════════════════════════════════════════════════════════════════════

function ShortsTab() {
  const { requestGeneration } = useGenerationGate();
  const [niche, setNiche] = useState(""); const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const [result, setResult] = useState<any>(null);
  const [week, setWeek] = useState<"week1"|"week2"|"week3"|"week4">("week1");
  const abortRef = useRef<AbortController | null>(null);

  async function generate() {
    if (!niche.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController(); abortRef.current = ctrl;
    setLoading(true); setError(""); setResult(null);
    try { setResult(await callAPI("yt-shorts-plan", { niche, goal }, ctrl.signal)); }
    catch (e: any) { if (e.name !== "AbortError") setError(e.message); }
    finally { setLoading(false); }
  }

  const weekData = result?.[week] || [];
  const WEEKS: { id: "week1"|"week2"|"week3"|"week4"; label: string }[] = [
    { id: "week1", label: "Week 1 — Basics" }, { id: "week2", label: "Week 2 — Build" },
    { id: "week3", label: "Week 3 — Proof" }, { id: "week4", label: "Week 4 — Sell" },
  ];

  return (
    <div className="grid lg:grid-cols-[260px,1fr] gap-6">
      <div className="space-y-3">
        <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-3">
          <p className="text-red-300 text-xs font-semibold mb-1">📱 Shorts-First Strategy</p>
          <p className="text-slate-400 text-xs">Start with the most basic concept in your niche. Post daily. Scale complexity each week. One idea per Short.</p>
          <div className="mt-2"><ToolBtn name="AI Video Studio" anchor="#ai-video" /></div>
        </div>
        <div>
          <label className="text-slate-300 text-xs font-medium mb-1 block">Niche *</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm"
            placeholder="e.g. Personal Finance, Fitness, Tech" value={niche} onChange={e => setNiche(e.target.value)} />
        </div>
        <div>
          <label className="text-slate-300 text-xs font-medium mb-1 block">30-Day Goal</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm"
            placeholder="e.g. 1k subscribers, product launch" value={goal} onChange={e => setGoal(e.target.value)} />
        </div>
        <Button onClick={() => requestGeneration(generate)} disabled={!niche.trim() || loading}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl disabled:opacity-40">
          {loading ? <><Loader2 size={14} className="animate-spin mr-2" />Building…</> : <><Smartphone size={14} className="mr-2" />Generate 30-Day Plan</>}
        </Button>
      </div>
      <div>
        {!result && !loading && !error && <EmptyState icon={Smartphone} title="30-Day Shorts Calendar" desc="Daily posting plan — starts simple and scales complexity each week" />}
        {loading && <LoadingState label="Building 30-day Shorts calendar…" />}
        {error && <ErrorBox msg={error} onRetry={() => requestGeneration(generate)} />}
        {result && (
          <div className="space-y-4">
            {result.strategy && <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-3"><p className="text-slate-300 text-xs">{result.strategy}</p></div>}
            <div className="flex gap-2 flex-wrap">
              {WEEKS.map(w => (
                <button key={w.id} onClick={() => setWeek(w.id)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${week === w.id ? "bg-red-500 border-red-400 text-white" : "bg-slate-800 border-slate-700 text-slate-400"}`}>
                  {w.label}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {weekData.map((item: any, i: number) => (
                <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold flex items-center justify-center shrink-0">{item.day}</span>
                      <p className="text-white text-sm font-semibold">{item.concept}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {item.duration && <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full shrink-0">{item.duration}</span>}
                      <CopyBtn text={`${item.concept}\nHook: ${item.hook}\n${item.cta}`} />
                    </div>
                  </div>
                  {item.hook && <p className="text-red-300 text-xs italic mt-1 ml-7">"{item.hook}"</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 4: WEBINAR FUNNEL
// ═══════════════════════════════════════════════════════════════════════════

function WebinarTab() {
  const { requestGeneration } = useGenerationGate();
  const [topic, setTopic] = useState(""); const [product, setProduct] = useState("");
  const [audience, setAudience] = useState(""); const [niche, setNiche] = useState("");
  const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const [result, setResult] = useState<any>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function generate() {
    if (!topic.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController(); abortRef.current = ctrl;
    setLoading(true); setError(""); setResult(null);
    try { setResult(await callAPI("yt-webinar", { topic, product, audience, niche }, ctrl.signal)); }
    catch (e: any) { if (e.name !== "AbortError") setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="grid lg:grid-cols-[270px,1fr] gap-6">
      <div className="space-y-3">
        <div className="bg-purple-500/8 border border-purple-500/20 rounded-xl p-3">
          <p className="text-purple-300 text-xs font-semibold mb-1">🎓 Webinar Growth System</p>
          <p className="text-slate-400 text-xs">Plan your webinar and get a complete promotion strategy using Email, SMS, Blog, Social, Ads — all linked to site tools.</p>
        </div>
        {[
          { label: "Webinar Topic *", val: topic, set: setTopic, ph: "e.g. How to Get 1000 YouTube Subscribers in 30 Days" },
          { label: "Product to Sell", val: product, set: setProduct, ph: "e.g. Online course, Coaching, SaaS tool" },
          { label: "Target Audience", val: audience, set: setAudience, ph: "e.g. Content creators, entrepreneurs" },
          { label: "Niche", val: niche, set: setNiche, ph: "e.g. Digital Marketing, Finance" },
        ].map(f => (
          <div key={f.label}>
            <label className="text-slate-300 text-xs font-medium mb-1 block">{f.label}</label>
            <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 text-sm"
              placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)} />
          </div>
        ))}
        <Button onClick={() => requestGeneration(generate)} disabled={!topic.trim() || loading}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl disabled:opacity-40">
          {loading ? <><Loader2 size={14} className="animate-spin mr-2" />Planning…</> : <><BookOpen size={14} className="mr-2" />Generate Webinar System</>}
        </Button>
      </div>
      <div>
        {!result && !loading && !error && <EmptyState icon={BookOpen} title="Complete Webinar Funnel" desc="Webinar plan + multi-channel promotion across all Marketingstuffs tools — from registration to sale" />}
        {loading && <LoadingState label="Planning your webinar funnel across all channels…" />}
        {error && <ErrorBox msg={error} onRetry={() => requestGeneration(generate)} />}
        {result && (
          <div className="space-y-4">
            {result.webinarTitle && (
              <div className="bg-purple-500/8 border border-purple-500/20 rounded-2xl p-4 flex justify-between gap-2">
                <div>
                  <p className="text-purple-300 text-xs font-semibold mb-1">🎓 Webinar Title</p>
                  <p className="text-white font-bold text-base">{result.webinarTitle}</p>
                  {result.hook && <p className="text-slate-400 text-xs mt-1">{result.hook}</p>}
                </div>
                <CopyBtn text={result.webinarTitle} />
              </div>
            )}
            {result.agenda?.length > 0 && (
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3.5">
                <p className="text-white text-xs font-semibold mb-2">📋 Agenda</p>
                {result.agenda.map((a: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 mb-2">
                    <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">{a.minute}</span>
                    <div><p className="text-white text-xs font-medium">{a.topic}</p><p className="text-slate-500 text-[10px]">{a.purpose}</p></div>
                  </div>
                ))}
              </div>
            )}
            {result.promotion && (
              <div>
                <p className="text-white text-sm font-bold mb-2">📢 Promotion Plan</p>
                <div className="space-y-2">
                  {Object.entries(result.promotion).map(([channel, data]: any) => data && (
                    <div key={channel} className="bg-slate-800/60 border border-slate-700 rounded-xl p-3">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex-1">
                          <p className="text-white text-xs font-semibold capitalize">{channel}</p>
                          <p className="text-slate-400 text-xs mt-0.5">{data.videoTitle || data.postTitle || data.postAngle || data.subject || data.message || data.concept}</p>
                          {data.sequence && <p className="text-slate-500 text-xs mt-0.5">{data.sequence}</p>}
                        </div>
                        {data.toolLink && <ToolBtn name={data.toolLink.name} anchor={data.toolLink.anchor} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {result.pitch && (
              <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-3.5">
                <p className="text-emerald-400 text-xs font-bold mb-1">💰 Pitch Strategy</p>
                <p className="text-slate-300 text-xs"><strong className="text-white">Timing:</strong> {result.pitch.timing}</p>
                <p className="text-slate-300 text-xs mt-1">{result.pitch.script}</p>
                {result.pitch.urgency && <p className="text-amber-400 text-xs mt-1">⏱ {result.pitch.urgency}</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 5: REVENUE SCALE PLAN
// ═══════════════════════════════════════════════════════════════════════════

function ScaleTab() {
  const { profile } = useUser();
  const { requestGeneration } = useGenerationGate();
  const [niche, setNiche] = useState(profile.businessLabel || ""); const [product, setProduct] = useState("");
  const [currentRevenue, setCurrentRevenue] = useState(""); const [targetRevenue, setTargetRevenue] = useState("₹1,00,000/month");
  const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const [result, setResult] = useState<any>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function generate() {
    if (!niche.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController(); abortRef.current = ctrl;
    setLoading(true); setError(""); setResult(null);
    try { setResult(await callAPI("yt-scale-plan", { niche, product, currentRevenue, targetRevenue, businessType: profile.businessType }, ctrl.signal)); }
    catch (e: any) { if (e.name !== "AbortError") setError(e.message); }
    finally { setLoading(false); }
  }

  const PHASE_COLORS = ["bg-blue-500","bg-emerald-500","bg-amber-500"];

  return (
    <div className="grid lg:grid-cols-[270px,1fr] gap-6">
      <div className="space-y-3">
        <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-3">
          <p className="text-amber-300 text-xs font-semibold mb-1">💰 Revenue Scale Plan</p>
          <p className="text-slate-400 text-xs">From free content → paid products → scale — with YouTube Ads, Facebook Ads, email sequences, and all Marketingstuffs tools.</p>
        </div>
        {[
          { label: "Your Niche / Business *", val: niche, set: setNiche, ph: "e.g. SaaS, Fitness coaching, eCommerce" },
          { label: "Product / Service", val: product, set: setProduct, ph: "e.g. Online course, Subscription, Consulting" },
          { label: "Current Monthly Revenue", val: currentRevenue, set: setCurrentRevenue, ph: "e.g. ₹0, ₹10,000, ₹50,000" },
          { label: "Revenue Target", val: targetRevenue, set: setTargetRevenue, ph: "e.g. ₹1,00,000/month" },
        ].map(f => (
          <div key={f.label}>
            <label className="text-slate-300 text-xs font-medium mb-1 block">{f.label}</label>
            <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
              placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)} />
          </div>
        ))}
        <Button onClick={() => requestGeneration(generate)} disabled={!niche.trim() || loading}
          className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 rounded-xl disabled:opacity-40">
          {loading ? <><Loader2 size={14} className="animate-spin mr-2" />Planning…</> : <><DollarSign size={14} className="mr-2" />Generate Revenue Plan</>}
        </Button>
      </div>
      <div>
        {!result && !loading && !error && <EmptyState icon={TrendingUp} title="3-Phase Revenue Scale Plan" desc="Free content → paid product → membership + ads — phased revenue roadmap using all site tools" />}
        {loading && <LoadingState label="Building your revenue scaling roadmap…" />}
        {error && <ErrorBox msg={error} onRetry={() => requestGeneration(generate)} />}
        {result && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              {result.currentState && <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3"><p className="text-slate-400 text-xs font-semibold mb-1">Now</p><p className="text-slate-300 text-xs">{result.currentState}</p></div>}
              {result.targetState && <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-3"><p className="text-emerald-400 text-xs font-semibold mb-1">In 12 months</p><p className="text-slate-300 text-xs">{result.targetState}</p></div>}
            </div>
            {result.biggestLever && (
              <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-3.5">
                <p className="text-amber-400 text-xs font-bold mb-1">⚡ Biggest Lever Right Now</p>
                <p className="text-slate-300 text-xs">{result.biggestLever}</p>
              </div>
            )}
            {(result.phases || []).map((phase: any, i: number) => (
              <div key={i} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <div className={`w-7 h-7 rounded-full ${PHASE_COLORS[i]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>{phase.phase}</div>
                  <div>
                    <p className="text-white font-semibold text-sm">{phase.name}</p>
                    <div className="flex gap-2"><span className="text-[10px] text-slate-500">{phase.duration}</span><span className="text-[10px] text-emerald-400 font-semibold">{phase.monthlyRevenueTarget}</span></div>
                  </div>
                </div>
                <div className="space-y-2 mb-2">
                  {(phase.strategies || []).map((s: any, j: number) => (
                    <div key={j} className="bg-slate-700/40 rounded-lg px-3 py-2">
                      <p className="text-white text-xs font-semibold">{s.strategy}</p>
                      <p className="text-slate-400 text-xs">{s.description}</p>
                      {s.tools?.length > 0 && <div className="flex flex-wrap gap-1.5 mt-1.5">{s.tools.map((t: any, k: number) => <ToolBtn key={k} name={t.name} anchor={t.anchor} reason={t.reason} />)}</div>}
                    </div>
                  ))}
                </div>
                <p className="text-emerald-400 text-xs">🏁 {phase.milestone}</p>
              </div>
            ))}
            {result.revenueStreams?.length > 0 && (
              <div>
                <p className="text-white text-sm font-bold mb-2">💸 Revenue Streams</p>
                <div className="space-y-2">
                  {result.revenueStreams.map((r: any, i: number) => (
                    <div key={i} className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="text-white text-xs font-semibold">{r.stream}</p>
                        <p className="text-emerald-400 text-xs font-bold">{r.potential}</p>
                        <p className="text-slate-400 text-xs mt-0.5">{r.howToStart}</p>
                      </div>
                      {r.tools?.length > 0 && <div className="flex flex-wrap gap-1.5">{r.tools.map((t: any, j: number) => <ToolBtn key={j} name={t.name} anchor={t.anchor} />)}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {result.adStrategy && (
              <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-3.5">
                <p className="text-red-400 text-xs font-bold mb-1">📢 Ad Campaign Strategy</p>
                <p className="text-slate-300 text-xs"><strong className="text-white">When to start:</strong> {result.adStrategy.whenToStart}</p>
                <p className="text-slate-300 text-xs mt-1"><strong className="text-white">Budget:</strong> {result.adStrategy.budget} • <strong className="text-white">Platform:</strong> {result.adStrategy.platform}</p>
                {result.adStrategy.toolLink && <div className="mt-2"><ToolBtn name={result.adStrategy.toolLink.name} anchor={result.adStrategy.toolLink.anchor} /></div>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 6: GROWTH COACH (AI streaming, all-tools aware)
// ═══════════════════════════════════════════════════════════════════════════

interface ChatMsg { role: "user" | "assistant"; content: string }

function CoachTab() {
  const { profile } = useUser();
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content: `Hi${profile.name ? ` ${profile.name}` : ""}! 👋 I'm your Marketingstuffs Growth Coach.\n\nI know every tool on this platform and can guide you through the complete digital marketing journey — from your first YouTube Short to running Google Ads and scaling to ₹1L+/month.\n\nAsk me anything:\n• Which tool to use for your specific goal\n• How to grow on YouTube, Instagram, LinkedIn\n• How to set up email/SMS funnels\n• How to run Google, Facebook, or YouTube ads\n• How to plan a webinar or product launch\n• What to do next based on your metrics\n\nWhat's your biggest marketing challenge right now?`
    }
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { requestGeneration } = useGenerationGate();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    const newMsgs: ChatMsg[] = [...messages, { role: "user", content: text }];
    setMessages(newMsgs);
    setStreaming(true);
    abortRef.current?.abort();
    const ctrl = new AbortController(); abortRef.current = ctrl;
    let acc = "";
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);
    try {
      const res = await fetch(`${BASE_URL}ai/yt-coach`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs }), signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(await res.text());
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No stream");
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split("\n")) {
          if (line.startsWith("data: ")) {
            const raw = line.slice(6).trim();
            if (raw === "[DONE]") break;
            try { acc += JSON.parse(raw).choices?.[0]?.delta?.content || ""; setMessages(prev => { const u = [...prev]; u[u.length-1] = { role: "assistant", content: acc }; return u; }); } catch {}
          }
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") setMessages(prev => { const u = [...prev]; u[u.length-1] = { role: "assistant", content: "Sorry, I hit an error. Try again." }; return u; });
    } finally { setStreaming(false); }
  }

  const QUICK = [
    "Which tool should I start with as a beginner?",
    "How do I grow from 0 to 1000 YouTube subscribers?",
    "When should I start running ads?",
    "How do I build an email list using YouTube?",
    "What's the best funnel for selling a digital product in India?",
    "How do I use SMS marketing effectively?",
  ];

  return (
    <div className="flex flex-col h-[560px]">
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 mt-2 mb-4">
            {QUICK.map(q => (
              <button key={q} onClick={() => setInput(q)}
                className="text-xs bg-slate-800 border border-slate-700 text-slate-300 hover:border-emerald-500/50 hover:text-white px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5">
                <ArrowRight size={9} className="text-emerald-400" />{q}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[82%] rounded-2xl px-4 py-3 ${m.role === "user" ? "bg-emerald-600 text-white" : "bg-slate-800 border border-slate-700 text-slate-200"}`}>
              {m.role === "assistant" && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center"><Bot size={9} className="text-white" /></div>
                  <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">Growth Coach</span>
                </div>
              )}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}
                {streaming && i === messages.length - 1 && m.role === "assistant" && <span className="inline-block w-0.5 h-4 bg-emerald-400 animate-pulse ml-0.5 align-middle" />}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-end gap-2 bg-slate-800/60 border border-slate-700 rounded-2xl p-3">
        <textarea rows={1} className="flex-1 bg-transparent text-white text-sm placeholder-slate-500 focus:outline-none resize-none leading-relaxed"
          placeholder="Ask about any marketing tool, strategy, or next step…"
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); requestGeneration(send); } }}
          style={{ maxHeight: "120px", overflowY: "auto" }} />
        <button onClick={() => requestGeneration(send)} disabled={!input.trim() || streaming}
          className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 flex items-center justify-center shrink-0 transition-colors">
          <Send size={15} className="text-white" />
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SECTION
// ═══════════════════════════════════════════════════════════════════════════

const TABS = [
  { id: "plan",     icon: Map,           label: "My Growth Plan",   badge: "🎯" },
  { id: "analyzer", icon: BarChart2,     label: "Channel Analyzer", badge: "📊" },
  { id: "content",  icon: Layers,        label: "Content Machine",  badge: "🎬" },
  { id: "shorts",   icon: Smartphone,    label: "Shorts Planner",   badge: "📱" },
  { id: "webinar",  icon: Users,         label: "Webinar Funnel",   badge: "🎓" },
  { id: "scale",    icon: TrendingUp,    label: "Scale & Revenue",  badge: "💰" },
  { id: "coach",    icon: Bot,           label: "Growth Coach",     badge: "AI" },
] as const;

type TabId = typeof TABS[number]["id"];

export default function YTGrowstuffsSection() {
  const [activeTab, setActiveTab] = useState<TabId>("plan");
  const { setShowOnboarding, profile } = useUser();
  const tabBarRef = useRef<HTMLDivElement>(null);

  function openOnboarding() {
    setShowOnboarding(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const tabComponents: Record<TabId, React.ReactNode> = {
    plan:     <GrowthPlanTab onStartOnboarding={openOnboarding} />,
    analyzer: <AnalyzerTab />,
    content:  <ContentMachineTab />,
    shorts:   <ShortsTab />,
    webinar:  <WebinarTab />,
    scale:    <ScaleTab />,
    coach:    <CoachTab />,
  };

  // All site tools for the overview strip
  const TOOL_STRIP = [
    { name: "Blog Writer", anchor: "#blog-writer", icon: "✍️" },
    { name: "Website Builder", anchor: "#website-developer", icon: "🌐" },
    { name: "Social Media", anchor: "#social-media-section", icon: "📱" },
    { name: "Ad Campaigns", anchor: "#ad-campaigns", icon: "🎯" },
    { name: "Email Marketing", anchor: "#email-marketing", icon: "📧" },
    { name: "SMS Marketing", anchor: "#sms-marketing", icon: "💬" },
    { name: "AI Image", anchor: "#ai-image", icon: "✨" },
    { name: "AI Video", anchor: "#ai-video", icon: "🎬" },
    { name: "AI Voice", anchor: "#ai-voice", icon: "🎙️" },
    { name: "Writing Tools", anchor: "#writing-tools", icon: "📝" },
    { name: "AI Tools Hub", anchor: "#ai-tools", icon: "🤖" },
  ];

  return (
    <section id="yt-growstuffs" className="py-20 px-4 bg-gradient-to-b from-[#06060f] via-[#08080f] to-[#06060f] relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-600/4 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-4 py-1.5 mb-4">
            <Zap size={13} className="text-emerald-400" fill="currentColor" />
            <span className="text-emerald-300 text-sm font-semibold">Marketingstuffs Growth Hub</span>
            <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">AI</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-3">
            Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-500">
              Growth Hub
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            The AI command center that connects every Marketingstuffs tool — analyzes your performance, suggests your next move, and tracks your complete digital marketing growth.
          </p>
        </div>

        {/* Tool strip — all connected tools */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {TOOL_STRIP.map(t => (
            <button key={t.anchor} onClick={() => scrollToTool(t.anchor)}
              className="flex items-center gap-1.5 text-xs bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 px-3 py-1.5 rounded-full transition-all">
              {t.icon} {t.name}
            </button>
          ))}
        </div>

        {/* Main card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">

          {/* Tab bar */}
          <div ref={tabBarRef} className="flex overflow-x-auto border-b border-slate-800 bg-slate-950/60 scrollbar-hide">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const hasProfile = tab.id === "plan" && profile.onboardingComplete;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-4 py-3.5 text-xs font-medium whitespace-nowrap transition-all border-b-2 shrink-0 ${
                    isActive ? "border-emerald-500 text-white bg-emerald-500/5" : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/3"
                  }`}>
                  <Icon size={13} className={isActive ? "text-emerald-400" : ""} />
                  {tab.label}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-500"}`}>{tab.badge}</span>
                  {hasProfile && (
                    <span className="absolute top-2 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Plan ready" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                {tabComponents[activeTab]}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-700">
          <span>🎯 Suggestion-based system — AI tells you exactly what to do next</span>
          <span>•</span>
          <span>🔗 All tools connected — one hub for your entire digital growth</span>
          <span>•</span>
          <span>📊 Track progress across every channel</span>
        </div>
      </div>
    </section>
  );
}
