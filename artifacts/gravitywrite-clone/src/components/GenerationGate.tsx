import { createContext, useCallback, useContext, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Zap, Crown, Check, ChevronRight, Star, Flame } from "lucide-react";
import { useUser } from "@/context/UserContext";

// ── localStorage helpers ───────────────────────────────────────────────────────
const LS_GOOGLE  = "ms_google_signed_in";
const LS_CREDITS = "ms_credits";
const LS_EMAIL   = "ms_user_email";
const LS_ADMIN   = "ms_is_admin";
const FREE_CREDITS = 50;
const ADMIN_EMAIL  = "yogesh.yowan@gmail.com";

function isGoogleSignedIn(): boolean { return localStorage.getItem(LS_GOOGLE) === "true"; }
function setGoogleSignedIn() { localStorage.setItem(LS_GOOGLE, "true"); }
function isAdmin(): boolean { return localStorage.getItem(LS_ADMIN) === "true"; }
function getUserEmail(): string { return localStorage.getItem(LS_EMAIL) ?? ""; }
function saveUserEmail(email: string) {
  localStorage.setItem(LS_EMAIL, email.trim().toLowerCase());
  if (email.trim().toLowerCase() === ADMIN_EMAIL) {
    localStorage.setItem(LS_ADMIN, "true");
  }
}
function getCredits(): number {
  const v = localStorage.getItem(LS_CREDITS);
  return v === null ? -1 : parseInt(v, 10); // -1 = not initialized (not signed in)
}
function initCredits() { localStorage.setItem(LS_CREDITS, String(FREE_CREDITS)); }
export type GenerationType = "video" | "image" | "text";

function getCreditCost(type: GenerationType): number {
  if (type === "video")  return 10;
  if (type === "image")  return 5;
  return 1; // text / everything else
}

function decrementCredit(type: GenerationType) {
  if (isAdmin()) return FREE_CREDITS; // admin never loses credits
  const c = Math.max(0, getCredits() - getCreditCost(type));
  localStorage.setItem(LS_CREDITS, String(c));
  return c;
}

// ── Context ───────────────────────────────────────────────────────────────────
type GateCtx = {
  requestGeneration: (onProceed: () => void, type?: GenerationType) => void;
  credits: number;
  googleSignedIn: boolean;
  isAdminUser: boolean;
  userEmail: string;
};
const GenerationGateContext = createContext<GateCtx>({
  requestGeneration: (cb) => cb(),
  credits: FREE_CREDITS,
  googleSignedIn: false,
  isAdminUser: false,
  userEmail: "",
});
export function useGenerationGate() { return useContext(GenerationGateContext); }

// ── Provider ──────────────────────────────────────────────────────────────────
export function GenerationGateProvider({ children }: { children: React.ReactNode }) {
  const { profile, setShowOnboarding } = useUser();
  const [modal, setModal] = useState<"login" | "upgrade" | null>(null);
  const [loginStep, setLoginStep] = useState<"idle" | "opening" | "confirm" | "email">("idle");
  const [credits, setCredits] = useState<number>(() => {
    const c = getCredits();
    return c === -1 ? FREE_CREDITS : c;
  });
  const [googleSignedIn, setGoogleSignedInState] = useState(isGoogleSignedIn);
  const [isAdminUser, setIsAdminUser] = useState(isAdmin);
  const [userEmail, setUserEmailState] = useState(getUserEmail);

  const pendingRef  = useRef<(() => void) | null>(null);
  const pendingType = useRef<GenerationType>("text");

  // When onboarding completes → move to Google Sign-In gate
  const prevOnboarded = useRef(profile.onboardingComplete);
  useEffect(() => {
    if (!prevOnboarded.current && profile.onboardingComplete && pendingRef.current) {
      prevOnboarded.current = true;
      if (!isGoogleSignedIn()) {
        setModal("login");
        setLoginStep("idle");
      } else {
        resumeAfterLogin();
      }
    } else if (profile.onboardingComplete) {
      prevOnboarded.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.onboardingComplete]);

  function resumeAfterLogin() {
    const cb   = pendingRef.current;
    const type = pendingType.current;
    pendingRef.current = null;
    if (!cb) return;
    if (isAdmin()) { cb(); return; }
    const remaining = getCredits();
    if (remaining < getCreditCost(type)) {
      setModal("upgrade");
      return;
    }
    const newCount = decrementCredit(type);
    setCredits(newCount);
    cb();
    if (newCount <= 0) setTimeout(() => setModal("upgrade"), 800);
  }

  const requestGeneration = useCallback((onProceed: () => void, type: GenerationType = "text") => {
    // ── Gate 1: Onboarding ─────────────────────────────────
    if (!profile.onboardingComplete) {
      pendingRef.current  = onProceed;
      pendingType.current = type;
      setShowOnboarding(true);
      return;
    }
    // ── Gate 2: Google Sign-In ─────────────────────────────
    if (!isGoogleSignedIn()) {
      pendingRef.current  = onProceed;
      pendingType.current = type;
      setModal("login");
      setLoginStep("idle");
      return;
    }
    // ── Gate 3: Credits (admin bypasses) ───────────────────
    if (!isAdmin()) {
      const remaining = getCredits();
      if (remaining < getCreditCost(type)) {
        setModal("upgrade");
        return;
      }
    }
    // ── All gates passed ───────────────────────────────────
    if (isAdmin()) {
      onProceed();
    } else {
      const newCount = decrementCredit(type);
      setCredits(newCount);
      onProceed();
      if (newCount <= 0) setTimeout(() => setModal("upgrade"), 800);
    }
  }, [profile.onboardingComplete, setShowOnboarding]);

  function handleLoginSuccess(email: string) {
    const normalEmail = email.trim().toLowerCase();
    saveUserEmail(normalEmail);
    setUserEmailState(normalEmail);
    setGoogleSignedIn();
    setGoogleSignedInState(true);
    const adminNow = normalEmail === ADMIN_EMAIL;
    if (adminNow) setIsAdminUser(true);
    if (getCredits() === -1) {
      initCredits();
      if (!adminNow) setCredits(FREE_CREDITS);
    }
    setModal(null);
    setLoginStep("idle");
    // Resume pending — resumeAfterLogin reads isAdmin() from localStorage (already set)
    setTimeout(resumeAfterLogin, 50);
  }

  function closeModal() {
    setModal(null);
    setLoginStep("idle");
    pendingRef.current = null;
  }

  return (
    <GenerationGateContext.Provider value={{ requestGeneration, credits, googleSignedIn, isAdminUser, userEmail }}>
      {children}
      <AnimatePresence>
        {modal === "login" && (
          <LoginModal
            key="login"
            loginStep={loginStep}
            setLoginStep={setLoginStep}
            onSuccess={handleLoginSuccess}
            onClose={closeModal}
          />
        )}
        {modal === "upgrade" && (
          <UpgradeModal key="upgrade" onClose={closeModal} />
        )}
      </AnimatePresence>
    </GenerationGateContext.Provider>
  );
}

// ── Backdrop ──────────────────────────────────────────────────────────────────
function Backdrop({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      key="backdrop"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40"
    />
  );
}

// ── Google SVG ────────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  );
}

// ── Login Modal ───────────────────────────────────────────────────────────────
function LoginModal({
  loginStep, setLoginStep, onSuccess, onClose,
}: {
  loginStep: "idle" | "opening" | "confirm" | "email";
  setLoginStep: (s: "idle" | "opening" | "confirm" | "email") => void;
  onSuccess: (email: string) => void;
  onClose: () => void;
}) {
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState("");

  function openGoogle() {
    window.open(
      "https://accounts.google.com/signin",
      "ms_google_login",
      "width=480,height=600,scrollbars=yes,resizable=yes,left=200,top=100"
    );
    setLoginStep("opening");
    setTimeout(() => setLoginStep("confirm"), 3000);
  }

  function proceedToEmail() {
    setLoginStep("email");
  }

  function submitEmail() {
    const e = emailInput.trim().toLowerCase();
    if (!e.includes("@") || !e.includes(".")) {
      setEmailError("Please enter a valid Gmail address.");
      return;
    }
    setEmailError("");
    onSuccess(e);
  }

  return (
    <>
      <Backdrop onClose={onClose} />
      <motion.div
        key="login-modal"
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 24 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="bg-[#0d0d1c] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden">

          {/* Glow bar */}
          <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500" />

          {/* Email capture step */}
          {loginStep === "email" ? (
            <div className="p-6 space-y-5">
              <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors">
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-lg shrink-0">
                  <Zap className="w-6 h-6 text-white" fill="currentColor" />
                </div>
                <div>
                  <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Almost there!</p>
                  <h3 className="text-white font-extrabold text-xl leading-tight">Enter your Gmail</h3>
                </div>
              </div>
              <p className="text-white/45 text-sm">Enter the Gmail address you just used to sign in. This personalises your account and saves your credits.</p>
              <div className="space-y-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={e => { setEmailInput(e.target.value); setEmailError(""); }}
                  onKeyDown={e => e.key === "Enter" && submitEmail()}
                  placeholder="you@gmail.com"
                  autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:border-emerald-500/60 focus:bg-white/8 transition-all"
                />
                {emailError && <p className="text-red-400 text-xs">{emailError}</p>}
              </div>
              <button onClick={submitEmail}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-400 hover:to-blue-400 text-white font-bold rounded-xl h-12 transition-all shadow-lg">
                <Zap className="w-4 h-4" fill="currentColor" /> Activate My Credits
              </button>
              <p className="text-center text-[11px] text-white/20">
                By continuing you agree to our{" "}
                <a href="#" className="underline hover:text-white/40">Terms</a> &amp;{" "}
                <a href="#" className="underline hover:text-white/40">Privacy Policy</a>
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="relative p-6 pb-4">
                <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors">
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Step 2 of 2</p>
                    <h3 className="text-white font-extrabold text-xl leading-tight">Unlock 10 Free Generations</h3>
                  </div>
                </div>
                <p className="text-white/50 text-sm leading-relaxed">
                  Sign in with Google to get <strong className="text-emerald-400">10 free AI generations</strong> — no credit card, no catch.
                </p>
              </div>

              {/* Credits visual */}
              <div className="mx-6 mb-4 bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="text-2xl">⚡</div>
                <div>
                  <p className="text-white font-bold text-sm">{FREE_CREDITS} AI Credits — Free</p>
                  <p className="text-slate-500 text-xs">Text/Ads = 1 cr · Images = 5 cr · Videos = 10 cr</p>
                </div>
                <div className="ml-auto text-emerald-400 font-extrabold text-xl">{FREE_CREDITS}</div>
              </div>

              {/* Benefits */}
              <div className="px-6 pb-4 space-y-2">
                {[
                  "50 free credits — Blog, Ads, Social, Email, Images & Video…",
                  "Your Growth Plan & history saved to your account",
                  "Access to all Growth Hub features",
                  "No credit card required, ever",
                ].map(b => (
                  <div key={b} className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5 text-emerald-400" />
                    </div>
                    <span className="text-white/65 text-sm">{b}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="px-6 pb-6 space-y-3">
                {loginStep === "idle" && (
                  <button onClick={openGoogle}
                    className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-bold rounded-xl h-12 transition-all shadow-lg hover:shadow-xl hover:scale-[1.01]">
                    <GoogleIcon />
                    Continue with Google — Get 10 Free Generations
                  </button>
                )}
                {loginStep === "opening" && (
                  <div className="w-full flex items-center justify-center gap-3 bg-white/8 border border-white/10 rounded-xl h-12">
                    <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-white/60 text-sm">Google sign-in opening…</span>
                  </div>
                )}
                {loginStep === "confirm" && (
                  <div className="space-y-3">
                    <p className="text-center text-sm text-yellow-400/80 bg-yellow-400/5 border border-yellow-400/15 rounded-xl py-2">
                      ✅ Signed in on Google? Click below to continue.
                    </p>
                    <button onClick={proceedToEmail}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-400 hover:to-blue-400 text-white font-bold rounded-xl h-12 transition-all shadow-lg">
                      <Zap className="w-4 h-4" fill="currentColor" /> I've signed in — Continue
                    </button>
                    <button onClick={openGoogle} className="w-full text-center text-xs text-white/30 hover:text-white/50 transition-colors py-1">
                      Didn't open? Try again →
                    </button>
                  </div>
                )}
                <p className="text-center text-[11px] text-white/20">
                  By continuing you agree to our{" "}
                  <a href="#" className="underline hover:text-white/40">Terms</a> &amp;{" "}
                  <a href="#" className="underline hover:text-white/40">Privacy Policy</a>
                </p>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ── Upgrade Modal ─────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: "plus",
    name: "Plus",
    emoji: "⚡",
    priceINR: "₹699",
    priceUSD: "$8",
    period: "/mo",
    badge: "Most Popular",
    badgeColor: "from-emerald-500 to-teal-500",
    borderColor: "border-emerald-500/40",
    highlight: true,
    features: [
      "500 AI credits/month",
      "Blog Writer, Social, Ads, Email, SMS",
      "Claude AI — better writing quality",
      "10× longer outputs",
      "Priority generation queue",
      "Content history & saved projects",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    emoji: "👑",
    priceINR: "₹2,999",
    priceUSD: "$35",
    period: "/mo",
    badge: "Best Quality",
    badgeColor: "from-violet-500 to-purple-600",
    borderColor: "border-violet-500/30",
    highlight: false,
    features: [
      "3,000 AI credits/month",
      "Everything in Plus",
      "Claude 3 Opus — highest quality",
      "API access for automation",
      "White-label reports",
      "Team collaboration (5 seats)",
    ],
  },
  {
    id: "annual",
    name: "Annual",
    emoji: "🎯",
    priceINR: "₹4,999",
    priceUSD: "$59",
    period: "/yr",
    badge: "Best Value",
    badgeColor: "from-amber-500 to-orange-500",
    borderColor: "border-amber-500/30",
    highlight: false,
    features: [
      "Unlimited AI credits",
      "Everything in Pro",
      "WordPress hosting included",
      "Free .in domain + SSL",
      "Unlimited team seats",
      "Dedicated support",
    ],
  },
];

function UpgradeModal({ onClose }: { onClose: () => void }) {
  return (
    <>
      <Backdrop onClose={onClose} />
      <motion.div
        key="upgrade-modal"
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 24 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="bg-[#0a0a14] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto pointer-events-auto">

          {/* Glow bar */}
          <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-pink-500 to-amber-400" />

          {/* Header */}
          <div className="sticky top-0 bg-[#0a0a14] border-b border-white/8 px-6 py-5 z-10">
            <button onClick={onClose} className="absolute top-5 right-5 text-white/30 hover:text-white/70 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-extrabold text-xl leading-tight">You've Used All 10 Free Generations</h3>
                <p className="text-white/45 text-sm mt-0.5">
                  Upgrade for unlimited AI generations — Blog, Social, Ads, Email, SMS, Growth Hub and more.
                </p>
              </div>
            </div>

            {/* UPI badge */}
            <div className="flex items-center gap-3 bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-2.5">
              <Flame className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="flex-1">
                <p className="text-white text-xs font-semibold">Pay via PhonePe / GPay / UPI — INR pricing available</p>
                <p className="text-slate-500 text-[11px]">No international card needed · Instant activation</p>
              </div>
              <span className="text-emerald-400 text-xs font-bold bg-emerald-500/15 px-2 py-0.5 rounded-full">🇮🇳 India</span>
            </div>
          </div>

          {/* Plans */}
          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PLANS.map(plan => (
              <div key={plan.id}
                className={`relative flex flex-col rounded-xl border p-5 transition-all ${
                  plan.highlight
                    ? `${plan.borderColor} bg-gradient-to-b from-emerald-900/20 to-transparent shadow-[0_0_28px_rgba(16,185,129,0.12)]`
                    : `${plan.borderColor} bg-white/[0.025]`
                }`}>
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r ${plan.badgeColor} text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-lg`}>
                  {plan.badge}
                </div>

                <div className="mt-3 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{plan.emoji}</span>
                    <span className="text-white font-bold text-lg">{plan.name}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold text-white">{plan.priceINR}</span>
                    <span className="text-white/35 text-sm">{plan.period}</span>
                  </div>
                  <p className="text-white/30 text-xs mt-0.5">{plan.priceUSD} USD</p>
                </div>

                <ul className="flex-1 space-y-2 mb-5">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-white/60 text-xs">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => { window.location.href = "#pricing"; onClose(); }}
                  className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    plan.highlight
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg"
                      : "bg-white/8 hover:bg-white/15 text-white border border-white/10"
                  }`}>
                  Get {plan.name} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 text-center space-y-2 border-t border-white/5 pt-4">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-white/25">
              <span>✓ Pay via UPI / PhonePe / GPay</span>
              <span>·</span>
              <span>✓ INR pricing</span>
              <span>·</span>
              <span>✓ Cancel anytime</span>
              <span>·</span>
              <span>✓ Instant activation</span>
            </div>
            <button onClick={onClose} className="text-xs text-white/18 hover:text-white/35 transition-colors underline mt-1 block mx-auto">
              I'll upgrade later
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
