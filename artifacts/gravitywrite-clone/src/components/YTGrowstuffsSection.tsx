import { useState, useRef, useEffect } from "react";
import { useGenerationGate } from "@/components/GenerationGate";
import { motion, AnimatePresence } from "framer-motion";
import {
  Youtube, Lightbulb, Type, FileText, AlignLeft, Search, Tag,
  Image, BarChart2, Clock, TrendingUp, Users, Bot, Loader2, Copy,
  Check, RefreshCw, Sparkles, AlertCircle, Send, ChevronRight,
  Star, Zap, Eye, Target, Award, Flame, Hash, Palette, Calendar,
  MessageCircle, ArrowUp, ArrowRight, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "") + "/__api/";

// ── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { id: "ideas",       icon: Lightbulb,    label: "Daily Ideas",      color: "text-yellow-400",  badge: "🔥" },
  { id: "titles",      icon: Type,         label: "Title Generator",  color: "text-blue-400",    badge: "✨" },
  { id: "script",      icon: FileText,     label: "Script Writer",    color: "text-green-400",   badge: "" },
  { id: "description", icon: AlignLeft,    label: "Description AI",   color: "text-purple-400",  badge: "" },
  { id: "keywords",    icon: Search,       label: "Keyword Research", color: "text-cyan-400",    badge: "📊" },
  { id: "tags",        icon: Tag,          label: "Tag Generator",    color: "text-orange-400",  badge: "" },
  { id: "thumbnail",   icon: Image,        label: "Thumbnail Ideas",  color: "text-pink-400",    badge: "🎨" },
  { id: "audit",       icon: BarChart2,    label: "Channel Audit",    color: "text-emerald-400", badge: "" },
  { id: "besttime",    icon: Clock,        label: "Best Time to Post",color: "text-teal-400",    badge: "" },
  { id: "trends",      icon: TrendingUp,   label: "Trend Finder",     color: "text-red-400",     badge: "🌋" },
  { id: "competitor",  icon: Users,        label: "Competitor Intel", color: "text-violet-400",  badge: "" },
  { id: "coach",       icon: Bot,          label: "AI Coach",         color: "text-rose-400",    badge: "AI" },
] as const;

type TabId = typeof TABS[number]["id"];

// ── Shared helpers ─────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
      className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
      {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
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
        <button onClick={onRetry} className="mt-2 text-xs text-red-300 hover:text-white flex items-center gap-1"><RefreshCw size={12} /> Try again</button>
      </div>
    </div>
  );
}

function LoadingBox({ label }: { label: string }) {
  return (
    <div className="min-h-52 flex flex-col items-center justify-center bg-slate-900/30 border border-dashed border-slate-700 rounded-2xl p-8">
      <Loader2 size={32} className="animate-spin text-red-400 mb-3" />
      <p className="text-white font-medium text-sm">{label}</p>
    </div>
  );
}

function EmptyBox({ icon: Icon, title, desc }: { icon: React.FC<any>; title: string; desc: string }) {
  return (
    <div className="min-h-52 flex flex-col items-center justify-center text-center bg-slate-900/30 border border-dashed border-slate-700 rounded-2xl p-8">
      <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-3">
        <Icon size={22} className="text-red-400" />
      </div>
      <p className="text-white font-semibold text-sm mb-1">{title}</p>
      <p className="text-slate-400 text-xs max-w-xs">{desc}</p>
    </div>
  );
}

function ViewBadge({ level }: { level: string }) {
  const color = level === "Very High" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
    : level === "High" ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
    : "bg-amber-500/20 text-amber-300 border-amber-500/30";
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${color}`}>{level}</span>;
}

// ── Generic fetch helper ──────────────────────────────────────────────────

async function callAPI(endpoint: string, body: object, signal: AbortSignal) {
  const res = await fetch(`${BASE_URL}ai/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || res.statusText);
  }
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: Daily Ideas
// ═══════════════════════════════════════════════════════════════════════════

function IdeasTab() {
  const { requestGeneration } = useGenerationGate();
  const [niche, setNiche] = useState("");
  const [channel, setChannel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ideas, setIdeas] = useState<Array<{ title: string; viewPrediction: string; why: string; hook: string }>>([]);
  const abortRef = useRef<AbortController | null>(null);

  async function generate() {
    if (!niche.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController(); abortRef.current = ctrl;
    setLoading(true); setError(""); setIdeas([]);
    try {
      const data = await callAPI("yt-ideas", { niche, channel }, ctrl.signal);
      setIdeas(data.ideas || []);
    } catch (e: any) { if (e.name !== "AbortError") setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="grid lg:grid-cols-[320px,1fr] gap-6">
      <div className="space-y-4">
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Your Niche / Topic *</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm transition-colors"
            placeholder="e.g. Personal Finance, Travel Vlogging, Gaming" value={niche} onChange={e => setNiche(e.target.value)} onKeyDown={e => e.key === "Enter" && requestGeneration(generate)} />
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Channel Name (optional)</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm transition-colors"
            placeholder="e.g. MoneyMindset" value={channel} onChange={e => setChannel(e.target.value)} />
        </div>
        <Button onClick={() => requestGeneration(generate)} disabled={!niche.trim() || loading}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl disabled:opacity-40">
          {loading ? <><Loader2 size={15} className="animate-spin mr-2" />Generating...</> : <><Sparkles size={15} className="mr-2" />Get Today's Ideas</>}
        </Button>
      </div>
      <div>
        {!ideas.length && !loading && !error && <EmptyBox icon={Lightbulb} title="8 Fresh Video Ideas Await" desc="Enter your niche to get AI-curated ideas with view potential predictions" />}
        {loading && <LoadingBox label="Researching trending topics for your niche…" />}
        {error && <ErrorBox msg={error} onRetry={() => requestGeneration(generate)} />}
        {ideas.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white font-semibold text-sm">{ideas.length} Ideas Ready</p>
              <button onClick={() => requestGeneration(generate)} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg"><RefreshCw size={11} /> New batch</button>
            </div>
            {ideas.map((idea, i) => (
              <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 flex items-start gap-3 group hover:border-slate-600 transition-colors">
                <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-white text-sm font-semibold leading-snug">{idea.title}</p>
                    <div className="flex items-center gap-1.5 shrink-0"><ViewBadge level={idea.viewPrediction} /><CopyBtn text={idea.title} /></div>
                  </div>
                  {idea.hook && <p className="text-red-300 text-xs mb-1 italic">Hook: "{idea.hook}"</p>}
                  <p className="text-slate-400 text-xs leading-relaxed">{idea.why}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: Title Generator
// ═══════════════════════════════════════════════════════════════════════════

function TitlesTab() {
  const { requestGeneration } = useGenerationGate();
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [style, setStyle] = useState("mixed");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [titles, setTitles] = useState<Array<{ title: string; style: string; ctrReason: string; hook: string }>>([]);
  const abortRef = useRef<AbortController | null>(null);

  const STYLES = [
    { id: "mixed", label: "Mixed" }, { id: "listicle", label: "Listicle" },
    { id: "howto", label: "How-to" }, { id: "shocking", label: "Shocking" },
    { id: "question", label: "Question" }, { id: "story", label: "Story" },
  ];

  async function generate() {
    if (!topic.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController(); abortRef.current = ctrl;
    setLoading(true); setError(""); setTitles([]);
    try {
      const data = await callAPI("yt-titles", { topic, keywords, style }, ctrl.signal);
      setTitles(data.titles || []);
    } catch (e: any) { if (e.name !== "AbortError") setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="grid lg:grid-cols-[320px,1fr] gap-6">
      <div className="space-y-4">
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Video Topic *</label>
          <textarea rows={2} className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm resize-none transition-colors"
            placeholder="e.g. How I saved $10,000 in one year on a minimum wage" value={topic} onChange={e => setTopic(e.target.value)} />
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Target Keywords</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm transition-colors"
            placeholder="e.g. saving money, budgeting tips" value={keywords} onChange={e => setKeywords(e.target.value)} />
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-2 block">Title Style</label>
          <div className="grid grid-cols-3 gap-1.5">
            {STYLES.map(s => (
              <button key={s.id} onClick={() => setStyle(s.id)}
                className={`p-1.5 rounded-lg border text-xs transition-all ${style === s.id ? "border-red-500 bg-red-500/15 text-red-300" : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500"}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={() => requestGeneration(generate)} disabled={!topic.trim() || loading}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl disabled:opacity-40">
          {loading ? <><Loader2 size={15} className="animate-spin mr-2" />Generating...</> : <><Type size={15} className="mr-2" />Generate Titles</>}
        </Button>
      </div>
      <div>
        {!titles.length && !loading && !error && <EmptyBox icon={Type} title="High-CTR Titles On Demand" desc="Get 8 title variations optimized for clicks, search, and algorithm performance" />}
        {loading && <LoadingBox label="Crafting click-worthy titles…" />}
        {error && <ErrorBox msg={error} onRetry={() => requestGeneration(generate)} />}
        {titles.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white font-semibold text-sm">{titles.length} Title Variations</p>
              <button onClick={() => requestGeneration(generate)} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg"><RefreshCw size={11} /> Regenerate</button>
            </div>
            {titles.map((t, i) => (
              <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5 hover:border-slate-600 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-white text-sm font-semibold leading-snug flex-1">{t.title}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{t.style}</span>
                    <CopyBtn text={t.title} />
                  </div>
                </div>
                <p className="text-slate-400 text-xs">{t.ctrReason}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: Script Writer
// ═══════════════════════════════════════════════════════════════════════════

function ScriptTab() {
  const { requestGeneration } = useGenerationGate();
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("10");
  const [style, setStyle] = useState("educational");
  const [keyPoints, setKeyPoints] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [script, setScript] = useState<{ hook: string; intro: string; sections: Array<{ heading: string; content: string }>; outro: string; cta: string } | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>("hook");
  const abortRef = useRef<AbortController | null>(null);

  const DURATIONS = ["5", "10", "15", "20"];
  const STYLES = [
    { id: "educational", label: "Educational" }, { id: "entertainment", label: "Entertainment" },
    { id: "tutorial", label: "Tutorial" }, { id: "vlog", label: "Vlog / Story" },
  ];

  async function generate() {
    if (!title.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController(); abortRef.current = ctrl;
    setLoading(true); setError(""); setScript(null);
    try {
      const data = await callAPI("yt-script", { title, duration, style, keyPoints }, ctrl.signal);
      setScript(data.script || null);
      setActiveSection("hook");
    } catch (e: any) { if (e.name !== "AbortError") setError(e.message); }
    finally { setLoading(false); }
  }

  const allText = script ? [script.hook, script.intro, ...(script.sections || []).map(s => `${s.heading}\n\n${s.content}`), script.outro, script.cta].join("\n\n") : "";

  return (
    <div className="grid lg:grid-cols-[300px,1fr] gap-6">
      <div className="space-y-4">
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Video Title *</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm transition-colors"
            placeholder="Paste your video title here" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-2 block">Video Length</label>
          <div className="grid grid-cols-4 gap-1.5">
            {DURATIONS.map(d => (
              <button key={d} onClick={() => setDuration(d)}
                className={`p-2 rounded-lg border text-xs transition-all ${duration === d ? "border-red-500 bg-red-500/15 text-red-300" : "border-slate-700 bg-slate-800/50 text-slate-400"}`}>
                {d} min
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-2 block">Video Style</label>
          <div className="grid grid-cols-2 gap-1.5">
            {STYLES.map(s => (
              <button key={s.id} onClick={() => setStyle(s.id)}
                className={`p-2 rounded-lg border text-xs transition-all ${style === s.id ? "border-red-500 bg-red-500/15 text-red-300" : "border-slate-700 bg-slate-800/50 text-slate-400"}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Key Points to Cover</label>
          <textarea rows={3} className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm resize-none transition-colors"
            placeholder="List main points, e.g: compound interest, index funds, emergency fund" value={keyPoints} onChange={e => setKeyPoints(e.target.value)} />
        </div>
        <Button onClick={() => requestGeneration(generate)} disabled={!title.trim() || loading}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl disabled:opacity-40">
          {loading ? <><Loader2 size={15} className="animate-spin mr-2" />Writing Script...</> : <><FileText size={15} className="mr-2" />Generate Script</>}
        </Button>
      </div>
      <div>
        {!script && !loading && !error && <EmptyBox icon={FileText} title="Full Video Script Ready in Seconds" desc="Hook → Intro → Main sections → Outro → Call to Action, all written for you" />}
        {loading && <LoadingBox label={`Writing a ${duration}-min ${style} script…`} />}
        {error && <ErrorBox msg={error} onRetry={() => requestGeneration(generate)} />}
        {script && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="bg-green-500/15 text-green-400 border border-green-500/30 text-xs px-2.5 py-1 rounded-full">✓ Script Ready</span>
              <div className="flex gap-2">
                <button onClick={() => requestGeneration(generate)} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg"><RefreshCw size={11} /> Rewrite</button>
                <button onClick={() => navigator.clipboard.writeText(allText)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 border border-blue-500/30 px-2.5 py-1 rounded-lg"><Copy size={11} /> Copy All</button>
              </div>
            </div>
            {[
              { key: "hook", label: "🪝 Hook (First 30s)", content: script.hook },
              { key: "intro", label: "👋 Intro", content: script.intro },
              ...(script.sections || []).map((s, i) => ({ key: `s${i}`, label: `📌 ${s.heading}`, content: s.content })),
              { key: "outro", label: "🎬 Outro", content: script.outro },
              { key: "cta", label: "📢 Call to Action", content: script.cta },
            ].map(sec => (
              <div key={sec.key} className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
                <button onClick={() => setActiveSection(activeSection === sec.key ? null : sec.key)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700/30 transition-colors">
                  <span>{sec.label}</span>
                  <div className="flex items-center gap-2">
                    <CopyBtn text={sec.content} />
                    <ChevronRight size={14} className={`text-slate-400 transition-transform ${activeSection === sec.key ? "rotate-90" : ""}`} />
                  </div>
                </button>
                <AnimatePresence>
                  {activeSection === sec.key && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-4 pt-0">
                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap border-t border-slate-700 pt-3">{sec.content}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: Description AI
// ═══════════════════════════════════════════════════════════════════════════

function DescriptionTab() {
  const { requestGeneration } = useGenerationGate();
  const [videoTitle, setVideoTitle] = useState("");
  const [channelName, setChannelName] = useState("");
  const [keywords, setKeywords] = useState("");
  const [socials, setSocials] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ description: string; hashtags: string[] } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function generate() {
    if (!videoTitle.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController(); abortRef.current = ctrl;
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await callAPI("yt-description", { videoTitle, channelName, keywords, socials }, ctrl.signal);
      setResult(data);
    } catch (e: any) { if (e.name !== "AbortError") setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="grid lg:grid-cols-[300px,1fr] gap-6">
      <div className="space-y-4">
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Video Title *</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm transition-colors"
            placeholder="Your video title" value={videoTitle} onChange={e => setVideoTitle(e.target.value)} />
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Channel Name</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm transition-colors"
            placeholder="e.g. MoneyMindset" value={channelName} onChange={e => setChannelName(e.target.value)} />
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Target Keywords</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm transition-colors"
            placeholder="e.g. saving money, budgeting" value={keywords} onChange={e => setKeywords(e.target.value)} />
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Social / Links to Include</label>
          <textarea rows={2} className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm resize-none transition-colors"
            placeholder="Instagram: @handle&#10;Website: https://..." value={socials} onChange={e => setSocials(e.target.value)} />
        </div>
        <Button onClick={() => requestGeneration(generate)} disabled={!videoTitle.trim() || loading}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl disabled:opacity-40">
          {loading ? <><Loader2 size={15} className="animate-spin mr-2" />Writing...</> : <><AlignLeft size={15} className="mr-2" />Generate Description</>}
        </Button>
      </div>
      <div>
        {!result && !loading && !error && <EmptyBox icon={AlignLeft} title="SEO-Optimized Description" desc="Full description with keywords, timestamps template, hashtags, and social links" />}
        {loading && <LoadingBox label="Writing SEO-optimized description…" />}
        {error && <ErrorBox msg={error} onRetry={() => requestGeneration(generate)} />}
        {result && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="bg-purple-500/15 text-purple-400 border border-purple-500/30 text-xs px-2.5 py-1 rounded-full">✓ Description Ready</span>
              <button onClick={() => requestGeneration(generate)} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg"><RefreshCw size={11} /> Regenerate</button>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Description</span>
                <CopyBtn text={result.description} />
              </div>
              <pre className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">{result.description}</pre>
            </div>
            {result.hashtags?.length > 0 && (
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Hashtags</span>
                  <CopyBtn text={result.hashtags.map(h => `#${h.replace(/^#/, "")}`).join(" ")} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.hashtags.map((h, i) => (
                    <span key={i} className="bg-red-500/10 text-red-300 border border-red-500/20 px-2.5 py-0.5 rounded-full text-xs">#{h.replace(/^#/, "")}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: Keyword Research
// ═══════════════════════════════════════════════════════════════════════════

function KeywordsTab() {
  const { requestGeneration } = useGenerationGate();
  const [topic, setTopic] = useState("");
  const [niche, setNiche] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [keywords, setKeywords] = useState<Array<{ keyword: string; volume: string; competition: number; score: number; trend: string; type: string }>>([]);
  const abortRef = useRef<AbortController | null>(null);

  async function generate() {
    if (!topic.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController(); abortRef.current = ctrl;
    setLoading(true); setError(""); setKeywords([]);
    try {
      const data = await callAPI("yt-keywords", { topic, niche }, ctrl.signal);
      setKeywords(data.keywords || []);
    } catch (e: any) { if (e.name !== "AbortError") setError(e.message); }
    finally { setLoading(false); }
  }

  function scoreColor(s: number) {
    if (s >= 75) return "text-emerald-400";
    if (s >= 50) return "text-blue-400";
    if (s >= 25) return "text-amber-400";
    return "text-red-400";
  }

  function compBar(c: number) {
    const pct = (c / 10) * 100;
    const color = c <= 3 ? "bg-emerald-500" : c <= 6 ? "bg-amber-500" : "bg-red-500";
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs text-slate-400 w-4">{c}</span>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[280px,1fr] gap-6">
      <div className="space-y-4">
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Main Topic / Seed Keyword *</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm transition-colors"
            placeholder="e.g. budgeting tips, gaming chair review" value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === "Enter" && requestGeneration(generate)} />
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Your Niche</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm transition-colors"
            placeholder="e.g. Personal Finance" value={niche} onChange={e => setNiche(e.target.value)} />
        </div>
        <Button onClick={() => requestGeneration(generate)} disabled={!topic.trim() || loading}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl disabled:opacity-40">
          {loading ? <><Loader2 size={15} className="animate-spin mr-2" />Researching...</> : <><Search size={15} className="mr-2" />Research Keywords</>}
        </Button>
        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
          <p className="text-slate-400 text-xs font-semibold mb-2">Score Guide</p>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" /><span className="text-slate-400">Score 75-100: High opportunity</span></div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" /><span className="text-slate-400">Score 50-74: Good opportunity</span></div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" /><span className="text-slate-400">Score 25-49: Moderate</span></div>
          </div>
        </div>
      </div>
      <div>
        {!keywords.length && !loading && !error && <EmptyBox icon={Search} title="Keyword Research Engine" desc="Discover high-opportunity keywords with volume, competition score, and trend data" />}
        {loading && <LoadingBox label="Analyzing keyword landscape…" />}
        {error && <ErrorBox msg={error} onRetry={() => requestGeneration(generate)} />}
        {keywords.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white font-semibold text-sm">{keywords.length} Keywords Found</p>
              <button onClick={() => requestGeneration(generate)} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg"><RefreshCw size={11} /> Refresh</button>
            </div>
            <div className="bg-slate-800/40 rounded-xl overflow-hidden border border-slate-700/50">
              <div className="grid grid-cols-[1fr,80px,100px,70px,60px,32px] gap-3 px-4 py-2.5 bg-slate-800/80 border-b border-slate-700 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                <span>Keyword</span><span>Volume</span><span>Competition</span><span>Score</span><span>Trend</span><span></span>
              </div>
              <div className="divide-y divide-slate-700/50">
                {keywords.map((kw, i) => (
                  <div key={i} className="grid grid-cols-[1fr,80px,100px,70px,60px,32px] gap-3 px-4 py-3 items-center hover:bg-slate-800/40 transition-colors">
                    <div>
                      <p className="text-white text-xs font-medium">{kw.keyword}</p>
                      {kw.type && <span className="text-[10px] text-slate-500">{kw.type}</span>}
                    </div>
                    <span className={`text-xs font-semibold ${kw.volume === "High" ? "text-emerald-400" : kw.volume === "Medium" ? "text-amber-400" : "text-slate-400"}`}>{kw.volume}</span>
                    {compBar(kw.competition)}
                    <span className={`text-sm font-bold ${scoreColor(kw.score)}`}>{kw.score}</span>
                    <span className="text-xs">{kw.trend === "Rising" ? "📈" : kw.trend === "Falling" ? "📉" : "➡️"} <span className="text-slate-400">{kw.trend}</span></span>
                    <CopyBtn text={kw.keyword} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: Tag Generator
// ═══════════════════════════════════════════════════════════════════════════

function TagsTab() {
  const { requestGeneration } = useGenerationGate();
  const [videoTitle, setVideoTitle] = useState("");
  const [niche, setNiche] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tags, setTags] = useState<{ primary: string[]; secondary: string[]; longtail: string[] } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function generate() {
    if (!videoTitle.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController(); abortRef.current = ctrl;
    setLoading(true); setError(""); setTags(null);
    try {
      const data = await callAPI("yt-tags", { videoTitle, niche }, ctrl.signal);
      setTags(data.tags || null);
    } catch (e: any) { if (e.name !== "AbortError") setError(e.message); }
    finally { setLoading(false); }
  }

  const allTags = tags ? [...(tags.primary||[]), ...(tags.secondary||[]), ...(tags.longtail||[])] : [];

  return (
    <div className="grid lg:grid-cols-[280px,1fr] gap-6">
      <div className="space-y-4">
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Video Title *</label>
          <textarea rows={2} className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm resize-none transition-colors"
            placeholder="e.g. How to Save $10k in 2025 (Step by Step)" value={videoTitle} onChange={e => setVideoTitle(e.target.value)} />
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Channel Niche</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm transition-colors"
            placeholder="e.g. Personal Finance" value={niche} onChange={e => setNiche(e.target.value)} />
        </div>
        <Button onClick={() => requestGeneration(generate)} disabled={!videoTitle.trim() || loading}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl disabled:opacity-40">
          {loading ? <><Loader2 size={15} className="animate-spin mr-2" />Generating...</> : <><Tag size={15} className="mr-2" />Generate Tags</>}
        </Button>
      </div>
      <div>
        {!tags && !loading && !error && <EmptyBox icon={Tag} title="30+ Optimized Tags" desc="Primary, secondary, and long-tail tags to maximize your video's search reach" />}
        {loading && <LoadingBox label="Building your tag strategy…" />}
        {error && <ErrorBox msg={error} onRetry={() => requestGeneration(generate)} />}
        {tags && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="bg-orange-500/15 text-orange-400 border border-orange-500/30 text-xs px-2.5 py-1 rounded-full">✓ {allTags.length} Tags Ready</span>
              <div className="flex gap-2">
                <button onClick={() => requestGeneration(generate)} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg"><RefreshCw size={11} /> Refresh</button>
                <button onClick={() => navigator.clipboard.writeText(allTags.join(", "))} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 border border-blue-500/30 px-2.5 py-1 rounded-lg"><Copy size={11} /> Copy All</button>
              </div>
            </div>
            {[
              { label: "Primary Tags", tags: tags.primary, color: "bg-red-500/10 text-red-300 border-red-500/20" },
              { label: "Secondary Tags", tags: tags.secondary, color: "bg-blue-500/10 text-blue-300 border-blue-500/20" },
              { label: "Long-tail Tags", tags: tags.longtail, color: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" },
            ].map(group => (
              <div key={group.label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{group.label} ({group.tags?.length})</p>
                  <CopyBtn text={(group.tags||[]).join(", ")} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(group.tags||[]).map((tag, i) => (
                    <span key={i} className={`text-xs px-2.5 py-1 rounded-full border ${group.color} cursor-pointer`}
                      onClick={() => navigator.clipboard.writeText(tag)}>{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: Thumbnail Ideas
// ═══════════════════════════════════════════════════════════════════════════

function ThumbnailTab() {
  const { requestGeneration } = useGenerationGate();
  const [videoTitle, setVideoTitle] = useState("");
  const [style, setStyle] = useState("dramatic");
  const [mood, setMood] = useState("exciting");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [concepts, setConcepts] = useState<Array<{ concept: string; colors: string[]; textOverlay: string; mainElement: string; whyItWorks: string; emotion: string }>>([]);
  const abortRef = useRef<AbortController | null>(null);

  const STYLES = ["dramatic", "clean/minimal", "colorful", "dark/moody", "illustrated"];
  const MOODS = ["exciting", "shocking", "curious", "inspiring", "funny", "urgent"];

  async function generate() {
    if (!videoTitle.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController(); abortRef.current = ctrl;
    setLoading(true); setError(""); setConcepts([]);
    try {
      const data = await callAPI("yt-thumbnail", { videoTitle, style, mood }, ctrl.signal);
      setConcepts(data.concepts || []);
    } catch (e: any) { if (e.name !== "AbortError") setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="grid lg:grid-cols-[280px,1fr] gap-6">
      <div className="space-y-4">
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Video Title *</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm transition-colors"
            placeholder="e.g. I quit my job to travel the world" value={videoTitle} onChange={e => setVideoTitle(e.target.value)} />
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-2 block">Visual Style</label>
          <div className="space-y-1.5">
            {STYLES.map(s => (
              <button key={s} onClick={() => setStyle(s)}
                className={`w-full p-2 rounded-lg border text-xs text-left transition-all ${style === s ? "border-red-500 bg-red-500/15 text-red-300" : "border-slate-700 bg-slate-800/50 text-slate-400"}`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-2 block">Mood / Emotion</label>
          <div className="grid grid-cols-2 gap-1.5">
            {MOODS.map(m => (
              <button key={m} onClick={() => setMood(m)}
                className={`p-1.5 rounded-lg border text-xs transition-all ${mood === m ? "border-red-500 bg-red-500/15 text-red-300" : "border-slate-700 bg-slate-800/50 text-slate-400"}`}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={() => requestGeneration(generate)} disabled={!videoTitle.trim() || loading}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl disabled:opacity-40">
          {loading ? <><Loader2 size={15} className="animate-spin mr-2" />Creating...</> : <><Palette size={15} className="mr-2" />Generate Ideas</>}
        </Button>
      </div>
      <div>
        {!concepts.length && !loading && !error && <EmptyBox icon={Image} title="3 Thumbnail Concepts" desc="Detailed visual directions with colors, layout, text overlay, and reasoning" />}
        {loading && <LoadingBox label="Designing thumbnail concepts…" />}
        {error && <ErrorBox msg={error} onRetry={() => requestGeneration(generate)} />}
        {concepts.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-white font-semibold text-sm">{concepts.length} Thumbnail Concepts</p>
              <button onClick={() => requestGeneration(generate)} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg"><RefreshCw size={11} /> New ideas</button>
            </div>
            {concepts.map((c, i) => (
              <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3 flex items-center justify-between border-b border-slate-700">
                  <span className="text-white font-semibold text-sm">Concept {i + 1}</span>
                  <span className="text-xs bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2 py-0.5 rounded-full">{c.emotion}</span>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wider">Layout & Concept</p>
                    <p className="text-white text-sm">{c.concept}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-slate-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">Color Palette</p>
                      <div className="flex items-center gap-2">
                        {c.colors?.map((col, ci) => (
                          <div key={ci} className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-md border border-white/10 shrink-0" style={{ backgroundColor: col.startsWith("#") ? col : "#555" }} />
                            <span className="text-slate-300 text-xs">{col}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">Main Element</p>
                      <p className="text-slate-300 text-xs">{c.mainElement}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wider">Text Overlay</p>
                    <div className="bg-slate-900 rounded-lg px-3 py-2 inline-block">
                      <p className="text-white text-sm font-bold">{c.textOverlay}</p>
                    </div>
                  </div>
                  <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-lg p-2.5">
                    <p className="text-emerald-400 text-xs font-semibold mb-0.5">💡 Why It Works</p>
                    <p className="text-slate-300 text-xs">{c.whyItWorks}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: Channel Audit
// ═══════════════════════════════════════════════════════════════════════════

function AuditTab() {
  const { requestGeneration } = useGenerationGate();
  const [channelName, setChannelName] = useState("");
  const [niche, setNiche] = useState("");
  const [subscribers, setSubscribers] = useState("");
  const [avgViews, setAvgViews] = useState("");
  const [frequency, setFrequency] = useState("weekly");
  const [age, setAge] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [audit, setAudit] = useState<{ strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[]; actionPlan: Array<{ step: number; action: string; impact: string }> } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const FREQS = ["daily", "2-3x/week", "weekly", "bi-weekly", "monthly"];

  async function generate() {
    if (!niche.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController(); abortRef.current = ctrl;
    setLoading(true); setError(""); setAudit(null);
    try {
      const data = await callAPI("yt-audit", { channelName, niche, subscribers, avgViews, frequency, age }, ctrl.signal);
      setAudit(data.audit || null);
    } catch (e: any) { if (e.name !== "AbortError") setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="grid lg:grid-cols-[280px,1fr] gap-6">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-slate-300 text-xs font-medium mb-1.5 block">Channel Name</label>
            <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm transition-colors"
              placeholder="@channel" value={channelName} onChange={e => setChannelName(e.target.value)} />
          </div>
          <div>
            <label className="text-slate-300 text-xs font-medium mb-1.5 block">Channel Age</label>
            <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm transition-colors"
              placeholder="e.g. 2 years" value={age} onChange={e => setAge(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Niche / Content Type *</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm transition-colors"
            placeholder="e.g. Personal Finance, Gaming, Cooking" value={niche} onChange={e => setNiche(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-slate-300 text-xs font-medium mb-1.5 block">Subscribers</label>
            <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm transition-colors"
              placeholder="e.g. 5000" value={subscribers} onChange={e => setSubscribers(e.target.value)} />
          </div>
          <div>
            <label className="text-slate-300 text-xs font-medium mb-1.5 block">Avg Views</label>
            <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm transition-colors"
              placeholder="e.g. 2000" value={avgViews} onChange={e => setAvgViews(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-2 block">Upload Frequency</label>
          <div className="space-y-1.5">
            {FREQS.map(f => (
              <button key={f} onClick={() => setFrequency(f)}
                className={`w-full p-2 rounded-lg border text-xs text-left transition-all ${frequency === f ? "border-red-500 bg-red-500/15 text-red-300" : "border-slate-700 bg-slate-800/50 text-slate-400"}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={() => requestGeneration(generate)} disabled={!niche.trim() || loading}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl disabled:opacity-40">
          {loading ? <><Loader2 size={15} className="animate-spin mr-2" />Auditing...</> : <><BarChart2 size={15} className="mr-2" />Audit My Channel</>}
        </Button>
      </div>
      <div>
        {!audit && !loading && !error && <EmptyBox icon={BarChart2} title="Complete Channel Audit" desc="SWOT analysis + 5-step growth action plan tailored to your channel's situation" />}
        {loading && <LoadingBox label="Analyzing your channel performance…" />}
        {error && <ErrorBox msg={error} onRetry={() => requestGeneration(generate)} />}
        {audit && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "strengths",     label: "✅ Strengths",     color: "border-emerald-500/30 bg-emerald-500/8", pill: "text-emerald-400" },
                { key: "weaknesses",    label: "⚠️ Weaknesses",    color: "border-amber-500/30 bg-amber-500/8",   pill: "text-amber-400" },
                { key: "opportunities", label: "🚀 Opportunities", color: "border-blue-500/30 bg-blue-500/8",     pill: "text-blue-400" },
                { key: "threats",       label: "🛡️ Threats",       color: "border-red-500/30 bg-red-500/8",       pill: "text-red-400" },
              ].map(q => (
                <div key={q.key} className={`border rounded-xl p-3.5 ${q.color}`}>
                  <p className={`text-xs font-semibold mb-2 ${q.pill}`}>{q.label}</p>
                  <ul className="space-y-1.5">
                    {((audit as any)[q.key] || []).map((item: string, i: number) => (
                      <li key={i} className="text-slate-300 text-xs flex items-start gap-1.5"><span className="text-slate-500 mt-0.5">•</span>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {audit.actionPlan?.length > 0 && (
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                <p className="text-white font-semibold text-sm mb-3">🎯 5-Step Growth Action Plan</p>
                <div className="space-y-3">
                  {audit.actionPlan.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{step.step || i + 1}</div>
                      <div>
                        <p className="text-white text-sm font-medium">{step.action}</p>
                        <p className="text-emerald-400 text-xs mt-0.5">Impact: {step.impact}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: Best Time to Post
// ═══════════════════════════════════════════════════════════════════════════

function BestTimeTab() {
  const { requestGeneration } = useGenerationGate();
  const [niche, setNiche] = useState("");
  const [audience, setAudience] = useState("");
  const [timezone, setTimezone] = useState("EST");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ bestTimes: Array<{ day: string; time: string; timezone: string; reason: string; score: number }>; generalTips: string[] } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const TZS = ["EST", "PST", "CST", "GMT", "IST", "AEST", "CET"];

  async function generate() {
    if (!niche.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController(); abortRef.current = ctrl;
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await callAPI("yt-besttime", { niche, audience, timezone }, ctrl.signal);
      setResult(data);
    } catch (e: any) { if (e.name !== "AbortError") setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="grid lg:grid-cols-[280px,1fr] gap-6">
      <div className="space-y-4">
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Channel Niche *</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm transition-colors"
            placeholder="e.g. Gaming, Cooking, Personal Finance" value={niche} onChange={e => setNiche(e.target.value)} />
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Target Audience</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm transition-colors"
            placeholder="e.g. College students, working professionals" value={audience} onChange={e => setAudience(e.target.value)} />
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-2 block">Timezone</label>
          <div className="grid grid-cols-4 gap-1.5">
            {TZS.map(tz => (
              <button key={tz} onClick={() => setTimezone(tz)}
                className={`p-1.5 rounded-lg border text-xs transition-all ${timezone === tz ? "border-red-500 bg-red-500/15 text-red-300" : "border-slate-700 bg-slate-800/50 text-slate-400"}`}>
                {tz}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={() => requestGeneration(generate)} disabled={!niche.trim() || loading}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl disabled:opacity-40">
          {loading ? <><Loader2 size={15} className="animate-spin mr-2" />Analyzing...</> : <><Clock size={15} className="mr-2" />Find Best Times</>}
        </Button>
      </div>
      <div>
        {!result && !loading && !error && <EmptyBox icon={Clock} title="Optimal Publishing Schedule" desc="Get the exact days and times when your target audience is most active on YouTube" />}
        {loading && <LoadingBox label="Analyzing audience behavior patterns…" />}
        {error && <ErrorBox msg={error} onRetry={() => requestGeneration(generate)} />}
        {result && (
          <div className="space-y-4">
            <p className="text-white font-semibold text-sm mb-1">Top {result.bestTimes?.length} Publishing Windows</p>
            <div className="space-y-3">
              {result.bestTimes?.map((bt, i) => (
                <div key={i} className={`border rounded-xl p-4 ${i === 0 ? "border-red-500/40 bg-red-500/8" : "border-slate-700/50 bg-slate-800/60"}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {i === 0 && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">BEST</span>}
                      <div>
                        <p className="text-white font-semibold text-sm">{bt.day}</p>
                        <p className="text-red-400 text-lg font-bold">{bt.time} {bt.timezone || timezone}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-slate-400">Audience Score</span>
                      <div className="flex items-center gap-1.5">
                        {[1,2,3,4,5].map(s => (
                          <div key={s} className={`w-2 h-2 rounded-full ${s <= Math.round(bt.score / 20) ? "bg-red-500" : "bg-slate-700"}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-400 text-xs">{bt.reason}</p>
                </div>
              ))}
            </div>
            {result.generalTips?.length > 0 && (
              <div className="bg-teal-500/8 border border-teal-500/20 rounded-xl p-4">
                <p className="text-teal-400 text-xs font-semibold mb-2">📅 General Posting Tips</p>
                <ul className="space-y-1.5">
                  {result.generalTips.map((tip, i) => (
                    <li key={i} className="text-slate-300 text-xs flex items-start gap-1.5"><span className="text-teal-400 mt-0.5">→</span>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: Trend Finder
// ═══════════════════════════════════════════════════════════════════════════

function TrendsTab() {
  const { requestGeneration } = useGenerationGate();
  const [niche, setNiche] = useState("");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trends, setTrends] = useState<Array<{ topic: string; momentum: string; why: string; videoAngle: string; urgency: string }>>([]);
  const abortRef = useRef<AbortController | null>(null);

  async function generate() {
    if (!niche.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController(); abortRef.current = ctrl;
    setLoading(true); setError(""); setTrends([]);
    try {
      const data = await callAPI("yt-trends", { niche, keywords }, ctrl.signal);
      setTrends(data.trends || []);
    } catch (e: any) { if (e.name !== "AbortError") setError(e.message); }
    finally { setLoading(false); }
  }

  const momentumColor = (m: string) => m === "Exploding" ? "text-red-400 border-red-500/40 bg-red-500/10" : m === "Rising" ? "text-amber-400 border-amber-500/40 bg-amber-500/10" : "text-blue-400 border-blue-500/40 bg-blue-500/10";

  return (
    <div className="grid lg:grid-cols-[280px,1fr] gap-6">
      <div className="space-y-4">
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Your Niche *</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm transition-colors"
            placeholder="e.g. AI & Technology, Fitness, Entrepreneurship" value={niche} onChange={e => setNiche(e.target.value)} />
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Focus Keywords (optional)</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm transition-colors"
            placeholder="e.g. ChatGPT, automation, side hustle" value={keywords} onChange={e => setKeywords(e.target.value)} />
        </div>
        <Button onClick={() => requestGeneration(generate)} disabled={!niche.trim() || loading}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl disabled:opacity-40">
          {loading ? <><Loader2 size={15} className="animate-spin mr-2" />Scanning...</> : <><TrendingUp size={15} className="mr-2" />Find Trending Topics</>}
        </Button>
      </div>
      <div>
        {!trends.length && !loading && !error && <EmptyBox icon={TrendingUp} title="Live Trend Intelligence" desc="Spot trending topics before they peak so you can create content at the perfect moment" />}
        {loading && <LoadingBox label="Scanning trending topics in your niche…" />}
        {error && <ErrorBox msg={error} onRetry={() => requestGeneration(generate)} />}
        {trends.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-white font-semibold text-sm">{trends.length} Trending Topics</p>
              <button onClick={() => requestGeneration(generate)} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg"><RefreshCw size={11} /> Refresh</button>
            </div>
            {trends.map((t, i) => (
              <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-white font-semibold text-sm leading-snug">{t.topic}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${momentumColor(t.momentum)}`}>{t.momentum}</span>
                    {t.urgency && <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded-full">{t.urgency}</span>}
                  </div>
                </div>
                <p className="text-slate-400 text-xs mb-2">{t.why}</p>
                <div className="bg-red-500/8 border border-red-500/20 rounded-lg p-2.5">
                  <span className="text-red-400 text-xs font-semibold">Video Angle: </span>
                  <span className="text-slate-300 text-xs">{t.videoAngle}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: Competitor Intel
// ═══════════════════════════════════════════════════════════════════════════

function CompetitorTab() {
  const { requestGeneration } = useGenerationGate();
  const [channelDesc, setChannelDesc] = useState("");
  const [niche, setNiche] = useState("");
  const [myChannel, setMyChannel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [intel, setIntel] = useState<{ whatTheyDoWell: string[]; contentGaps: string[]; howToDifferentiate: string[]; topicsToCover: Array<{ topic: string; reason: string }>; growthAngle: string } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function generate() {
    if (!channelDesc.trim() || !niche.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController(); abortRef.current = ctrl;
    setLoading(true); setError(""); setIntel(null);
    try {
      const data = await callAPI("yt-competitor", { channelDesc, niche, myChannel }, ctrl.signal);
      setIntel(data.intel || null);
    } catch (e: any) { if (e.name !== "AbortError") setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="grid lg:grid-cols-[300px,1fr] gap-6">
      <div className="space-y-4">
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Describe the Competitor *</label>
          <textarea rows={3} className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm resize-none transition-colors"
            placeholder="e.g. A finance channel with 500k subs, posts 2x/week about stock investing and ETFs, very data-heavy content style" value={channelDesc} onChange={e => setChannelDesc(e.target.value)} />
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Niche *</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm transition-colors"
            placeholder="e.g. Personal Finance, Gaming" value={niche} onChange={e => setNiche(e.target.value)} />
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Your Channel (optional)</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm transition-colors"
            placeholder="Brief description of your channel" value={myChannel} onChange={e => setMyChannel(e.target.value)} />
        </div>
        <Button onClick={() => requestGeneration(generate)} disabled={!channelDesc.trim() || !niche.trim() || loading}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl disabled:opacity-40">
          {loading ? <><Loader2 size={15} className="animate-spin mr-2" />Analyzing...</> : <><Users size={15} className="mr-2" />Analyze Competitor</>}
        </Button>
      </div>
      <div>
        {!intel && !loading && !error && <EmptyBox icon={Users} title="Competitor Intelligence Report" desc="Discover what competitors do well, what gaps exist, and how to differentiate yourself" />}
        {loading && <LoadingBox label="Building competitor intelligence report…" />}
        {error && <ErrorBox msg={error} onRetry={() => requestGeneration(generate)} />}
        {intel && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {[
                { key: "whatTheyDoWell", label: "✅ What They Do Well", color: "border-emerald-500/30 bg-emerald-500/8 text-emerald-400" },
                { key: "contentGaps", label: "🕳️ Content Gaps You Can Fill", color: "border-blue-500/30 bg-blue-500/8 text-blue-400" },
                { key: "howToDifferentiate", label: "🎯 How to Differentiate Yourself", color: "border-purple-500/30 bg-purple-500/8 text-purple-400" },
              ].map(s => (
                <div key={s.key} className={`border rounded-xl p-4 ${s.color.split(" ").slice(0,2).join(" ")}`}>
                  <p className={`text-xs font-semibold mb-2 ${s.color.split(" ")[2]}`}>{s.label}</p>
                  <ul className="space-y-1.5">
                    {((intel as any)[s.key] || []).map((item: string, i: number) => (
                      <li key={i} className="text-slate-300 text-xs flex items-start gap-2"><span className="text-slate-500 mt-0.5 shrink-0">•</span>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {intel.topicsToCover?.length > 0 && (
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                <p className="text-white font-semibold text-sm mb-3">📌 Specific Topics to Cover</p>
                <div className="space-y-2">
                  {intel.topicsToCover.map((t, i) => (
                    <div key={i} className="flex items-start gap-2 bg-slate-700/40 rounded-lg p-2.5">
                      <ChevronRight size={13} className="text-red-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-white text-xs font-medium">{t.topic}</p>
                        <p className="text-slate-400 text-xs mt-0.5">{t.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {intel.growthAngle && (
              <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-4">
                <p className="text-red-400 text-xs font-semibold mb-1">🚀 Your Growth Angle</p>
                <p className="text-white text-sm">{intel.growthAngle}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: AI Coach (streaming chat)
// ═══════════════════════════════════════════════════════════════════════════

interface ChatMsg { role: "user" | "assistant"; content: string }

function CoachTab() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: "Hey! I'm your YouTube AI Coach 🎬\n\nI'm trained on YouTube growth strategies, algorithm insights, and creator best practices. Ask me anything about:\n\n• Growing your channel faster\n• Improving your titles & thumbnails\n• Understanding the YouTube algorithm\n• Niche selection & content strategy\n• Monetization & brand deals\n• Audience retention & engagement\n\nWhat would you like to work on today?" }
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { requestGeneration } = useGenerationGate();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    const newMessages: ChatMsg[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setStreaming(true);

    abortRef.current?.abort();
    const ctrl = new AbortController(); abortRef.current = ctrl;

    let assistantContent = "";
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch(`${BASE_URL}ai/yt-coach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(await res.text());
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No stream");
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const raw = line.slice(6).trim();
            if (raw === "[DONE]") break;
            try {
              const parsed = JSON.parse(raw);
              const delta = parsed.choices?.[0]?.delta?.content || "";
              assistantContent += delta;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                return updated;
              });
            } catch {}
          }
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: "Sorry, I ran into an error. Please try again." };
          return updated;
        });
      }
    } finally { setStreaming(false); }
  }

  const QUICK = [
    "How do I grow from 0 to 1,000 subscribers?",
    "What makes a thumbnail get clicks?",
    "How does the YouTube algorithm work?",
    "What's the best upload schedule?",
    "How do I improve audience retention?",
  ];

  return (
    <div className="flex flex-col h-[560px]">
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 mt-2 mb-4">
            {QUICK.map(q => (
              <button key={q} onClick={() => { setInput(q); }}
                className="text-xs bg-slate-800 border border-slate-700 text-slate-300 hover:border-red-500/50 hover:text-white px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1">
                <ArrowRight size={10} className="text-red-400" />{q}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${m.role === "user" ? "bg-red-600 text-white" : "bg-slate-800 border border-slate-700 text-slate-200"}`}>
              {m.role === "assistant" && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center"><Bot size={9} className="text-white" /></div>
                  <span className="text-red-400 text-[10px] font-semibold uppercase tracking-wider">YT Growstuffs Coach</span>
                </div>
              )}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}{streaming && i === messages.length - 1 && m.role === "assistant" && <span className="inline-block w-0.5 h-4 bg-red-400 animate-pulse ml-0.5 align-middle" />}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-end gap-2 bg-slate-800/60 border border-slate-700 rounded-2xl p-3">
        <textarea
          rows={1}
          className="flex-1 bg-transparent text-white text-sm placeholder-slate-500 focus:outline-none resize-none leading-relaxed"
          placeholder="Ask anything about growing your YouTube channel…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); requestGeneration(sendMessage); } }}
          style={{ maxHeight: "120px", overflowY: "auto" }}
        />
        <button onClick={() => requestGeneration(sendMessage)} disabled={!input.trim() || streaming}
          className="w-9 h-9 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 flex items-center justify-center shrink-0 transition-colors">
          <Send size={15} className="text-white" />
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SECTION
// ═══════════════════════════════════════════════════════════════════════════

export default function YTGrowstuffsSection() {
  const [activeTab, setActiveTab] = useState<TabId>("ideas");
  const tabBarRef = useRef<HTMLDivElement>(null);

  const tabComponents: Record<TabId, React.ReactNode> = {
    ideas:       <IdeasTab />,
    titles:      <TitlesTab />,
    script:      <ScriptTab />,
    description: <DescriptionTab />,
    keywords:    <KeywordsTab />,
    tags:        <TagsTab />,
    thumbnail:   <ThumbnailTab />,
    audit:       <AuditTab />,
    besttime:    <BestTimeTab />,
    trends:      <TrendsTab />,
    competitor:  <CompetitorTab />,
    coach:       <CoachTab />,
  };

  return (
    <section id="yt-growstuffs" className="py-20 px-4 bg-gradient-to-b from-[#0a0a1a] via-[#0f0005] to-[#0a0a1a] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/25 rounded-full px-4 py-1.5 mb-4">
            <Youtube size={14} className="text-red-400" fill="currentColor" />
            <span className="text-red-300 text-sm font-semibold">Special Feature</span>
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">NEW</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-3">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-orange-500">YT Growstuffs</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Your all-in-one YouTube growth engine. 12 AI-powered tools to grow your channel faster — from idea to viral.
          </p>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><Zap size={13} className="text-red-400" /> 12 Growth Tools</span>
            <span className="flex items-center gap-1.5"><Bot size={13} className="text-red-400" /> AI Coach Included</span>
            <span className="flex items-center gap-1.5"><Star size={13} className="text-red-400" /> 100% Free</span>
          </div>
        </div>

        {/* Main card */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl shadow-red-500/5">

          {/* Tab bar */}
          <div ref={tabBarRef} className="flex overflow-x-auto gap-0 border-b border-slate-800 bg-slate-950/50 scrollbar-hide">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-3.5 text-xs font-medium whitespace-nowrap transition-all border-b-2 shrink-0 ${
                    isActive
                      ? "border-red-500 text-white bg-red-500/5"
                      : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/3"
                  }`}
                >
                  <Icon size={13} className={isActive ? "text-red-400" : ""} />
                  {tab.label}
                  {tab.badge && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? "bg-red-500 text-white" : "bg-slate-800 text-slate-400"}`}>{tab.badge}</span>}
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
      </div>
    </section>
  );
}
