import { useState, useRef, useEffect } from "react";
import { useGenerationGate } from "@/components/GenerationGate";
import { motion, AnimatePresence } from "framer-motion";
import {
  Youtube, Bot, Loader2, Copy, Check, RefreshCw, Sparkles,
  AlertCircle, Send, ArrowRight, Zap, Star, ChevronRight,
  Smartphone, TrendingUp, Share2, ShoppingBag, BookOpen,
  HelpCircle, Gift, Crown, Map, Calendar, Users,
  Play, Video, Instagram, Layers, Heart, Trophy,
  Target, MessageSquare, Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "") + "/__api/";

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "roadmap", icon: Map,          label: "Growth Roadmap",   color: "text-red-400",     badge: "🗺️"  },
  { id: "shorts",  icon: Smartphone,   label: "Shorts Planner",   color: "text-pink-400",    badge: "📱"  },
  { id: "ladder",  icon: TrendingUp,   label: "Video Ladder",     color: "text-orange-400",  badge: "📈"  },
  { id: "social",  icon: Share2,       label: "Social Blast",     color: "text-blue-400",    badge: "📢"  },
  { id: "launch",  icon: ShoppingBag,  label: "Product Launch",   color: "text-emerald-400", badge: "🛍️"  },
  { id: "stories", icon: Instagram,    label: "Stories Calendar", color: "text-purple-400",  badge: "📖"  },
  { id: "quiz",    icon: HelpCircle,   label: "Quiz Builder",     color: "text-yellow-400",  badge: "🎯"  },
  { id: "freebie", icon: Gift,         label: "Freebie Funnel",   color: "text-teal-400",    badge: "🎁"  },
  { id: "perks",   icon: Crown,        label: "Perks & Scale",    color: "text-amber-400",   badge: "💎"  },
  { id: "coach",   icon: Bot,          label: "Growth Coach",     color: "text-rose-400",    badge: "AI"  },
] as const;

type TabId = typeof TABS[number]["id"];

// ── Shared helpers ─────────────────────────────────────────────────────────────

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
// TAB 0: Growth Roadmap (Static visual guide)
// ═══════════════════════════════════════════════════════════════════════════

const PHASES = [
  {
    num: 1,
    emoji: "📱",
    name: "Shorts First",
    timing: "Weeks 1–4",
    color: "from-pink-600/20 to-pink-500/10 border-pink-500/30",
    badge: "bg-pink-500",
    tabId: "shorts" as TabId,
    desc: "Start with simple, focused 30–60s YouTube Shorts on one basic concept per day. No complicated edits — just clear value and a punchy hook. The algorithm rewards consistency more than perfection at this stage.",
    actions: ["Post 1 Short/day on the same basic concept", "Use the same background, style, and format", "End every Short with: 'Follow for more [topic] tips'"],
    metric: "Goal: 100 Shorts posted = first 1,000 subscribers",
  },
  {
    num: 2,
    emoji: "🎬",
    name: "Video Ladder",
    timing: "Month 2",
    color: "from-orange-600/20 to-orange-500/10 border-orange-500/30",
    badge: "bg-orange-500",
    tabId: "ladder" as TabId,
    desc: "Scale from Shorts to longer videos. Your first Shorts built an audience expecting basics — now teach them the next level. Go from 60s → 5 min → 10 min → 20 min as your channel grows. Each video should be harder to find elsewhere.",
    actions: ["Map 5 levels of depth in your topic", "Each video starts where the last one ended", "Repurpose long videos back into Shorts clips"],
    metric: "Goal: 5 evergreen videos ranking on YouTube search",
  },
  {
    num: 3,
    emoji: "📢",
    name: "Social Blast",
    timing: "Month 2–3",
    color: "from-blue-600/20 to-blue-500/10 border-blue-500/30",
    badge: "bg-blue-500",
    tabId: "social" as TabId,
    desc: "Every video you post should be turned into 5 pieces of content across platforms. Instagram Reels, LinkedIn articles, Twitter threads, Facebook groups, WhatsApp broadcasts — each platform has a native format that amplifies your reach back to YouTube.",
    actions: ["Convert each video into a Reel (cut to 30s)", "Post the script as a LinkedIn article", "Share in 3 niche Facebook/WhatsApp groups"],
    metric: "Goal: 5x content reach from 1 YouTube video",
  },
  {
    num: 4,
    emoji: "🛍️",
    name: "Product Launch",
    timing: "Month 3",
    color: "from-emerald-600/20 to-emerald-500/10 border-emerald-500/30",
    badge: "bg-emerald-500",
    tabId: "launch" as TabId,
    desc: "Now you have trust — use it. Launch your product or service with a 5-video series that tells the story of the problem, your journey finding the solution, and the transformation. Never lead with 'buy this.' Lead with 'here's the problem I solved — and how.'",
    actions: ["Video 1: Tell your problem story (no product mention)", "Video 3: Reveal your solution + how it works", "Video 5: Show real results from beta users"],
    metric: "Goal: Pre-launch waitlist of 500+ people",
  },
  {
    num: 5,
    emoji: "📖",
    name: "Story Selling",
    timing: "Month 3–4",
    color: "from-purple-600/20 to-purple-500/10 border-purple-500/30",
    badge: "bg-purple-500",
    tabId: "stories" as TabId,
    desc: "Stories are the most intimate format — your audience sees your face, your workspace, your day. 5-7 stories per day on Instagram + YouTube Community posts builds a relationship that videos alone can't. Mix education, behind-the-scenes, and product moments.",
    actions: ["Behind-the-scenes 3x/week (show your process)", "Educational quick tip 2x/week", "1 product story per week (subtle, value-first)"],
    metric: "Goal: 10k story views/week consistently",
  },
  {
    num: 6,
    emoji: "🎯",
    name: "Quiz & Polls",
    timing: "Month 4",
    color: "from-yellow-600/20 to-yellow-500/10 border-yellow-500/30",
    badge: "bg-yellow-500",
    tabId: "quiz" as TabId,
    desc: "Quiz videos are the secret algorithm hack — they generate 5–8x more comments than regular videos because everyone wants to prove they're smart. 'I bet you can't get 10/10' in the title triggers action. Comments tell YouTube your content is must-watch.",
    actions: ["Post 1 quiz video per week ('Did you know?' or 'Test yourself')", "End with: 'Comment your score — I'll reply to everyone'", "Create Community polls 3x/week to boost algorithm signals"],
    metric: "Goal: 100+ comments on every quiz video",
  },
  {
    num: 7,
    emoji: "🎁",
    name: "Freebie Funnel",
    timing: "Month 4–5",
    color: "from-teal-600/20 to-teal-500/10 border-teal-500/30",
    badge: "bg-teal-500",
    tabId: "freebie" as TabId,
    desc: "Give away something so valuable that people feel guilty not buying from you. A free checklist, template, mini-course, or tool related to your niche — promoted in your video description and pinned comment — builds your email list while YouTube grows your audience. Email is the platform you own.",
    actions: ["Create 1 freebie worth ₹999/$15+ in value (give it free)", "Promote in video description + pinned comment + end screen", "Nurture email list with 3-email welcome sequence"],
    metric: "Goal: 2,000+ email subscribers before product launch",
  },
  {
    num: 8,
    emoji: "💎",
    name: "Perks & Scale",
    timing: "Month 5+",
    color: "from-amber-600/20 to-amber-500/10 border-amber-500/30",
    badge: "bg-amber-500",
    tabId: "perks" as TabId,
    desc: "Once you have an audience that trusts you, create exclusive layers. Channel memberships, private communities, early access content, monthly live Q&As — these turn casual viewers into paying superfans. Your top 100 superfans will do more for your channel than any algorithm.",
    actions: ["Launch YouTube membership with 2-3 tiers", "Create a private Discord/WhatsApp group for paying members", "Host monthly live streams for community + product updates"],
    metric: "Goal: 100 paying members = ₹30,000–₹1L/month recurring",
  },
];

function RoadmapTab({ onJumpTo }: { onJumpTo: (tab: TabId) => void }) {
  return (
    <div className="space-y-4">
      <div className="bg-red-500/8 border border-red-500/20 rounded-2xl px-5 py-4">
        <p className="text-white font-semibold text-sm mb-1">🧠 The YT Growstuffs Growth Philosophy</p>
        <p className="text-slate-300 text-xs leading-relaxed">
          Based on VidIQ, Think Media, and top digital marketing coaches: <strong className="text-white">start with Shorts, scale complexity, blast across social, launch your product through storytelling, then build a community that buys anything you recommend.</strong> Use each AI tool below to execute every phase step-by-step.
        </p>
      </div>
      <div className="space-y-3">
        {PHASES.map((phase, i) => (
          <div key={phase.num} className={`bg-gradient-to-r ${phase.color} border rounded-2xl p-5`}>
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <div className={`w-10 h-10 rounded-xl ${phase.badge} flex items-center justify-center text-xl`}>
                  {phase.emoji}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-white font-bold text-sm">Phase {phase.num}: {phase.name}</span>
                  <span className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded-full">{phase.timing}</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed mb-3">{phase.desc}</p>
                <div className="space-y-1 mb-3">
                  {phase.actions.map((a, j) => (
                    <p key={j} className="text-slate-400 text-xs flex items-start gap-1.5">
                      <span className="text-slate-500 shrink-0 mt-0.5">→</span>{a}
                    </p>
                  ))}
                </div>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs text-slate-500 italic">{phase.metric}</span>
                  <button
                    onClick={() => onJumpTo(phase.tabId)}
                    className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 text-white border border-white/15 px-3 py-1.5 rounded-full transition-all"
                  >
                    Open AI Tool <ArrowRight size={10} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 text-center">
        <p className="text-slate-400 text-xs">
          📊 <strong className="text-white">VidIQ-style insight:</strong> Channels that follow a structured phase-based growth system grow 4.3x faster than those posting randomly. Consistency + strategy beats raw talent every time.
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 1: Shorts Planner
// ═══════════════════════════════════════════════════════════════════════════

function ShortsTab() {
  const { requestGeneration } = useGenerationGate();
  const [niche, setNiche] = useState("");
  const [product, setProduct] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const [week, setWeek] = useState<"week1"|"week2"|"week3"|"week4">("week1");
  const abortRef = useRef<AbortController | null>(null);

  async function generate() {
    if (!niche.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController(); abortRef.current = ctrl;
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await callAPI("yt-shorts-plan", { niche, product, goal }, ctrl.signal);
      setResult(data); setWeek("week1");
    } catch (e: any) { if (e.name !== "AbortError") setError(e.message); }
    finally { setLoading(false); }
  }

  const weekData = result?.[week] || [];
  const WEEKS: { id: "week1"|"week2"|"week3"|"week4"; label: string }[] = [
    { id: "week1", label: "Week 1 — Basics" },
    { id: "week2", label: "Week 2 — Build" },
    { id: "week3", label: "Week 3 — Social Proof" },
    { id: "week4", label: "Week 4 — Product Tease" },
  ];

  return (
    <div className="grid lg:grid-cols-[300px,1fr] gap-6">
      <div className="space-y-4">
        <div className="bg-pink-500/8 border border-pink-500/20 rounded-xl p-3">
          <p className="text-pink-300 text-xs font-semibold mb-1">📱 Phase 1 Strategy</p>
          <p className="text-slate-400 text-xs">Start with the most basic concept in your niche. Post daily. Scale complexity each week. One concept = one Short. Never try to teach 3 things at once.</p>
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Your Niche *</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm"
            placeholder="e.g. Personal Finance India, AI Tools, Fitness" value={niche} onChange={e => setNiche(e.target.value)} />
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Product/Service (optional)</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm"
            placeholder="e.g. SaaS tool, Online course, Consulting" value={product} onChange={e => setProduct(e.target.value)} />
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">30-Day Goal</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm"
            placeholder="e.g. 1000 subscribers, product launch, brand awareness" value={goal} onChange={e => setGoal(e.target.value)} />
        </div>
        <Button onClick={() => requestGeneration(generate)} disabled={!niche.trim() || loading}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl disabled:opacity-40">
          {loading ? <><Loader2 size={15} className="animate-spin mr-2" />Building Calendar…</> : <><Smartphone size={15} className="mr-2" />Generate 30-Day Plan</>}
        </Button>
      </div>
      <div>
        {!result && !loading && !error && <EmptyBox icon={Smartphone} title="30-Day Shorts Calendar" desc="Get a complete daily posting plan that starts simple and scales up — based on proven YouTube Shorts strategy" />}
        {loading && <LoadingBox label="Building your 30-day Shorts growth plan…" />}
        {error && <ErrorBox msg={error} onRetry={() => requestGeneration(generate)} />}
        {result && (
          <div className="space-y-4">
            <div className="bg-pink-500/8 border border-pink-500/20 rounded-xl p-3.5">
              <p className="text-pink-300 text-xs font-semibold mb-1">Strategy Overview</p>
              <p className="text-slate-300 text-xs">{result.strategy}</p>
              {result.posting && <p className="text-slate-400 text-xs mt-2">⏰ {result.posting}</p>}
            </div>
            <div className="flex gap-2 flex-wrap">
              {WEEKS.map(w => (
                <button key={w.id} onClick={() => setWeek(w.id)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${week === w.id ? "bg-red-500 border-red-400 text-white" : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"}`}>
                  {w.label}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {weekData.map((item: any, i: number) => (
                <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold flex items-center justify-center shrink-0">D{item.day}</span>
                      <p className="text-white text-sm font-semibold">{item.concept}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{item.duration}</span>
                      <CopyBtn text={`Day ${item.day}: ${item.concept}\nHook: ${item.hook}\nAngle: ${item.angle}\nCTA: ${item.cta}`} />
                    </div>
                  </div>
                  {item.hook && <p className="text-pink-300 text-xs italic ml-8">Hook: "{item.hook}"</p>}
                  {item.angle && <p className="text-slate-400 text-xs ml-8 mt-0.5">Angle: {item.angle}</p>}
                  {item.cta && <p className="text-emerald-400 text-xs ml-8 mt-0.5">CTA: {item.cta}</p>}
                </div>
              ))}
            </div>
            {result.tips?.length > 0 && (
              <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-3.5">
                <p className="text-white text-xs font-semibold mb-2">💡 Shorts Growth Tips</p>
                <ul className="space-y-1.5">
                  {result.tips.map((t: string, i: number) => (
                    <li key={i} className="text-slate-300 text-xs flex items-start gap-1.5"><span className="text-pink-400">→</span>{t}</li>
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
// TAB 2: Video Ladder
// ═══════════════════════════════════════════════════════════════════════════

function LadderTab() {
  const { requestGeneration } = useGenerationGate();
  const [niche, setNiche] = useState("");
  const [product, setProduct] = useState("");
  const [stage, setStage] = useState("just starting");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const abortRef = useRef<AbortController | null>(null);

  const STAGES = ["just starting", "under 100 subs", "100–1k subs", "1k–10k subs", "10k+ subs"];

  async function generate() {
    if (!niche.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController(); abortRef.current = ctrl;
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await callAPI("yt-video-ladder", { niche, product, currentStage: stage }, ctrl.signal);
      setResult(data);
    } catch (e: any) { if (e.name !== "AbortError") setError(e.message); }
    finally { setLoading(false); }
  }

  const STAGE_COLORS = ["bg-slate-500","bg-orange-500","bg-yellow-500","bg-blue-500","bg-red-500"];

  return (
    <div className="grid lg:grid-cols-[280px,1fr] gap-6">
      <div className="space-y-4">
        <div className="bg-orange-500/8 border border-orange-500/20 rounded-xl p-3">
          <p className="text-orange-300 text-xs font-semibold mb-1">📈 Phase 2 Strategy</p>
          <p className="text-slate-400 text-xs">Map your content from the most basic "what is X" all the way to "advanced X for professionals." Each video brings viewers to the next level — and closer to your product.</p>
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Your Niche *</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm"
            placeholder="e.g. Dropshipping, Yoga for Beginners, SaaS Marketing" value={niche} onChange={e => setNiche(e.target.value)} />
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Product/Service</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm"
            placeholder="e.g. Dropshipping course, Yoga membership, SaaS tool" value={product} onChange={e => setProduct(e.target.value)} />
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-2 block">Current Stage</label>
          <div className="space-y-1">
            {STAGES.map(s => (
              <button key={s} onClick={() => setStage(s)}
                className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-all ${stage === s ? "border-red-500 bg-red-500/15 text-red-300" : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={() => requestGeneration(generate)} disabled={!niche.trim() || loading}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl disabled:opacity-40">
          {loading ? <><Loader2 size={15} className="animate-spin mr-2" />Building Ladder…</> : <><TrendingUp size={15} className="mr-2" />Generate Video Ladder</>}
        </Button>
      </div>
      <div>
        {!result && !loading && !error && <EmptyBox icon={TrendingUp} title="Your 5-Stage Content Ladder" desc="Map the journey from total beginner Shorts to expert long-form videos — with specific examples for your niche" />}
        {loading && <LoadingBox label="Mapping your content progression ladder…" />}
        {error && <ErrorBox msg={error} onRetry={() => requestGeneration(generate)} />}
        {result && (
          <div className="space-y-3">
            {(result.ladder || []).map((s: any, i: number) => (
              <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-7 h-7 rounded-full ${STAGE_COLORS[i]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>{s.stage || i+1}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold text-sm">{s.icon} {s.name}</span>
                      <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{s.format}</span>
                      <span className="text-[10px] bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded-full">{s.frequency}</span>
                    </div>
                  </div>
                </div>
                <p className="text-slate-300 text-xs mb-2">{s.goal}</p>
                {s.examples?.length > 0 && (
                  <div className="space-y-1 mb-2">
                    {s.examples.map((ex: string, j: number) => (
                      <div key={j} className="flex items-center justify-between bg-slate-700/40 rounded-lg px-3 py-1.5">
                        <p className="text-slate-300 text-xs">{ex}</p>
                        <CopyBtn text={ex} />
                      </div>
                    ))}
                  </div>
                )}
                {s.trigger && <p className="text-amber-400 text-xs">🏁 Next stage trigger: {s.trigger}</p>}
              </div>
            ))}
            {result.productIntegration && (
              <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-4">
                <p className="text-emerald-400 text-xs font-semibold mb-1">🛍️ Product Integration Strategy</p>
                <p className="text-slate-300 text-xs">{result.productIntegration}</p>
              </div>
            )}
            {result.timelineEstimate && (
              <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-3 text-center">
                <p className="text-slate-400 text-xs">⏱️ Realistic timeline: <span className="text-white font-semibold">{result.timelineEstimate}</span></p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 3: Social Blast
// ═══════════════════════════════════════════════════════════════════════════

function SocialBlastTab() {
  const { requestGeneration } = useGenerationGate();
  const [videoTitle, setVideoTitle] = useState("");
  const [niche, setNiche] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const [platform, setPlatform] = useState("instagram");
  const abortRef = useRef<AbortController | null>(null);

  async function generate() {
    if (!videoTitle.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController(); abortRef.current = ctrl;
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await callAPI("yt-social-blast", { videoTitle, niche }, ctrl.signal);
      setResult(data);
    } catch (e: any) { if (e.name !== "AbortError") setError(e.message); }
    finally { setLoading(false); }
  }

  const PLATFORMS = [
    { id: "instagram", label: "Instagram", emoji: "📸" },
    { id: "linkedin",  label: "LinkedIn",  emoji: "💼" },
    { id: "twitter",   label: "X / Twitter", emoji: "🐦" },
    { id: "facebook",  label: "Facebook",  emoji: "👥" },
    { id: "whatsapp",  label: "WhatsApp",  emoji: "💬" },
  ];

  function renderPlatform() {
    if (!result) return null;
    const p = result[platform];
    if (!p) return <p className="text-slate-400 text-sm">No data for this platform.</p>;
    if (platform === "instagram") return (
      <div className="space-y-3">
        {p.reelHook && <div className="bg-pink-500/8 border border-pink-500/20 rounded-xl p-3"><p className="text-pink-300 text-xs font-semibold mb-1">🎬 Reel Opening Hook (first 3s)</p><p className="text-white text-sm font-semibold">"{p.reelHook}"</p></div>}
        {p.caption && <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3"><div className="flex justify-between items-center mb-1"><p className="text-slate-300 text-xs font-semibold">📝 Caption</p><CopyBtn text={p.caption} /></div><p className="text-slate-300 text-xs whitespace-pre-wrap">{p.caption}</p></div>}
        {p.hashtags?.length > 0 && <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-3"><p className="text-slate-400 text-xs mb-2">#{p.hashtags.join(" #")}</p><CopyBtn text={"#" + p.hashtags.join(" #")} /></div>}
        {p.storySlides?.length > 0 && <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3"><p className="text-slate-300 text-xs font-semibold mb-2">📖 Story Slides</p>{p.storySlides.map((s: string, i: number) => <div key={i} className="bg-slate-700/40 rounded-lg px-3 py-2 mb-1.5"><p className="text-white text-xs">Slide {i+1}: {s}</p></div>)}</div>}
      </div>
    );
    if (platform === "linkedin") return (
      <div className="space-y-3">
        {p.hook && <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-3"><p className="text-blue-300 text-xs font-semibold mb-1">🪝 Opening Hook</p><p className="text-white font-semibold text-sm">"{p.hook}"</p></div>}
        {p.post && <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3"><div className="flex justify-between items-center mb-1"><p className="text-slate-300 text-xs font-semibold">✍️ Post Copy</p><CopyBtn text={p.post} /></div><p className="text-slate-300 text-xs whitespace-pre-wrap">{p.post}</p></div>}
        {p.cta && <p className="text-blue-400 text-xs">CTA: {p.cta}</p>}
      </div>
    );
    if (platform === "twitter") return (
      <div className="space-y-2">
        {(p.thread || []).map((t: string, i: number) => (
          <div key={i} className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 flex items-start justify-between gap-2">
            <div><span className="text-slate-500 text-xs">{i+1}.</span> <p className="text-slate-200 text-sm inline">{t}</p></div>
            <CopyBtn text={t} />
          </div>
        ))}
      </div>
    );
    if (platform === "facebook") return (
      <div className="space-y-3">
        {p.post && <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3"><div className="flex justify-between items-center mb-1"><p className="text-slate-300 text-xs font-semibold">📝 Post</p><CopyBtn text={p.post} /></div><p className="text-slate-300 text-xs">{p.post}</p></div>}
        {p.groupStrategy && <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-3"><p className="text-blue-300 text-xs font-semibold mb-1">👥 Group Strategy</p><p className="text-slate-300 text-xs">{p.groupStrategy}</p></div>}
      </div>
    );
    if (platform === "whatsapp") return (
      <div className="space-y-3">
        {p.broadcastMessage && <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-3"><div className="flex justify-between items-center mb-1"><p className="text-emerald-300 text-xs font-semibold">📢 Broadcast Message</p><CopyBtn text={p.broadcastMessage} /></div><p className="text-slate-300 text-xs">{p.broadcastMessage}</p></div>}
        {p.statusText && <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3"><p className="text-slate-300 text-xs font-semibold mb-1">⏱️ Status Text</p><p className="text-white text-sm font-semibold">{p.statusText}</p></div>}
      </div>
    );
    return null;
  }

  return (
    <div className="grid lg:grid-cols-[280px,1fr] gap-6">
      <div className="space-y-4">
        <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-3">
          <p className="text-blue-300 text-xs font-semibold mb-1">📢 Phase 3 Strategy</p>
          <p className="text-slate-400 text-xs">Each YouTube video becomes 5+ pieces of platform-native content. Different format, different tone, same core message.</p>
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">YouTube Video Title *</label>
          <textarea rows={2} className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm resize-none"
            placeholder="e.g. How I Made ₹1L Online in 30 Days With No Audience" value={videoTitle} onChange={e => setVideoTitle(e.target.value)} />
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Niche</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm"
            placeholder="e.g. Online Income, Fitness, Tech Reviews" value={niche} onChange={e => setNiche(e.target.value)} />
        </div>
        <Button onClick={() => requestGeneration(generate)} disabled={!videoTitle.trim() || loading}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl disabled:opacity-40">
          {loading ? <><Loader2 size={15} className="animate-spin mr-2" />Blasting…</> : <><Share2 size={15} className="mr-2" />Generate All Platforms</>}
        </Button>
        {result?.schedule && (
          <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-3">
            <p className="text-slate-400 text-xs font-semibold mb-1">📅 Posting Order</p>
            <p className="text-slate-300 text-xs">{result.schedule}</p>
          </div>
        )}
      </div>
      <div>
        {!result && !loading && !error && <EmptyBox icon={Share2} title="5-Platform Distribution Plan" desc="Convert one YouTube video into Instagram Reels, LinkedIn posts, Twitter threads, Facebook posts, and WhatsApp broadcasts" />}
        {loading && <LoadingBox label="Creating platform-native content for all channels…" />}
        {error && <ErrorBox msg={error} onRetry={() => requestGeneration(generate)} />}
        {result && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {PLATFORMS.map(p => (
                <button key={p.id} onClick={() => setPlatform(p.id)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${platform === p.id ? "bg-red-500 border-red-400 text-white" : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"}`}>
                  {p.emoji} {p.label}
                </button>
              ))}
            </div>
            {renderPlatform()}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 4: Product Launch
// ═══════════════════════════════════════════════════════════════════════════

function LaunchTab() {
  const { requestGeneration } = useGenerationGate();
  const [productName, setProductName] = useState("");
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [audience, setAudience] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const [openVideo, setOpenVideo] = useState<number|null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function generate() {
    if (!productName.trim() || !problem.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController(); abortRef.current = ctrl;
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await callAPI("yt-product-launch", { productName, problem, solution, audience }, ctrl.signal);
      setResult(data); setOpenVideo(1);
    } catch (e: any) { if (e.name !== "AbortError") setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="grid lg:grid-cols-[300px,1fr] gap-6">
      <div className="space-y-4">
        <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-3">
          <p className="text-emerald-300 text-xs font-semibold mb-1">🛍️ Phase 4 Strategy</p>
          <p className="text-slate-400 text-xs">Never sell first. Tell the story of the problem, then the journey, then the solution. By video 5, people beg to buy. This is the exact framework used by Jeff Walker's Product Launch Formula.</p>
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Product/Service Name *</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm"
            placeholder="e.g. Marketingstuffs Pro, Fitness Blueprint, SaaS Tool" value={productName} onChange={e => setProductName(e.target.value)} />
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Problem it Solves *</label>
          <textarea rows={2} className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm resize-none"
            placeholder="e.g. Small business owners spend 20 hours/week on content and still don't see results" value={problem} onChange={e => setProblem(e.target.value)} />
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">How it Solves It</label>
          <textarea rows={2} className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm resize-none"
            placeholder="e.g. AI writes all their content in minutes, no expertise needed" value={solution} onChange={e => setSolution(e.target.value)} />
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Target Audience</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm"
            placeholder="e.g. Indian small business owners, 25-45, digital beginners" value={audience} onChange={e => setAudience(e.target.value)} />
        </div>
        <Button onClick={() => requestGeneration(generate)} disabled={!productName.trim() || !problem.trim() || loading}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl disabled:opacity-40">
          {loading ? <><Loader2 size={15} className="animate-spin mr-2" />Planning Launch…</> : <><ShoppingBag size={15} className="mr-2" />Generate Launch Series</>}
        </Button>
      </div>
      <div>
        {!result && !loading && !error && <EmptyBox icon={ShoppingBag} title="5-Video Product Launch Series" desc="A complete story-driven launch sequence — problem → journey → solution → proof → sale. Used by top creators worldwide." />}
        {loading && <LoadingBox label="Crafting your product launch video series…" />}
        {error && <ErrorBox msg={error} onRetry={() => requestGeneration(generate)} />}
        {result && (
          <div className="space-y-3">
            {result.problemStatement && (
              <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-3.5">
                <p className="text-emerald-400 text-xs font-semibold mb-1">🎯 Refined Problem Statement (use in ALL videos)</p>
                <p className="text-white text-sm font-semibold">{result.problemStatement}</p>
              </div>
            )}
            {(result.launchSeries || []).map((v: any) => (
              <div key={v.videoNumber} className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
                <button onClick={() => setOpenVideo(openVideo === v.videoNumber ? null : v.videoNumber)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/30 transition-colors text-left">
                  <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold shrink-0">V{v.videoNumber}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold leading-snug">{v.title}</p>
                    <p className="text-slate-400 text-xs">{v.angle}</p>
                  </div>
                  <ChevronRight size={14} className={`text-slate-400 shrink-0 transition-transform ${openVideo === v.videoNumber ? "rotate-90" : ""}`} />
                </button>
                {openVideo === v.videoNumber && (
                  <div className="px-4 pb-4 border-t border-slate-700 pt-3 space-y-3">
                    {v.script_hook && (
                      <div><p className="text-red-400 text-xs font-semibold mb-1">🪝 Opening Hook (first 30s)</p>
                        <div className="bg-slate-700/40 rounded-lg p-3 flex justify-between gap-2">
                          <p className="text-slate-200 text-xs">{v.script_hook}</p>
                          <CopyBtn text={v.script_hook} />
                        </div>
                      </div>
                    )}
                    {v.keyPoints?.length > 0 && (
                      <div><p className="text-slate-400 text-xs font-semibold mb-1.5">📌 Key Points to Cover</p>
                        <ul className="space-y-1">{v.keyPoints.map((p: string, i: number) => <li key={i} className="text-slate-300 text-xs flex items-start gap-1.5"><span className="text-emerald-400 mt-0.5">✓</span>{p}</li>)}</ul>
                      </div>
                    )}
                    {v.cta && <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-lg p-2.5"><p className="text-emerald-400 text-xs font-semibold">📢 CTA</p><p className="text-slate-300 text-xs">{v.cta}</p></div>}
                    {v.thumbnail && <div className="bg-slate-700/40 rounded-lg p-2.5"><p className="text-slate-400 text-xs font-semibold mb-0.5">🖼️ Thumbnail Concept</p><p className="text-slate-300 text-xs">{v.thumbnail}</p></div>}
                  </div>
                )}
              </div>
            ))}
            {result.launchTimeline && (
              <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-3.5">
                <p className="text-white text-xs font-semibold mb-1">📅 Launch Timeline</p>
                <p className="text-slate-300 text-xs">{result.launchTimeline}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 5: Stories Calendar
// ═══════════════════════════════════════════════════════════════════════════

function StoriesTab() {
  const { requestGeneration } = useGenerationGate();
  const [niche, setNiche] = useState("");
  const [product, setProduct] = useState("");
  const [platform, setPlatform] = useState("Instagram + YouTube Community");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const [openDay, setOpenDay] = useState<number|null>(1);
  const abortRef = useRef<AbortController | null>(null);

  async function generate() {
    if (!niche.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController(); abortRef.current = ctrl;
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await callAPI("yt-stories", { niche, product, platform }, ctrl.signal);
      setResult(data); setOpenDay(1);
    } catch (e: any) { if (e.name !== "AbortError") setError(e.message); }
    finally { setLoading(false); }
  }

  const DAY_COLORS = ["bg-pink-500","bg-purple-500","bg-blue-500","bg-teal-500","bg-emerald-500","bg-amber-500","bg-red-500"];
  const SLIDE_TYPE_ICON: Record<string, string> = { text: "📝", image: "🖼️", poll: "📊", quiz: "❓", countdown: "⏰", swipe: "👆" };

  return (
    <div className="grid lg:grid-cols-[280px,1fr] gap-6">
      <div className="space-y-4">
        <div className="bg-purple-500/8 border border-purple-500/20 rounded-xl p-3">
          <p className="text-purple-300 text-xs font-semibold mb-1">📖 Phase 5 Strategy</p>
          <p className="text-slate-400 text-xs">Stories build the intimacy that makes sales feel natural. Mix 70% value/personal with 30% product. Never hard sell in Stories — let the relationship do the selling.</p>
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Your Niche *</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm"
            placeholder="e.g. Nutrition & Weight Loss, Digital Marketing, Fashion" value={niche} onChange={e => setNiche(e.target.value)} />
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Product/Service</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm"
            placeholder="e.g. Nutrition plan, Marketing course, Clothing brand" value={product} onChange={e => setProduct(e.target.value)} />
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Platform</label>
          <select className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-red-500 text-sm"
            value={platform} onChange={e => setPlatform(e.target.value)}>
            <option>Instagram + YouTube Community</option>
            <option>Instagram only</option>
            <option>YouTube Community only</option>
            <option>All platforms</option>
          </select>
        </div>
        <Button onClick={() => requestGeneration(generate)} disabled={!niche.trim() || loading}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl disabled:opacity-40">
          {loading ? <><Loader2 size={15} className="animate-spin mr-2" />Building Calendar…</> : <><BookOpen size={15} className="mr-2" />Generate 7-Day Stories</>}
        </Button>
      </div>
      <div>
        {!result && !loading && !error && <EmptyBox icon={BookOpen} title="7-Day Stories Content Calendar" desc="Daily story plans with slide-by-slide content, polls, quizzes, and selling moments designed by marketing coaches" />}
        {loading && <LoadingBox label="Crafting your 7-day stories content calendar…" />}
        {error && <ErrorBox msg={error} onRetry={() => requestGeneration(generate)} />}
        {result && (
          <div className="space-y-3">
            {result.strategy && (
              <div className="bg-purple-500/8 border border-purple-500/20 rounded-xl p-3.5">
                <p className="text-purple-300 text-xs font-semibold mb-1">Strategy</p>
                <p className="text-slate-300 text-xs">{result.strategy}</p>
              </div>
            )}
            {(result.days || []).map((day: any) => (
              <div key={day.day} className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
                <button onClick={() => setOpenDay(openDay === day.day ? null : day.day)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/30 transition-colors text-left">
                  <div className={`w-7 h-7 rounded-full ${DAY_COLORS[(day.day-1)%7]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>D{day.day}</div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-semibold">{day.theme}</p>
                    <p className="text-slate-400 text-xs">{day.goal}</p>
                  </div>
                  <ChevronRight size={14} className={`text-slate-400 shrink-0 transition-transform ${openDay === day.day ? "rotate-90" : ""}`} />
                </button>
                {openDay === day.day && (
                  <div className="px-4 pb-4 border-t border-slate-700 pt-3 space-y-2">
                    {(day.slides || []).map((slide: any, i: number) => (
                      <div key={i} className="bg-slate-700/40 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-sm">{SLIDE_TYPE_ICON[slide.type] || "📌"}</span>
                          <span className="text-white text-xs font-semibold capitalize">{slide.type} — Slide {i+1}</span>
                          <CopyBtn text={slide.content} />
                        </div>
                        <p className="text-slate-300 text-xs">{slide.content}</p>
                        {slide.interactivity && <p className="text-purple-300 text-xs mt-1 italic">→ {slide.interactivity}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {result.selling_story && (
              <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-3.5">
                <p className="text-emerald-400 text-xs font-semibold mb-1">🛍️ Selling Through Stories</p>
                <p className="text-slate-300 text-xs">{result.selling_story}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 6: Quiz Builder
// ═══════════════════════════════════════════════════════════════════════════

function QuizTab() {
  const { requestGeneration } = useGenerationGate();
  const [niche, setNiche] = useState("");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const [openQuiz, setOpenQuiz] = useState<number|null>(0);
  const abortRef = useRef<AbortController | null>(null);

  async function generate() {
    if (!niche.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController(); abortRef.current = ctrl;
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await callAPI("yt-quiz", { niche, topic }, ctrl.signal);
      setResult(data); setOpenQuiz(0);
    } catch (e: any) { if (e.name !== "AbortError") setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="grid lg:grid-cols-[280px,1fr] gap-6">
      <div className="space-y-4">
        <div className="bg-yellow-500/8 border border-yellow-500/20 rounded-xl p-3">
          <p className="text-yellow-300 text-xs font-semibold mb-1">🎯 Phase 6 Strategy</p>
          <p className="text-slate-400 text-xs">Quiz videos get 8x more comments than regular videos. Comments = algorithm fuel. "9/10 people get this wrong" triggers the ego response — everyone wants to prove they're in the 1 in 10.</p>
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Your Niche *</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm"
            placeholder="e.g. History, Finance, Fitness, Tech" value={niche} onChange={e => setNiche(e.target.value)} />
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Specific Topic (optional)</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm"
            placeholder="e.g. Compound interest, Indian history myths, Protein myths" value={topic} onChange={e => setTopic(e.target.value)} />
        </div>
        <Button onClick={() => requestGeneration(generate)} disabled={!niche.trim() || loading}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl disabled:opacity-40">
          {loading ? <><Loader2 size={15} className="animate-spin mr-2" />Generating Quizzes…</> : <><HelpCircle size={15} className="mr-2" />Generate Quiz Videos</>}
        </Button>
      </div>
      <div>
        {!result && !loading && !error && <EmptyBox icon={HelpCircle} title="3 Quiz Video Concepts + Questions" desc="Engagement-optimized quiz video scripts with questions, reveal hooks, and comment prompts — proven to 5x your comments" />}
        {loading && <LoadingBox label="Building quiz video concepts for your niche…" />}
        {error && <ErrorBox msg={error} onRetry={() => requestGeneration(generate)} />}
        {result && (
          <div className="space-y-3">
            {(result.quizVideos || []).map((quiz: any, qi: number) => (
              <div key={qi} className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
                <button onClick={() => setOpenQuiz(openQuiz === qi ? null : qi)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/30 transition-colors text-left">
                  <span className="text-xl shrink-0">🎯</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold leading-snug">{quiz.title}</p>
                    <p className="text-slate-400 text-xs">{quiz.format}</p>
                  </div>
                  <ChevronRight size={14} className={`text-slate-400 shrink-0 transition-transform ${openQuiz === qi ? "rotate-90" : ""}`} />
                </button>
                {openQuiz === qi && (
                  <div className="px-4 pb-4 border-t border-slate-700 pt-3 space-y-3">
                    {(quiz.questions || []).map((q: any, i: number) => (
                      <div key={i} className="bg-slate-700/40 rounded-xl p-3">
                        <p className="text-white text-xs font-semibold mb-2">Q{i+1}: {q.question}</p>
                        <div className="grid grid-cols-2 gap-1.5 mb-2">
                          {(q.options || []).map((opt: string, j: number) => (
                            <div key={j} className={`rounded-lg px-2.5 py-1.5 text-xs ${opt.startsWith(q.answer?.charAt(0)) ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-slate-600/50 text-slate-300"}`}>{opt}</div>
                          ))}
                        </div>
                        {q.reveal_hook && <p className="text-yellow-400 text-xs italic">🎬 Reveal: {q.reveal_hook}</p>}
                        {q.explanation && <p className="text-slate-400 text-xs mt-1">{q.explanation}</p>}
                      </div>
                    ))}
                    {quiz.thumbnail && <div className="bg-slate-700/30 rounded-xl p-3"><p className="text-slate-400 text-xs font-semibold mb-1">🖼️ Thumbnail</p><p className="text-slate-300 text-xs">{quiz.thumbnail}</p></div>}
                    {quiz.engagement_prompt && <div className="bg-yellow-500/8 border border-yellow-500/20 rounded-xl p-3"><p className="text-yellow-300 text-xs font-semibold">💬 Comment Prompt</p><p className="text-white text-sm">"{quiz.engagement_prompt}"</p></div>}
                  </div>
                )}
              </div>
            ))}
            {result.pollIdeas?.length > 0 && (
              <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-3.5">
                <p className="text-white text-xs font-semibold mb-2">📊 Community Poll Ideas</p>
                <ul className="space-y-1.5">
                  {result.pollIdeas.map((p: string, i: number) => (
                    <li key={i} className="flex items-center justify-between bg-slate-700/40 rounded-lg px-3 py-2">
                      <p className="text-slate-300 text-xs">{p}</p>
                      <CopyBtn text={p} />
                    </li>
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
// TAB 7: Freebie Funnel
// ═══════════════════════════════════════════════════════════════════════════

function FreebieTab() {
  const { requestGeneration } = useGenerationGate();
  const [niche, setNiche] = useState("");
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const [openFreebie, setOpenFreebie] = useState<number|null>(0);
  const abortRef = useRef<AbortController | null>(null);

  async function generate() {
    if (!niche.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController(); abortRef.current = ctrl;
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await callAPI("yt-freebie", { niche, product, audience }, ctrl.signal);
      setResult(data); setOpenFreebie(0);
    } catch (e: any) { if (e.name !== "AbortError") setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="grid lg:grid-cols-[280px,1fr] gap-6">
      <div className="space-y-4">
        <div className="bg-teal-500/8 border border-teal-500/20 rounded-xl p-3">
          <p className="text-teal-300 text-xs font-semibold mb-1">🎁 Phase 7 Strategy</p>
          <p className="text-slate-400 text-xs">The freebie builds your email list — your most valuable asset. Give 10x more value than you charge. When people get ₹1000 value free, they feel compelled to buy your paid offer.</p>
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Your Niche *</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm"
            placeholder="e.g. SEO, Stock Market India, Skincare, Business Automation" value={niche} onChange={e => setNiche(e.target.value)} />
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Product/Service to Upsell</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm"
            placeholder="e.g. SEO course, Stock analysis tool, Skincare kit" value={product} onChange={e => setProduct(e.target.value)} />
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Target Audience</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm"
            placeholder="e.g. beginners, busy professionals, small business owners" value={audience} onChange={e => setAudience(e.target.value)} />
        </div>
        <Button onClick={() => requestGeneration(generate)} disabled={!niche.trim() || loading}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl disabled:opacity-40">
          {loading ? <><Loader2 size={15} className="animate-spin mr-2" />Creating Freebies…</> : <><Gift size={15} className="mr-2" />Generate Freebie Funnel</>}
        </Button>
      </div>
      <div>
        {!result && !loading && !error && <EmptyBox icon={Gift} title="3 Lead Magnet Ideas + Email Sequences" desc="High-value freebie concepts with video titles to promote them, CTA scripts, and 3-email welcome sequences" />}
        {loading && <LoadingBox label="Designing your freebie funnel and email sequences…" />}
        {error && <ErrorBox msg={error} onRetry={() => requestGeneration(generate)} />}
        {result && (
          <div className="space-y-3">
            {(result.freebies || []).map((f: any, fi: number) => (
              <div key={fi} className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
                <button onClick={() => setOpenFreebie(openFreebie === fi ? null : fi)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/30 transition-colors text-left">
                  <span className="text-xl shrink-0">🎁</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold">{f.name}</p>
                    <div className="flex items-center gap-2"><span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full">{f.type}</span></div>
                  </div>
                  <ChevronRight size={14} className={`text-slate-400 shrink-0 transition-transform ${openFreebie === fi ? "rotate-90" : ""}`} />
                </button>
                {openFreebie === fi && (
                  <div className="px-4 pb-4 border-t border-slate-700 pt-3 space-y-3">
                    <p className="text-slate-300 text-xs">{f.description}</p>
                    {f.ytVideoTitle && (
                      <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-3 flex justify-between gap-2">
                        <div><p className="text-red-300 text-xs font-semibold mb-1">📹 YouTube Video to Promote It</p><p className="text-white text-sm">{f.ytVideoTitle}</p></div>
                        <CopyBtn text={f.ytVideoTitle} />
                      </div>
                    )}
                    {f.cta_line && (
                      <div className="bg-teal-500/8 border border-teal-500/20 rounded-xl p-3 flex justify-between gap-2">
                        <div><p className="text-teal-300 text-xs font-semibold mb-1">🗣️ CTA to Say in Video</p><p className="text-white text-sm">"{f.cta_line}"</p></div>
                        <CopyBtn text={f.cta_line} />
                      </div>
                    )}
                    {f.email_sequence?.length > 0 && (
                      <div><p className="text-slate-400 text-xs font-semibold mb-2">📧 Welcome Email Sequence</p>
                        <div className="space-y-2">
                          {f.email_sequence.map((e: any, ei: number) => (
                            <div key={ei} className="bg-slate-700/40 rounded-xl p-3">
                              <p className="text-white text-xs font-semibold">Email {e.email}: {e.subject}</p>
                              <p className="text-slate-400 text-xs mt-1">{e.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {result.landingPageHook && (
              <div className="bg-teal-500/8 border border-teal-500/20 rounded-xl p-3.5 flex justify-between gap-2">
                <div><p className="text-teal-400 text-xs font-semibold mb-1">🌐 Landing Page Headline</p><p className="text-white font-bold">{result.landingPageHook}</p></div>
                <CopyBtn text={result.landingPageHook} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 8: Perks & Scale
// ═══════════════════════════════════════════════════════════════════════════

function PerksTab() {
  const { requestGeneration } = useGenerationGate();
  const [niche, setNiche] = useState("");
  const [product, setProduct] = useState("");
  const [subscribers, setSubscribers] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function generate() {
    if (!niche.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController(); abortRef.current = ctrl;
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await callAPI("yt-perks", { niche, product, subscribers }, ctrl.signal);
      setResult(data);
    } catch (e: any) { if (e.name !== "AbortError") setError(e.message); }
    finally { setLoading(false); }
  }

  const TIER_COLORS = ["bg-slate-500","bg-blue-500","bg-amber-500"];

  return (
    <div className="grid lg:grid-cols-[280px,1fr] gap-6">
      <div className="space-y-4">
        <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-3">
          <p className="text-amber-300 text-xs font-semibold mb-1">💎 Phase 8 Strategy</p>
          <p className="text-slate-400 text-xs">Your top 100 superfans are worth more than your next 10,000 casual viewers. Memberships, exclusive communities, and insider content turn viewers into a recurring revenue base.</p>
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Your Niche *</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm"
            placeholder="e.g. Investing, Gaming, Photography, Business" value={niche} onChange={e => setNiche(e.target.value)} />
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Product/Service</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm"
            placeholder="e.g. Investment newsletter, Game coaching, Photo presets" value={product} onChange={e => setProduct(e.target.value)} />
        </div>
        <div>
          <label className="text-slate-300 text-sm font-medium mb-1.5 block">Current Subscribers</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm"
            placeholder="e.g. 500, 5,000, just starting" value={subscribers} onChange={e => setSubscribers(e.target.value)} />
        </div>
        <Button onClick={() => requestGeneration(generate)} disabled={!niche.trim() || loading}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl disabled:opacity-40">
          {loading ? <><Loader2 size={15} className="animate-spin mr-2" />Designing Perks…</> : <><Crown size={15} className="mr-2" />Generate Perks Strategy</>}
        </Button>
      </div>
      <div>
        {!result && !loading && !error && <EmptyBox icon={Crown} title="Membership Perks & Scale Strategy" desc="3-tier membership structure, insider content series, referral program, and community platform recommendation" />}
        {loading && <LoadingBox label="Designing your superfan perks and scale strategy…" />}
        {error && <ErrorBox msg={error} onRetry={() => requestGeneration(generate)} />}
        {result && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-3">
              {(result.membershipTiers || []).map((tier: any, i: number) => (
                <div key={i} className={`bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 relative overflow-hidden`}>
                  <div className={`absolute top-0 left-0 right-0 h-1 ${TIER_COLORS[i]}`} />
                  <p className="text-white font-bold text-sm mt-1">{tier.name}</p>
                  <p className="text-amber-400 font-bold text-lg">{tier.price}</p>
                  <ul className="mt-2 space-y-1.5">
                    {(tier.perks || []).map((p: string, j: number) => (
                      <li key={j} className="text-slate-300 text-xs flex items-start gap-1.5"><span className="text-amber-400 shrink-0">✓</span>{p}</li>
                    ))}
                  </ul>
                  {tier.exclusive_content && <p className="text-slate-400 text-xs mt-2 pt-2 border-t border-slate-700">🔒 {tier.exclusive_content}</p>}
                </div>
              ))}
            </div>
            {result.insightSeries?.length > 0 && (
              <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
                <p className="text-white text-xs font-semibold mb-2">🎬 Insider Content Series</p>
                <div className="space-y-2">
                  {result.insightSeries.map((s: any, i: number) => (
                    <div key={i} className="bg-slate-700/40 rounded-lg p-3">
                      <p className="text-white text-xs font-semibold">{s.title}</p>
                      <div className="flex items-center gap-2 mt-1"><span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">{s.format}</span></div>
                      <p className="text-slate-400 text-xs mt-1">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {result.communityPlatform && (
              <div className="bg-purple-500/8 border border-purple-500/20 rounded-xl p-3.5">
                <p className="text-purple-400 text-xs font-semibold mb-1">👥 Community Platform Recommendation</p>
                <p className="text-slate-300 text-xs">{result.communityPlatform}</p>
              </div>
            )}
            {result.referralProgram && (
              <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-3.5">
                <p className="text-emerald-400 text-xs font-semibold mb-2">🔗 Referral Program</p>
                <p className="text-slate-300 text-xs"><strong className="text-white">How it works:</strong> {result.referralProgram.mechanism}</p>
                <p className="text-slate-300 text-xs mt-1"><strong className="text-white">Reward:</strong> {result.referralProgram.reward}</p>
                {result.referralProgram.cta && <p className="text-emerald-300 text-xs mt-1 italic">"{result.referralProgram.cta}"</p>}
              </div>
            )}
            {result.scaleRoadmap && (
              <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-3.5">
                <p className="text-amber-400 text-xs font-semibold mb-1">🚀 Scale Roadmap (1k → 100k)</p>
                <p className="text-slate-300 text-xs">{result.scaleRoadmap}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 9: AI Growth Coach (Streaming)
// ═══════════════════════════════════════════════════════════════════════════

interface ChatMsg { role: "user" | "assistant"; content: string }

function CoachTab() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: "Hey! I'm your YouTube AI Growth Coach 🎬\n\nI'm trained on the phase-based growth playbook used by top creators and digital marketing coaches (VidIQ, Think Media, and more).\n\nI'll guide you through:\n\n📱 Phase 1: Shorts strategy — how to start basic and scale\n🎬 Phase 2: Video Ladder — scaling from Shorts to long-form\n📢 Phase 3: Social Blast — turning 1 video into 5 platforms\n🛍️ Phase 4: Product Launch — story-driven selling series\n📖 Phase 5: Stories — building daily intimacy with followers\n🎯 Phase 6: Quiz videos — the comment algorithm hack\n🎁 Phase 7: Freebies — building your email list on autopilot\n💎 Phase 8: Perks & Scale — building a superfan community\n\nWhat phase are you in, and what's holding you back?" }
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
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }), signal: ctrl.signal,
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
            try {
              const delta = JSON.parse(raw).choices?.[0]?.delta?.content || "";
              assistantContent += delta;
              setMessages(prev => { const u = [...prev]; u[u.length-1] = { role: "assistant", content: assistantContent }; return u; });
            } catch {}
          }
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") setMessages(prev => { const u = [...prev]; u[u.length-1] = { role: "assistant", content: "Sorry, I ran into an error. Try again." }; return u; });
    } finally { setStreaming(false); }
  }

  const QUICK = [
    "I'm just starting. Which phase do I begin with?",
    "How do I make my Shorts go viral?",
    "When should I start promoting my product?",
    "How many Shorts should I post per day?",
    "What freebie converts best for online courses?",
  ];

  return (
    <div className="flex flex-col h-[560px]">
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 mt-2 mb-4">
            {QUICK.map(q => (
              <button key={q} onClick={() => setInput(q)}
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
                  <span className="text-red-400 text-[10px] font-semibold uppercase tracking-wider">YT Growth Coach</span>
                </div>
              )}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}{streaming && i === messages.length - 1 && m.role === "assistant" && <span className="inline-block w-0.5 h-4 bg-red-400 animate-pulse ml-0.5 align-middle" />}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-end gap-2 bg-slate-800/60 border border-slate-700 rounded-2xl p-3">
        <textarea rows={1} className="flex-1 bg-transparent text-white text-sm placeholder-slate-500 focus:outline-none resize-none leading-relaxed"
          placeholder="Ask anything about your YouTube growth journey…"
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); requestGeneration(sendMessage); } }}
          style={{ maxHeight: "120px", overflowY: "auto" }} />
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
  const [activeTab, setActiveTab] = useState<TabId>("roadmap");
  const tabBarRef = useRef<HTMLDivElement>(null);

  function jumpTo(tab: TabId) {
    setActiveTab(tab);
    tabBarRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  const tabComponents: Record<TabId, React.ReactNode> = {
    roadmap: <RoadmapTab onJumpTo={jumpTo} />,
    shorts:  <ShortsTab />,
    ladder:  <LadderTab />,
    social:  <SocialBlastTab />,
    launch:  <LaunchTab />,
    stories: <StoriesTab />,
    quiz:    <QuizTab />,
    freebie: <FreebieTab />,
    perks:   <PerksTab />,
    coach:   <CoachTab />,
  };

  return (
    <section id="yt-growstuffs" className="py-20 px-4 bg-gradient-to-b from-[#0a0a1a] via-[#0f0005] to-[#0a0a1a] relative overflow-hidden">
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/25 rounded-full px-4 py-1.5 mb-4">
            <Youtube size={14} className="text-red-400" fill="currentColor" />
            <span className="text-red-300 text-sm font-semibold">YT Growstuffs — Phase-Based Growth System</span>
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">NEW</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-3">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-orange-500">YT Growstuffs</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            The YouTube growth playbook used by top digital marketing coaches — 8 phases from your first Short to a monetized superfan community.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><Smartphone size={13} className="text-pink-400" /> Shorts → Videos</span>
            <span className="flex items-center gap-1.5"><Share2 size={13} className="text-blue-400" /> Social Blast</span>
            <span className="flex items-center gap-1.5"><ShoppingBag size={13} className="text-emerald-400" /> Product Launch</span>
            <span className="flex items-center gap-1.5"><Gift size={13} className="text-teal-400" /> Freebie Funnel</span>
            <span className="flex items-center gap-1.5"><Crown size={13} className="text-amber-400" /> Perks & Scale</span>
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
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-3.5 text-xs font-medium whitespace-nowrap transition-all border-b-2 shrink-0 ${
                    isActive ? "border-red-500 text-white bg-red-500/5" : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/3"
                  }`}>
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

        {/* VidIQ-style footer note */}
        <div className="mt-6 flex items-center justify-center gap-3 text-xs text-slate-600">
          <span>📊 Strategy based on VidIQ + Think Media playbooks</span>
          <span>•</span>
          <span>🤖 All tools powered by free AI models</span>
          <span>•</span>
          <span>🇮🇳 Optimized for Indian creators</span>
        </div>
      </div>
    </section>
  );
}
