import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ChevronDown, Check, X, Info, Crown } from "lucide-react";
import { getPlan, setPlan, getCredits, getTotalCredits, PLAN_CONFIG, type Plan } from "@/lib/credits";

const PLAN_ORDER: Plan[] = ["free", "plus", "pro", "bundle"];

function ProgressRing({ pct, color }: { pct: number; color: string }) {
  const r = 14;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.max(0, Math.min(1, pct)));
  return (
    <svg width="36" height="36" className="rotate-[-90deg]">
      <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
      <circle cx="18" cy="18" r={r} fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
    </svg>
  );
}

export default function CreditsDisplay() {
  const [plan, setPlanState] = useState<Plan>("free");
  const [credits, setCredits] = useState(0);
  const [total, setTotal] = useState(50);
  const [open, setOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const refresh = useCallback(() => {
    setPlanState(getPlan());
    setCredits(getCredits());
    setTotal(getTotalCredits());
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 2000);
    return () => clearInterval(id);
  }, [refresh]);

  function activatePlan(p: Plan) {
    setPlan(p);
    refresh();
    setOpen(false);
  }

  const pct = total > 0 ? credits / total : 0;
  const cfg = PLAN_CONFIG[plan];

  const ringColor =
    plan === "plus" ? "#a78bfa" :
    plan === "pro" ? "#f59e0b" :
    plan === "bundle" ? "#34d399" :
    pct < 0.2 ? "#ef4444" :
    pct < 0.5 ? "#f59e0b" : "#6d28d9";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
      >
        <div className="relative">
          <ProgressRing pct={pct} color={ringColor} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5" style={{ color: ringColor }} fill={ringColor} />
          </div>
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-xs font-bold text-white leading-tight">{credits.toLocaleString()}<span className="text-white/30 font-normal">/{total.toLocaleString()}</span></div>
          <div className={`text-[10px] font-semibold ${cfg.color}`}>{cfg.name}</div>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-white/30 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              className="absolute right-0 top-full mt-2 w-80 bg-[#0e0e1a] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="px-5 pt-5 pb-4 border-b border-white/8">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span className="text-white font-bold text-sm">AI Credits</span>
                  </div>
                  <button onClick={() => setShowInfo(s => !s)} className="text-white/30 hover:text-white/60 transition-colors">
                    <Info className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="mb-2">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-white font-semibold">{credits.toLocaleString()} credits left</span>
                    <span className="text-white/40">{total.toLocaleString()} total/mo</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.max(2, pct * 100)}%`, background: ringColor }}
                    />
                  </div>
                </div>

                {/* Info panel */}
                <AnimatePresence>
                  {showInfo && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 rounded-xl bg-violet-500/10 border border-violet-500/20 p-3 text-xs text-white/60 space-y-1">
                        <p className="text-violet-300 font-semibold">How credits work</p>
                        <p>• 62.5 credits per $1 you pay</p>
                        <p>• Short blog (600w) = <span className="text-white">5 credits</span></p>
                        <p>• Epic blog (3000w) = <span className="text-white">25 credits</span></p>
                        <p>• Writing tool = <span className="text-white">2–4 credits</span></p>
                        <p>• Website section = <span className="text-white">12 credits</span></p>
                        <p className="text-white/30 pt-1">Credits reset monthly. Paid plans use Claude AI.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Plan selector */}
              <div className="p-3 space-y-1.5">
                <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider px-2 mb-2">
                  {plan === "free" ? "Demo — activate a plan:" : "Switch plan (demo):"}
                </p>
                {PLAN_ORDER.map(p => {
                  const c = PLAN_CONFIG[p];
                  const active = p === plan;
                  return (
                    <button
                      key={p}
                      onClick={() => activatePlan(p)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all ${
                        active
                          ? "bg-violet-500/20 border border-violet-500/40"
                          : "hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full ${
                          p === "free" ? "bg-white/30" :
                          p === "plus" ? "bg-violet-400" :
                          p === "pro" ? "bg-amber-400" : "bg-emerald-400"
                        }`} />
                        <span className={`font-semibold ${active ? "text-white" : "text-white/70"}`}>{c.name}</span>
                        <span className={`text-xs ${c.color}`}>{c.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/40">{c.credits.toLocaleString()} cr</span>
                        {active && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Model info */}
              <div className="px-5 pb-4 border-t border-white/8 pt-3">
                <div className="rounded-xl bg-white/3 border border-white/8 p-3 text-xs">
                  <div className="flex items-start gap-2">
                    <Zap className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
                    <div>
                      {plan === "free" ? (
                        <p className="text-white/50">Free plan uses Gemma / Llama / Qwen via OpenRouter. Upgrade for <span className="text-violet-400">Claude Haiku & Sonnet</span>.</p>
                      ) : (
                        <p className="text-white/70">
                          Using <span className="text-violet-400 font-semibold">Claude Haiku</span> for quick tasks &amp; <span className="text-amber-400 font-semibold">Claude Sonnet</span> for long-form content.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
