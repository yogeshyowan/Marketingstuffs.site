import { createContext, useCallback, useContext, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Zap, Crown, Package, Check, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── localStorage helpers ───────────────────────────────────
const LS_COUNT  = "growbiz_gen_count";
const LS_LOGGED = "growbiz_logged_in";
const LS_BONUS  = "growbiz_bonus_used";

function getCount()    { return parseInt(localStorage.getItem(LS_COUNT)  ?? "0", 10); }
function incCount()    { localStorage.setItem(LS_COUNT, String(getCount() + 1)); }
function isLoggedIn()  { return localStorage.getItem(LS_LOGGED) === "true"; }
function setLoggedIn() { localStorage.setItem(LS_LOGGED, "true"); }
function isBonusUsed() { return localStorage.getItem(LS_BONUS) === "true"; }
function setBonusUsed(){ localStorage.setItem(LS_BONUS, "true"); }

// ── Context ────────────────────────────────────────────────
type GateCtx = { requestGeneration: (onProceed: () => void) => void };
const GenerationGateContext = createContext<GateCtx>({ requestGeneration: (cb) => cb() });
export function useGenerationGate() { return useContext(GenerationGateContext); }

// ── Provider ───────────────────────────────────────────────
export function GenerationGateProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<"login" | "upgrade" | null>(null);
  const [pending, setPending] = useState<(() => void) | null>(null);
  const [loginStep, setLoginStep] = useState<"idle" | "opening" | "confirm">("idle");

  const closeModal = () => { setModal(null); setPending(null); setLoginStep("idle"); };

  const requestGeneration = useCallback((onProceed: () => void) => {
    const count = getCount();
    const logged = isLoggedIn();
    const bonusUsed = isBonusUsed();

    if (count === 0) {
      // ① First generation — free
      incCount();
      onProceed();
    } else if (!logged) {
      // ② Second generation — require login
      setPending(() => onProceed);
      setModal("login");
    } else if (!bonusUsed) {
      // ③ Post-login bonus generation — free
      incCount();
      setBonusUsed();
      onProceed();
    } else {
      // ④ Limit reached — show paywall
      setPending(() => onProceed);
      setModal("upgrade");
    }
  }, []);

  const handleLoginSuccess = () => {
    setLoggedIn();
    setBonusUsed();
    incCount();
    closeModal();
    if (pending) { pending(); setPending(null); }
  };

  return (
    <GenerationGateContext.Provider value={{ requestGeneration }}>
      {children}
      <AnimatePresence>
        {modal === "login"   && <LoginModal   loginStep={loginStep} setLoginStep={setLoginStep} onSuccess={handleLoginSuccess} onClose={closeModal} />}
        {modal === "upgrade" && <UpgradeModal onClose={closeModal} />}
      </AnimatePresence>
    </GenerationGateContext.Provider>
  );
}

// ── Backdrop ───────────────────────────────────────────────
function Backdrop({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      key="backdrop"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
    />
  );
}

// ── Login Modal ────────────────────────────────────────────
function LoginModal({
  loginStep, setLoginStep, onSuccess, onClose,
}: {
  loginStep: "idle" | "opening" | "confirm";
  setLoginStep: (s: "idle" | "opening" | "confirm") => void;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const openGoogle = () => {
    window.open(
      "https://accounts.google.com/signin",
      "google_login",
      "width=480,height=600,scrollbars=yes,resizable=yes"
    );
    setLoginStep("opening");
    setTimeout(() => setLoginStep("confirm"), 3000);
  };

  return (
    <>
      <Backdrop onClose={onClose} />
      <motion.div
        key="login-modal"
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="bg-[#0e0e1a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto">
          {/* Header */}
          <div className="relative p-6 pb-4 border-b border-white/10">
            <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-violet-400 font-semibold uppercase tracking-wide">Free limit reached</p>
                <h3 className="text-white font-bold text-lg leading-tight">Sign in for 1 more free generation</h3>
              </div>
            </div>
            <p className="text-white/50 text-sm">You've used your first free generation. Sign in with Google to unlock one more — no credit card needed.</p>
          </div>

          {/* Benefits */}
          <div className="p-6 pb-4 space-y-2">
            {[
              "1 additional free generation after sign-in",
              "Save your generated content to history",
              "Access to 11 AI social media tools",
              "Faster generation with priority queue",
            ].map(b => (
              <div key={b} className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                </div>
                <span className="text-white/70 text-sm">{b}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="px-6 pb-6 space-y-3">
            {loginStep === "idle" && (
              <button
                onClick={openGoogle}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-semibold rounded-xl h-12 transition-colors shadow-md"
              >
                <svg className="w-5 h-5" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
                Continue with Google
              </button>
            )}

            {loginStep === "opening" && (
              <div className="w-full flex items-center justify-center gap-3 bg-white/10 border border-white/10 rounded-xl h-12">
                <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-white/60 text-sm">Google sign-in opening…</span>
              </div>
            )}

            {loginStep === "confirm" && (
              <div className="space-y-3">
                <p className="text-center text-sm text-yellow-400/80">
                  ⏳ Signed in on Google? Click below to continue.
                </p>
                <button
                  onClick={onSuccess}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-500 hover:to-pink-400 text-white font-bold rounded-xl h-12 transition-all shadow-lg"
                >
                  <Check className="w-4 h-4" /> I've signed in — Continue
                </button>
                <button onClick={openGoogle} className="w-full text-center text-xs text-white/30 hover:text-white/50 transition-colors py-1">
                  Didn't open? Try again →
                </button>
              </div>
            )}

            <p className="text-center text-xs text-white/25">
              By signing in you agree to our{" "}
              <a href="#" className="underline hover:text-white/50">Terms of Service</a>
              {" "}and{" "}
              <a href="#" className="underline hover:text-white/50">Privacy Policy</a>
            </p>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ── Upgrade Modal ──────────────────────────────────────────
const PLANS = [
  {
    id: "plus",
    name: "Plus",
    emoji: "⚡",
    price: "$8",
    period: "/mo",
    billed: "Billed as $97/yr",
    highlight: true,
    badge: "Most Popular",
    badgeColor: "from-violet-500 to-pink-500",
    borderColor: "border-violet-500/50",
    features: [
      "Unlimited blog posts",
      "Unlimited website sections",
      "Unlimited social media posts",
      "Claude 3.5 Sonnet — far better writing",
      "10× longer outputs & richer detail",
      "Priority generation queue",
      "Content history & saved projects",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    emoji: "👑",
    price: "$49",
    period: "/mo",
    billed: "Billed as $599/yr",
    highlight: false,
    badge: "Best Quality",
    badgeColor: "from-amber-500 to-orange-500",
    borderColor: "border-amber-500/30",
    features: [
      "Everything in Plus",
      "Claude 3 Opus — highest quality AI",
      "API access for automation",
      "White-label reports",
      "SEO audit & keyword analysis",
      "Team collaboration (5 seats)",
      "Dedicated support",
    ],
  },
  {
    id: "bundle",
    name: "Bundle",
    emoji: "📦",
    price: "$139",
    period: "/yr",
    billed: "Annual plan only",
    highlight: false,
    badge: "Best Value",
    badgeColor: "from-emerald-500 to-teal-500",
    borderColor: "border-emerald-500/30",
    features: [
      "Everything in Pro",
      "n8n automation (self-hosted)",
      "WordPress hosting included",
      "Free .xyz domain + SSL",
      "One-click publish to WordPress",
      "Unlimited team seats",
    ],
  },
];

function UpgradeModal({ onClose }: { onClose: () => void }) {
  return (
    <>
      <Backdrop onClose={onClose} />
      <motion.div
        key="upgrade-modal"
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="bg-[#0a0a14] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto">
          {/* Header */}
          <div className="sticky top-0 bg-[#0a0a14] border-b border-white/10 px-6 py-5 z-10">
            <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-xl leading-tight">Unlock Unlimited AI Content</h3>
                <p className="text-white/50 text-sm mt-0.5">
                  Free limit reached. Upgrade for unlimited generations powered by{" "}
                  <span className="text-violet-400 font-semibold">Anthropic Claude</span> — the world's best AI writing model.
                </p>
              </div>
            </div>

            {/* Claude advantage banner */}
            <div className="mt-4 flex items-center gap-3 bg-gradient-to-r from-violet-900/40 to-pink-900/30 border border-violet-500/20 rounded-xl px-4 py-3">
              <Star className="w-5 h-5 text-yellow-400 shrink-0" />
              <div>
                <p className="text-white text-xs font-semibold">Why Claude beats the free models</p>
                <p className="text-white/40 text-xs mt-0.5">More nuanced writing, longer outputs, better SEO structure, richer ideas — and no rate limits. Free tier uses GPT-OSS / Gemma / Llama. Paid plans use Claude 3.5 Sonnet or Claude 3 Opus.</p>
              </div>
            </div>
          </div>

          {/* Plans */}
          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PLANS.map(plan => (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-xl border p-5 transition-all ${plan.highlight ? `${plan.borderColor} bg-gradient-to-b from-violet-900/20 to-transparent shadow-[0_0_32px_rgba(139,92,246,0.15)]` : `${plan.borderColor} bg-white/[0.03]`}`}
              >
                {/* Badge */}
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r ${plan.badgeColor} text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap`}>
                  {plan.badge}
                </div>

                <div className="mt-3 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{plan.emoji}</span>
                    <span className="text-white font-bold text-lg">{plan.name}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                    <span className="text-white/40 text-sm">{plan.period}</span>
                  </div>
                  <p className="text-white/30 text-xs mt-1">{plan.billed}</p>
                </div>

                <ul className="flex-1 space-y-2 mb-5">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-white/65 text-xs">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => { window.location.href = "#pricing"; onClose(); }}
                  className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all ${plan.highlight ? "bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white" : "bg-white/10 hover:bg-white/20 text-white border border-white/10"}`}
                >
                  Get {plan.name} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 text-center space-y-2">
            <div className="flex items-center justify-center gap-4 text-xs text-white/30">
              <span>✓ No credit card to try</span>
              <span>·</span>
              <span>✓ Cancel anytime</span>
              <span>·</span>
              <span>✓ Instant access</span>
            </div>
            <button onClick={onClose} className="text-xs text-white/20 hover:text-white/40 transition-colors underline">
              Continue with 0 free generations remaining
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
