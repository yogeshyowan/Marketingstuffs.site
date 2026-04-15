import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ArrowRight, Loader2, Sparkles, Check, ChevronRight, X } from "lucide-react";
import { useUser, UserProfile, GrowthPlan } from "@/context/UserContext";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "") + "/__api/";

const BUSINESS_TYPES = [
  { id: "product",    label: "Real Product Seller",   icon: "🛍️", desc: "Physical or digital products" },
  { id: "influencer", label: "Influencer / Creator",  icon: "👤", desc: "Building a personal brand" },
  { id: "saas",       label: "SaaS or App",           icon: "💻", desc: "Software product or app" },
  { id: "ecommerce",  label: "eCommerce Store",       icon: "🛒", desc: "Online shop / D2C brand" },
  { id: "service",    label: "Service Provider",      icon: "🤝", desc: "Consulting, agency, freelancer" },
  { id: "creator",    label: "Content Creator",       icon: "📺", desc: "YouTube / Blog / Podcast" },
];

const GOALS = [
  { id: "audience",  label: "Build my audience from scratch",   icon: "🚀", desc: "0 → 10,000 followers" },
  { id: "launch",    label: "Launch and sell my product",       icon: "💰", desc: "Build a revenue stream" },
  { id: "scale",     label: "Scale from 1k to 100k",           icon: "📈", desc: "Accelerate what's working" },
  { id: "brand",     label: "Build my brand & get clients",    icon: "🏢", desc: "Establish authority & trust" },
];

export default function OnboardingWizard() {
  const { setProfile, setShowOnboarding } = useUser();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [goal, setGoal] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const businessLabel = BUSINESS_TYPES.find(b => b.id === businessType)?.label ?? "";
  const goalLabel = GOALS.find(g => g.id === goal)?.label ?? "";

  async function generatePlan() {
    setGenerating(true);
    setError("");
    abortRef.current?.abort();
    const ctrl = new AbortController(); abortRef.current = ctrl;
    try {
      const res = await fetch(`${BASE_URL}ai/yt-growth-advisor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, businessType, businessLabel, goal: goalLabel }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(await res.text());
      const plan = await res.json() as GrowthPlan;
      const profile: UserProfile = {
        name, businessType, businessLabel, goal: goalLabel,
        onboardingComplete: true, growthPlan: plan,
        createdAt: new Date().toISOString(),
      };
      setProfile(profile);
      setShowOnboarding(false);
    } catch (e: any) {
      if (e.name !== "AbortError") setError(e.message ?? "Failed to generate plan. Please try again.");
      setGenerating(false);
    }
  }

  function skip() {
    const profile: UserProfile = {
      name: name || "Creator", businessType: businessType || "creator",
      businessLabel: businessLabel || "Content Creator", goal: goalLabel || "Build my audience",
      onboardingComplete: true, growthPlan: null, createdAt: new Date().toISOString(),
    };
    setProfile(profile);
    setShowOnboarding(false);
  }

  const canNext0 = name.trim().length > 0 && businessType;
  const canNext1 = !!goal;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(5,5,20,0.95)", backdropFilter: "blur(20px)" }}>

      {/* Skip button */}
      <button onClick={skip} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1 text-sm">
        <X size={14} /> Skip for now
      </button>

      {/* Progress dots */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2">
        {[0, 1, 2].map(i => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-8 bg-emerald-400" : i < step ? "w-5 bg-emerald-400/50" : "w-5 bg-slate-700"}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* STEP 0 — Name + Business Type */}
        {step === 0 && (
          <motion.div key="s0" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.35 }}
            className="w-full max-w-2xl">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(52,211,153,0.4)]">
                <Zap size={28} className="text-white" fill="white" />
              </div>
              <h1 className="text-3xl font-extrabold text-white mb-2">Welcome to Marketingstuffs</h1>
              <p className="text-slate-400">Let's create your personal AI-powered growth plan in 60 seconds.</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6 mb-6">
              <label className="text-slate-300 text-sm font-semibold mb-2 block">Your name</label>
              <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-base font-medium"
                placeholder="e.g. Priya, Arjun, Karthik…" value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && canNext0) setStep(1); }} autoFocus />
            </div>

            <div className="mb-6">
              <p className="text-slate-300 text-sm font-semibold mb-3">What best describes your business?</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {BUSINESS_TYPES.map(b => (
                  <button key={b.id} onClick={() => setBusinessType(b.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${businessType === b.id ? "border-emerald-400 bg-emerald-500/10" : "border-slate-700 bg-slate-900/50 hover:border-slate-600"}`}>
                    <span className="text-2xl block mb-1">{b.icon}</span>
                    <p className={`text-sm font-semibold ${businessType === b.id ? "text-emerald-300" : "text-white"}`}>{b.label}</p>
                    <p className="text-slate-500 text-xs">{b.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setStep(1)} disabled={!canNext0}
              className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: canNext0 ? "linear-gradient(135deg,#10b981,#3b82f6)" : "#334155" }}>
              Continue <ArrowRight size={18} />
            </button>
          </motion.div>
        )}

        {/* STEP 1 — Goal selection */}
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.35 }}
            className="w-full max-w-lg">
            <div className="text-center mb-8">
              <p className="text-emerald-400 font-semibold text-sm mb-2">Hey {name}! 👋</p>
              <h2 className="text-2xl font-extrabold text-white mb-2">What's your biggest focus right now?</h2>
              <p className="text-slate-400 text-sm">Your growth plan will be customized for this goal.</p>
            </div>

            <div className="space-y-3 mb-8">
              {GOALS.map(g => (
                <button key={g.id} onClick={() => setGoal(g.id)}
                  className={`w-full p-4 rounded-xl border text-left flex items-center gap-4 transition-all ${goal === g.id ? "border-emerald-400 bg-emerald-500/10" : "border-slate-700 bg-slate-900/50 hover:border-slate-600"}`}>
                  <span className="text-2xl shrink-0">{g.icon}</span>
                  <div>
                    <p className={`font-semibold ${goal === g.id ? "text-emerald-300" : "text-white"}`}>{g.label}</p>
                    <p className="text-slate-500 text-xs">{g.desc}</p>
                  </div>
                  {goal === g.id && <Check size={16} className="text-emerald-400 ml-auto shrink-0" />}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="px-5 py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-colors font-medium">
                Back
              </button>
              <button onClick={() => { setStep(2); generatePlan(); }} disabled={!canNext1}
                className="flex-1 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: canNext1 ? "linear-gradient(135deg,#10b981,#3b82f6)" : "#334155" }}>
                <Sparkles size={16} /> Generate My Growth Plan
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2 — Generating / Done */}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}
            className="w-full max-w-md text-center">
            {generating && !error && (
              <>
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center shadow-[0_0_40px_rgba(52,211,153,0.5)]">
                    <Loader2 size={32} className="text-white animate-spin" />
                  </div>
                </div>
                <h2 className="text-2xl font-extrabold text-white mb-3">Building Your Growth Plan…</h2>
                <p className="text-slate-400 text-sm mb-4">Our AI is designing a personalized step-by-step roadmap for your {businessLabel} business.</p>
                <div className="space-y-2 max-w-xs mx-auto">
                  {["Analyzing your business type…", "Mapping growth phases…", "Linking to your tools…", "Finalizing your roadmap…"].map((l, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" style={{ animationDelay: `${i*200}ms` }} />
                      {l}
                    </div>
                  ))}
                </div>
              </>
            )}
            {error && (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                  <X size={28} className="text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
                <p className="text-slate-400 text-sm mb-4">{error}</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => { setStep(2); setError(""); generatePlan(); }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-500">
                    Try Again
                  </button>
                  <button onClick={skip} className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm hover:border-slate-500">
                    Skip & Enter
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
