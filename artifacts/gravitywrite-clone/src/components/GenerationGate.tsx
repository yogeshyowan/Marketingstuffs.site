import { createContext, useCallback, useContext, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Zap, Crown, Check, ChevronRight, Star, Flame, Plus } from "lucide-react";
import { useUser } from "@/context/UserContext";
import {
  getPlan, getCreditCostForPlan,
  getCredits as getPaidCredits,
  deductCredits as deductPaidCredits,
  addCredits,
  TOPUP_PACKS,
  type Plan,
} from "@/lib/credits";

// ── Free-plan localStorage helpers ────────────────────────────────────────────
const LS_GOOGLE  = "ms_google_signed_in";
const LS_CREDITS = "ms_credits";
const LS_EMAIL   = "ms_user_email";
const LS_ADMIN   = "ms_is_admin";
const FREE_CREDITS = 50;
const ADMIN_EMAIL  = "yogesh.yowan@gmail.com";
const UPI_ID       = "marketingstuffs@upi";
const UPI_NAME     = "Marketingstuffs";

function isGoogleSignedIn(): boolean { return localStorage.getItem(LS_GOOGLE) === "true"; }
function setGoogleSignedIn() { localStorage.setItem(LS_GOOGLE, "true"); }
function isAdmin(): boolean { return localStorage.getItem(LS_ADMIN) === "true"; }
function getUserEmail(): string { return localStorage.getItem(LS_EMAIL) ?? ""; }
function saveUserEmail(email: string) {
  localStorage.setItem(LS_EMAIL, email.trim().toLowerCase());
  if (email.trim().toLowerCase() === ADMIN_EMAIL) localStorage.setItem(LS_ADMIN, "true");
}

// ── Free-plan credit helpers (ms_credits) ──────────────────────────────────
function getFreeCredits(): number {
  const v = localStorage.getItem(LS_CREDITS);
  return v === null ? -1 : parseInt(v, 10);
}
function initFreeCredits() { localStorage.setItem(LS_CREDITS, String(FREE_CREDITS)); }

// ── Plan-aware credit system ───────────────────────────────────────────────
export type GenerationType = "video" | "image" | "text";

function currentPlan(): Plan { return getPlan(); }
function isFree(): boolean { return currentPlan() === "free"; }

function getCreditCost(type: GenerationType): number {
  return getCreditCostForPlan(type, currentPlan());
}

function getRemainingCredits(): number {
  if (isFree()) {
    const c = getFreeCredits();
    return c === -1 ? FREE_CREDITS : c;
  }
  return getPaidCredits();
}

function decrementCredit(type: GenerationType): number {
  if (isAdmin()) return getRemainingCredits();
  const cost = getCreditCost(type);
  if (isFree()) {
    // Free plan: flat-rate deduction on generation start
    const c = Math.max(0, getFreeCredits() - cost);
    localStorage.setItem(LS_CREDITS, String(c));
    return c;
  } else {
    // Paid plan — text: NO upfront deduction (actual cost billed post-generation
    // via __usage event from API, handled by applyTextBilling() in each section).
    // image / video: flat deduction since these use Pollinations.ai (free API).
    if (type !== "text") {
      deductPaidCredits(cost);
    }
    return getPaidCredits();
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
type GateCtx = {
  requestGeneration: (onProceed: () => void, type?: GenerationType) => void;
  credits: number;
  googleSignedIn: boolean;
  isAdminUser: boolean;
  userEmail: string;
  userPlan: Plan;
};
const GenerationGateContext = createContext<GateCtx>({
  requestGeneration: (cb) => cb(),
  credits: FREE_CREDITS,
  googleSignedIn: false,
  isAdminUser: false,
  userEmail: "",
  userPlan: "free",
});
export function useGenerationGate() { return useContext(GenerationGateContext); }

// ── Provider ──────────────────────────────────────────────────────────────────
export function GenerationGateProvider({ children }: { children: React.ReactNode }) {
  const { profile, setShowOnboarding } = useUser();
  const [modal, setModal] = useState<"login" | "upgrade" | null>(null);
  const [loginStep, setLoginStep] = useState<"idle" | "opening" | "confirm" | "email">("idle");
  const [credits, setCredits] = useState<number>(() => {
    const plan = getPlan();
    if (plan !== "free") return getPaidCredits();
    const c = getFreeCredits();
    return c === -1 ? FREE_CREDITS : c;
  });
  const [userPlan, setUserPlan] = useState<Plan>(getPlan);
  const [googleSignedIn, setGoogleSignedInState] = useState(isGoogleSignedIn);
  const [isAdminUser, setIsAdminUser] = useState(isAdmin);
  const [userEmail, setUserEmailState] = useState(getUserEmail);

  const pendingRef  = useRef<(() => void) | null>(null);
  const pendingType = useRef<GenerationType>("text");

  // Sync credits from localStorage periodically (catches plan upgrades + top-ups)
  useEffect(() => {
    const id = setInterval(() => {
      const plan = getPlan();
      setUserPlan(plan);
      if (plan === "free") {
        const c = getFreeCredits();
        setCredits(c === -1 ? FREE_CREDITS : c);
      } else {
        setCredits(getPaidCredits());
      }
    }, 2000);
    return () => clearInterval(id);
  }, []);

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
    const remaining = getRemainingCredits();
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
      const remaining = getRemainingCredits();
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
    if (getFreeCredits() === -1) {
      initFreeCredits();
      if (!adminNow) setCredits(FREE_CREDITS);
    }
    setModal(null);
    setLoginStep("idle");
    setTimeout(resumeAfterLogin, 50);
  }

  function closeModal() {
    setModal(null);
    setLoginStep("idle");
    pendingRef.current = null;
  }

  return (
    <GenerationGateContext.Provider value={{ requestGeneration, credits, googleSignedIn, isAdminUser, userEmail, userPlan }}>
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
          <UpgradeModal key="upgrade" onClose={closeModal} currentPlan={userPlan} />
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

  function proceedToEmail() { setLoginStep("email"); }

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
          <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500" />

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
                    <h3 className="text-white font-extrabold text-xl leading-tight">Unlock 50 Free Credits</h3>
                  </div>
                </div>
                <p className="text-white/50 text-sm leading-relaxed">
                  Sign in with Google to get <strong className="text-emerald-400">50 free AI credits</strong> — no credit card, no catch.
                </p>
              </div>

              <div className="mx-6 mb-4 bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="text-2xl">⚡</div>
                <div>
                  <p className="text-white font-bold text-sm">{FREE_CREDITS} AI Credits — Free</p>
                  <p className="text-slate-500 text-xs">Text/Ads = 1 cr · Images = 5 cr · Videos = 10 cr</p>
                </div>
                <div className="ml-auto text-emerald-400 font-extrabold text-xl">{FREE_CREDITS}</div>
              </div>

              <div className="px-6 pb-4 space-y-2">
                {[
                  "50 free credits — Blog, Ads, Social, Email, Images & Video",
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

              <div className="px-6 pb-6 space-y-3">
                {loginStep === "idle" && (
                  <button onClick={openGoogle}
                    className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-bold rounded-xl h-12 transition-all shadow-lg hover:shadow-xl hover:scale-[1.01]">
                    <GoogleIcon />
                    Continue with Google — Get 50 Free Credits
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

// ── Upgrade Modal Plans ────────────────────────────────────────────────────────
const UPGRADE_PLANS = [
  {
    id: "plus",
    name: "Plus",
    emoji: "⚡",
    priceINR: "₹449",
    priceUSD: "$5",
    period: "/mo",
    credits: "312 credits/mo",
    rate: "$1 Claude = 186 credits",
    badge: "Most Popular",
    badgeColor: "from-emerald-500 to-teal-500",
    borderColor: "border-emerald-500/40",
    highlight: true,
    features: [
      "312 AI credits/month",
      "Text=1cr · Image=2cr · Video=5cr",
      "Claude AI — better quality",
      "10× longer outputs",
      "Priority generation queue",
      "Content history & saved projects",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    emoji: "👑",
    priceINR: "₹1,699",
    priceUSD: "$20",
    period: "/mo",
    credits: "1,250 credits/mo",
    rate: "$1 Claude = 182 credits",
    badge: "Best Quality",
    badgeColor: "from-violet-500 to-purple-600",
    borderColor: "border-violet-500/30",
    highlight: false,
    features: [
      "1,250 AI credits/month",
      "Text=1cr · Image=2cr · Video=5cr",
      "Everything in Plus",
      "Claude Sonnet — highest quality",
      "API access for automation",
      "Team collaboration (5 seats)",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    emoji: "🏢",
    priceINR: "₹4,199",
    priceUSD: "$50",
    period: "/mo",
    credits: "3,125 credits/mo",
    rate: "$1 Claude = 182 credits",
    badge: "Best Value",
    badgeColor: "from-amber-500 to-orange-500",
    borderColor: "border-amber-500/30",
    highlight: false,
    features: [
      "3,125 AI credits/month",
      "Text=1cr · Image=1cr · Video=3cr",
      "Everything in Pro",
      "Unlimited team seats",
      "White-label reports",
      "Dedicated support",
    ],
  },
];

// ── Top-Up UPI Modal ──────────────────────────────────────────────────────────
function TopUpModal({ pack, onClose, onSuccess }: {
  pack: typeof TOPUP_PACKS[number];
  onClose: () => void;
  onSuccess: (credits: number) => void;
}) {
  const [copied, setCopied] = useState(false);
  const upiNote = encodeURIComponent(`TopUp ${pack.credits} Credits - Marketingstuffs`);
  const upiLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${pack.priceINR}&cu=INR&tn=${upiNote}`;
  const phonepeLink = `phonepe://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${pack.priceINR}&cu=INR&tn=${upiNote}`;
  const gpayLink = `gpay://upi/pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${pack.priceINR}&cu=INR&tn=${upiNote}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}&bgcolor=0e0e1e&color=ffffff&margin=12`;

  function copyUPI() {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <Backdrop onClose={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 24 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="bg-[#0d0d1c] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm pointer-events-auto overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">Pay-as-you-go</p>
                <h3 className="text-white font-extrabold text-lg">{pack.label} Pack — {pack.credits} Credits</h3>
                <p className="text-white/40 text-xs mt-0.5">${pack.priceUSD} USD · ₹{pack.priceINR} INR</p>
              </div>
              <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center mb-4">
              <p className="text-slate-400 text-xs text-center mb-3">Scan QR with PhonePe, GPay, Paytm, BHIM or any UPI app</p>
              <div className="bg-white p-2.5 rounded-xl mb-3">
                <img src={qrUrl} alt="UPI QR" className="w-44 h-44 rounded-lg" loading="lazy" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-slate-400 text-xs">UPI ID:</span>
                <code className="text-white text-xs bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">{UPI_ID}</code>
                <button onClick={copyUPI} className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Star className="w-3 h-3" />}
                </button>
              </div>
              <p className="text-slate-500 text-xs">Amount: <span className="text-white font-semibold">₹{pack.priceINR}</span></p>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <a href={phonepeLink} className="flex items-center justify-center gap-2 bg-[#5f259f]/20 hover:bg-[#5f259f]/40 border border-[#5f259f]/30 text-purple-300 rounded-xl py-2.5 text-xs font-bold transition-colors">
                <span className="font-black text-[10px] bg-white text-[#5f259f] px-1 rounded">Pe</span> PhonePe
              </a>
              <a href={gpayLink} className="flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-300 rounded-xl py-2.5 text-xs font-bold transition-colors">
                <span className="font-black text-[10px]">G</span> Google Pay
              </a>
            </div>

            <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-3 mb-4">
              <p className="text-amber-300 text-xs text-center leading-relaxed">
                After payment, WhatsApp your UPI ref to <span className="text-white font-semibold">+91 support</span> or email <span className="text-white font-semibold">support@marketingstuffs.site</span> to get credits within 2 hours.
              </p>
            </div>

            <button
              onClick={() => { onSuccess(pack.credits); onClose(); }}
              className="w-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 rounded-xl py-2.5 text-xs font-bold transition-colors"
            >
              ✓ Already paid — Add {pack.credits} credits (Demo)
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ── Upgrade Modal ─────────────────────────────────────────────────────────────
function UpgradeModal({ onClose, currentPlan }: { onClose: () => void; currentPlan: Plan }) {
  const [topUpPack, setTopUpPack] = useState<typeof TOPUP_PACKS[number] | null>(null);
  const [creditsAdded, setCreditsAdded] = useState(0);
  const isPaid = currentPlan !== "free";

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
                {isPaid ? (
                  <>
                    <h3 className="text-white font-extrabold text-xl leading-tight">Monthly Credits Used Up</h3>
                    <p className="text-white/45 text-sm mt-0.5">Top up instantly to keep generating, or upgrade for more monthly credits.</p>
                  </>
                ) : (
                  <>
                    <h3 className="text-white font-extrabold text-xl leading-tight">You've Used All 50 Free Credits</h3>
                    <p className="text-white/45 text-sm mt-0.5">Top up credits instantly <span className="text-amber-400">without upgrading</span>, or choose a paid plan for monthly allowances.</p>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-2.5">
              <Flame className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="flex-1">
                <p className="text-white text-xs font-semibold">Pay via PhonePe / GPay / UPI — INR pricing available</p>
                <p className="text-slate-500 text-[11px]">No international card needed · Instant activation</p>
              </div>
              <span className="text-emerald-400 text-xs font-bold bg-emerald-500/15 px-2 py-0.5 rounded-full">🇮🇳 India</span>
            </div>
          </div>

          {/* Pay-as-you-go top-up — shown prominently for all plans */}
          <div className="px-6 pt-5">
            <div className="flex items-center gap-2 mb-3">
              <Plus className="w-4 h-4 text-amber-400" />
              <span className="text-white font-bold text-sm">Top Up Credits — Instant Refill</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">Pay-as-you-go</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {TOPUP_PACKS.map(pack => (
                <button
                  key={pack.id}
                  onClick={() => setTopUpPack(pack)}
                  className="flex flex-col items-center p-3.5 rounded-xl border border-white/10 bg-white/[0.025] hover:border-amber-500/40 hover:bg-amber-500/5 transition-all group"
                >
                  <span className="text-amber-400 font-extrabold text-lg leading-none mb-1">{pack.credits}</span>
                  <span className="text-white/60 text-[10px] mb-2">credits</span>
                  <span className="text-white font-bold text-xs">₹{pack.priceINR}</span>
                  <span className="text-white/30 text-[10px]">${pack.priceUSD}</span>
                  <span className="text-[9px] text-amber-400/60 mt-1.5 border border-amber-500/20 px-2 py-0.5 rounded-full group-hover:border-amber-500/40">{pack.label}</span>
                </button>
              ))}
            </div>
            {creditsAdded > 0 && (
              <p className="text-emerald-400 text-xs text-center mt-2 font-semibold">✓ +{creditsAdded} credits added!</p>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 px-6 py-4">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-white/25 text-xs">or choose a plan for monthly credits</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Plans */}
          <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {UPGRADE_PLANS.map(plan => (
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
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-2xl">{plan.emoji}</span>
                    <span className="text-white font-bold text-lg">{plan.name}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold text-white">{plan.priceINR}</span>
                    <span className="text-white/35 text-sm">{plan.period}</span>
                  </div>
                  <p className="text-white/30 text-xs mt-0.5">{plan.priceUSD} USD</p>
                  <div className="mt-2 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span className="text-amber-400/70 text-[10px] font-semibold">{plan.credits}</span>
                  </div>
                  <p className="text-white/20 text-[10px] mt-0.5">{plan.rate}</p>
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

      {/* Top-up UPI modal */}
      <AnimatePresence>
        {topUpPack && (
          <TopUpModal
            key="topup"
            pack={topUpPack}
            onClose={() => setTopUpPack(null)}
            onSuccess={(n) => {
              // Write to the correct credit store based on current plan
              if (currentPlan === "free") {
                const cur = parseInt(localStorage.getItem(LS_CREDITS) || "0", 10);
                localStorage.setItem(LS_CREDITS, String(Math.max(0, cur) + n));
              } else {
                addCredits(n);
              }
              setCreditsAdded(n);
              setTopUpPack(null);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
