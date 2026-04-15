import { useState, useEffect } from "react";
import { CheckCircle2, Zap, Crown, Sparkles, Info, X, Copy, Check, QrCode, Smartphone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPlan, setPlan, getCredits, addCredits, PLAN_CONFIG, CREDIT_COSTS, TOPUP_PACKS, type Plan } from "@/lib/credits";

const UPI_ID   = "marketingstuffs@upi";
const UPI_NAME = "Marketingstuffs";

const CREDIT_EXAMPLES = [
  { action: "Short blog (600w)",    cost: CREDIT_COSTS.blog_600.cost,    model: "Claude Haiku",  emoji: "📝" },
  { action: "Standard blog (900w)", cost: CREDIT_COSTS.blog_900.cost,    model: "Claude Haiku",  emoji: "📄" },
  { action: "Long-form blog (1400w)",cost: CREDIT_COSTS.blog_1400.cost,  model: "Claude Sonnet", emoji: "📰" },
  { action: "In-depth blog (2000w)",cost: CREDIT_COSTS.blog_2000.cost,   model: "Claude Sonnet", emoji: "📖" },
  { action: "Epic blog (3000w)",    cost: CREDIT_COSTS.blog_3000.cost,   model: "Claude Sonnet", emoji: "🏆" },
  { action: "Website section",      cost: CREDIT_COSTS.website.cost,     model: "Claude Sonnet", emoji: "🌐" },
  { action: "Writing tool (short)", cost: CREDIT_COSTS.tool_short.cost,  model: "Claude Haiku",  emoji: "✍️" },
  { action: "Writing tool (medium)",cost: CREDIT_COSTS.tool_medium.cost, model: "Claude Haiku",  emoji: "🔧" },
  { action: "Image generation",     cost: 2,                              model: "Pollinations",  emoji: "🎨" },
  { action: "Video generation",     cost: 5,                              model: "AI Video",      emoji: "🎬" },
];

// ── Plans ──────────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: "plus" as Plan,
    emoji: "⚡",
    name: "Plus",
    priceUSD: 5,
    priceINR: 449,
    billingUSD: "Billed as $60/yr",
    billingINR: "₹5,388/yr",
    credits: 312,
    rate: "$1 Claude = 186 credits",
    oldPrice: "$15",
    saveBadge: "Best Starter",
    highlight: true,
    features: [
      "312 AI credits/month",
      "Text=1cr · Image=2cr · Video=5cr",
      "$1 of Claude = 186 credits used",
      "Claude Haiku — fast, sharp writing",
      "Claude Sonnet — for long-form blogs",
      "All writing & marketing tools",
      "Content history & saved projects",
    ],
  },
  {
    id: "pro" as Plan,
    emoji: "👑",
    name: "Pro",
    priceUSD: 20,
    priceINR: 1699,
    billingUSD: "Billed as $240/yr",
    billingINR: "₹20,388/yr",
    credits: 1250,
    rate: "$1 Claude = 182 credits",
    oldPrice: "$49",
    saveBadge: "Most Popular",
    highlight: false,
    features: [
      "1,250 AI credits/month",
      "Text=1cr · Image=2cr · Video=5cr",
      "$1 of Claude = 182 credits used",
      "Claude Haiku + Sonnet access",
      "API access for automation",
      "Team collaboration (5 seats)",
      "Priority generation queue",
    ],
  },
  {
    id: "enterprise" as Plan,
    emoji: "🏢",
    name: "Enterprise",
    priceUSD: 50,
    priceINR: 4199,
    billingUSD: "Billed as $600/yr",
    billingINR: "₹50,388/yr",
    credits: 3125,
    rate: "$1 Claude = 182 credits",
    oldPrice: "$139",
    saveBadge: "Best Value",
    highlight: false,
    features: [
      "3,125 AI credits/month",
      "Text=1cr · Image=1cr · Video=3cr",
      "$1 of Claude = 182 credits used",
      "Everything in Pro",
      "Unlimited team seats",
      "White-label reports",
      "Dedicated support",
    ],
  },
];

interface PaymentPlan {
  id: Plan;
  name: string;
  emoji: string;
  priceUSD: number;
  priceINR: number;
  inrBilling: string;
  credits: number;
}

const PAYMENT_PLANS: PaymentPlan[] = PLANS.map(p => ({
  id: p.id,
  name: p.name,
  emoji: p.emoji,
  priceUSD: p.priceUSD,
  priceINR: p.priceINR,
  inrBilling: p.billingINR,
  credits: p.credits,
}));

// ── UPI Payment Modal ─────────────────────────────────────────────────────────
function UPIPaymentModal({ plan, amount, label, onClose }: {
  plan?: PaymentPlan;
  amount?: number;
  label?: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [payMethod, setPayMethod] = useState<"qr" | "upi">("qr");

  const displayName = plan ? `${plan.name} Plan` : label ?? "Top-Up";
  const displayAmount = plan ? plan.priceINR : amount ?? 0;
  const upiNote = encodeURIComponent(`${displayName} - Marketingstuffs`);
  const upiLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${displayAmount}&cu=INR&tn=${upiNote}`;
  const phonepeLink = `phonepe://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${displayAmount}&cu=INR&tn=${upiNote}`;
  const gpayLink = `gpay://upi/pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${displayAmount}&cu=INR&tn=${upiNote}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiLink)}&bgcolor=0e0e1e&color=ffffff&margin=12`;

  function copyUPI() {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0e0e1e] border border-white/15 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-violet-900/40 to-indigo-900/40 border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              {plan && <span className="text-2xl">{plan.emoji}</span>}
              <span className="text-white font-bold text-lg">{displayName}</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-white">₹{displayAmount.toLocaleString("en-IN")}</span>
              {plan && <span className="text-slate-400 text-sm">/month</span>}
              {plan && <span className="text-xs text-slate-500">({plan.inrBilling})</span>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/8 text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex border-b border-white/8">
          <button onClick={() => setPayMethod("qr")} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${payMethod === "qr" ? "text-white border-b-2 border-violet-500" : "text-slate-500 hover:text-slate-300"}`}>
            <QrCode size={15} /> Scan QR Code
          </button>
          <button onClick={() => setPayMethod("upi")} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${payMethod === "upi" ? "text-white border-b-2 border-violet-500" : "text-slate-500 hover:text-slate-300"}`}>
            <Smartphone size={15} /> Pay via App
          </button>
        </div>

        <div className="p-6">
          {payMethod === "qr" ? (
            <div className="flex flex-col items-center">
              <p className="text-slate-400 text-sm text-center mb-5">Scan with any UPI app — PhonePe, Google Pay, Paytm, BHIM, or your bank app</p>
              <div className="bg-white p-3 rounded-2xl mb-4">
                <img src={qrUrl} alt={`UPI QR Code for ₹${displayAmount}`} className="w-48 h-48 rounded-xl" loading="lazy" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-slate-400 text-xs">UPI ID:</span>
                <code className="text-white text-xs bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg">{UPI_ID}</code>
                <button onClick={copyUPI} className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                </button>
              </div>
              <p className="text-slate-500 text-xs text-center">Amount: <span className="text-white font-semibold">₹{displayAmount.toLocaleString("en-IN")}</span></p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-slate-400 text-sm text-center mb-4">Open your preferred UPI app to pay ₹{displayAmount.toLocaleString("en-IN")}</p>
              <a href={phonepeLink} className="flex items-center gap-3 bg-[#5f259f] hover:bg-[#7b32c7] border border-[#8b45d7] text-white rounded-2xl px-5 py-3.5 transition-colors w-full">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0"><span className="text-[#5f259f] font-black text-sm">Pe</span></div>
                <div><p className="font-bold text-sm">Pay with PhonePe</p><p className="text-purple-300 text-xs">UPI · Instant · Secure</p></div>
              </a>
              <a href={gpayLink} className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl px-5 py-3.5 transition-colors w-full">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#4285F4"/><text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">G</text></svg>
                </div>
                <div><p className="font-bold text-sm">Pay with Google Pay</p><p className="text-slate-400 text-xs">UPI · Instant · Secure</p></div>
              </a>
              <a href={upiLink} className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl px-5 py-3.5 transition-colors w-full">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0"><span className="text-white font-black text-xs">UPI</span></div>
                <div><p className="font-bold text-sm">Any UPI App</p><p className="text-slate-400 text-xs">Paytm, BHIM, Bank app, etc.</p></div>
              </a>
              <div className="mt-2 flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5">
                <span className="text-slate-400 text-xs shrink-0">UPI ID:</span>
                <code className="text-white text-xs flex-1">{UPI_ID}</code>
                <button onClick={copyUPI} className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors shrink-0">
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                </button>
              </div>
            </div>
          )}

          <div className="mt-5 p-3 bg-amber-500/8 border border-amber-500/20 rounded-xl">
            <p className="text-amber-300 text-xs text-center leading-relaxed">
              After payment, share the UPI reference number at <span className="text-white font-semibold">support@marketingstuffs.site</span> to activate within 24 hours.
            </p>
          </div>
          <div className="mt-3 flex items-center justify-center gap-4 text-slate-600 text-xs">
            <span className="flex items-center gap-1">🔒 256-bit secure</span>
            <span className="flex items-center gap-1">🇮🇳 RBI regulated UPI</span>
            <span className="flex items-center gap-1">⚡ Instant transfer</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function PricingSection() {
  const [activePlan, setActivePlan] = useState<Plan>("free");
  const [credits, setCredits] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState<PaymentPlan | null>(null);
  const [topupPack, setTopupPack] = useState<typeof TOPUP_PACKS[number] | null>(null);
  const [showINR, setShowINR] = useState(true);
  const [topupAdded, setTopupAdded] = useState<number | null>(null);

  useEffect(() => {
    setActivePlan(getPlan());
    setCredits(getCredits());
    const id = setInterval(() => { setActivePlan(getPlan()); setCredits(getCredits()); }, 2000);
    return () => clearInterval(id);
  }, []);

  function activate(plan: Plan) {
    setPlan(plan);
    setActivePlan(plan);
    setCredits(PLAN_CONFIG[plan].credits);
  }

  function handleTopupPay(pack: typeof TOPUP_PACKS[number]) {
    // Demo: immediately add credits
    addCredits(pack.credits);
    setCredits(getCredits());
    setTopupAdded(pack.credits);
    setTopupPack(null);
    setTimeout(() => setTopupAdded(null), 4000);
  }

  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/10 to-transparent pointer-events-none" />
      <div className="container px-4 mx-auto">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold mb-4">
            <Zap className="w-3.5 h-3.5" />
            AI Credits — Simple, Transparent Pricing
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            One subscription. Every AI tool you need.
          </h2>
          <p className="text-lg text-muted-foreground mb-4">
            Credits power all AI generations. Paid plans use <span className="text-violet-400 font-semibold">Claude Haiku & Sonnet</span> — significantly better quality than free-tier models. Run out mid-month? <span className="text-amber-400 font-semibold">Top up anytime.</span>
          </p>
          <div className="inline-flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-full p-1">
            <button onClick={() => setShowINR(false)} className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${!showINR ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"}`}>USD ($)</button>
            <button onClick={() => setShowINR(true)} className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${showINR ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"}`}>🇮🇳 INR (₹)</button>
          </div>
          {showINR && <p className="text-slate-500 text-xs mt-2">Pay via PhonePe, Google Pay, or any UPI app</p>}
        </div>

        {/* Credit cost info table */}
        <div className="max-w-3xl mx-auto mb-16">
          <button onClick={() => setShowInfo(s => !s)} className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-white/3 border border-white/10 hover:border-white/20 transition-all text-left group">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-violet-400" />
              <span className="text-white/70 text-sm font-medium">How AI credits are calculated — paid plans</span>
            </div>
            <span className="text-xs text-violet-400 group-hover:text-violet-300 transition-colors">{showInfo ? "Hide ↑" : "Show ↓"}</span>
          </button>

          {showInfo && (
            <div className="mt-3 rounded-2xl bg-[#0e0e1a] border border-white/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/8">
                <p className="text-xs text-white/50 leading-relaxed">
                  <span className="text-white font-semibold">Plus:</span> $1 of Claude API billing = 186 credits consumed.{" "}
                  <span className="text-white font-semibold">Pro & Enterprise:</span> $1 of Claude API billing = 182 credits consumed.{" "}
                  Free plan uses flat rate: Text=1cr, Image=5cr, Video=10cr.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/8">
                      <th className="text-left px-5 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">Action</th>
                      <th className="text-center px-4 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">Credits Used</th>
                      <th className="text-right px-5 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">AI Model</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CREDIT_EXAMPLES.map((ex, i) => (
                      <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                        <td className="px-5 py-3 text-white/70"><span className="mr-2">{ex.emoji}</span>{ex.action}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1 bg-violet-500/15 text-violet-300 px-2 py-0.5 rounded-full text-xs font-bold">
                            <Zap className="w-2.5 h-2.5" />{ex.cost}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className={`text-xs font-medium ${ex.model === "Claude Sonnet" ? "text-amber-400" : ex.model === "Pollinations" ? "text-pink-400" : ex.model === "AI Video" ? "text-blue-400" : "text-violet-400"}`}>{ex.model}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Active plan banner */}
        {activePlan !== "free" && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex items-center justify-between px-5 py-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-white font-semibold text-sm">{PLAN_CONFIG[activePlan].name} plan active <span className="ml-2 text-white/40 font-normal text-xs">(demo mode)</span></p>
                  <p className="text-emerald-400/70 text-xs">{credits.toLocaleString()} credits remaining · Claude AI enabled</p>
                </div>
              </div>
              <button onClick={() => activate("free")} className="text-xs text-white/30 hover:text-white/60 transition-colors">Reset to Free</button>
            </div>
          </div>
        )}

        {/* Plan cards */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto items-start mb-20">
          {PLANS.map((plan) => {
            const isActive = activePlan === plan.id;
            const payPlan = PAYMENT_PLANS.find(p => p.id === plan.id)!;
            return (
              <div key={plan.id} className={`relative rounded-3xl p-8 border transition-all ${
                plan.highlight
                  ? "border-primary/50 shadow-[0_0_40px_rgba(124,58,237,0.15)] bg-background z-10 lg:-mt-4"
                  : "border-white/10 bg-white/[0.02]"
              } ${isActive ? "ring-2 ring-emerald-500/50" : ""}`}>
                {plan.highlight && !isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-primary to-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{plan.saveBadge}</div>
                )}
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Active (Demo)
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2"><span className="text-3xl">{plan.emoji}</span><h3 className="text-2xl font-bold text-white">{plan.name}</h3></div>
                  <div className="inline-block bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-semibold">{plan.saveBadge}</div>
                </div>

                <div className="mb-6 pb-6 border-b border-white/10">
                  {showINR ? (
                    <>
                      <div className="flex items-end gap-2 mb-1"><span className="text-5xl font-bold text-white">₹{plan.priceINR.toLocaleString("en-IN")}</span><span className="text-muted-foreground mb-1">/month</span></div>
                      <div className="text-sm text-white/60">{plan.billingINR}</div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-end gap-2 mb-1"><span className="text-5xl font-bold text-white">${plan.priceUSD}</span><span className="text-muted-foreground mb-1">/month</span></div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-white/40 line-through">{plan.oldPrice}</span>
                        <span className="text-white/60">{plan.billingUSD}</span>
                      </div>
                    </>
                  )}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <Zap className="w-3 h-3 text-violet-400" />
                      <span><span className="text-violet-300 font-semibold">{plan.credits.toLocaleString()} credits/month</span></span>
                    </div>
                    <p className="text-[11px] text-white/25">{plan.rate}</p>
                  </div>
                </div>

                {/* CTA */}
                {isActive ? (
                  <button onClick={() => activate("free")} className="w-full flex items-center justify-center gap-2 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 rounded-full h-12 mb-3 text-base font-semibold transition-all">
                    <CheckCircle2 className="w-4 h-4" /> Currently Active
                  </button>
                ) : (
                  <>
                    {showINR ? (
                      <button onClick={() => setPaymentPlan(payPlan)} className={`w-full flex items-center justify-center gap-2 rounded-full h-12 mb-3 text-base font-bold transition-all ${plan.highlight ? "bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 text-white" : "bg-white/10 hover:bg-white/20 text-white border border-white/20"}`}>
                        <span>💳</span> Pay ₹{plan.priceINR.toLocaleString("en-IN")}/mo
                      </button>
                    ) : (
                      <Button onClick={() => activate(plan.id)} className={`w-full rounded-full h-12 mb-3 text-base ${plan.highlight ? "bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 text-white" : "bg-white/10 hover:bg-white/20 text-white border border-white/20"}`}>
                        Activate {plan.name} (Demo)
                      </Button>
                    )}
                    {showINR && (
                      <div className="flex items-center gap-2 mb-5">
                        <button onClick={() => setPaymentPlan(payPlan)} className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-xl bg-[#5f259f]/20 hover:bg-[#5f259f]/40 text-purple-300 border border-[#5f259f]/30 transition-colors">
                          <span className="font-black text-[10px] bg-white text-[#5f259f] px-1 rounded">Pe</span> PhonePe
                        </button>
                        <button onClick={() => setPaymentPlan(payPlan)} className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 transition-colors">
                          <span className="font-black text-[10px]">G</span> GPay
                        </button>
                        <button onClick={() => setPaymentPlan(payPlan)} className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 transition-colors">
                          <QrCode size={11} /> UPI
                        </button>
                      </div>
                    )}
                    {!showINR && <div className="mb-5" />}
                  </>
                )}

                <ul className="space-y-3">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-3">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlight ? "text-primary" : "text-white/30"}`} />
                      <span className="text-white/75 text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* ── Pay-as-you-go Top-Up ─────────────────────────────────────────── */}
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-950/20 to-orange-950/10 p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-xl">Pay-as-you-go Top-Up</h3>
                <p className="text-white/45 text-sm">Run out of credits mid-month? Refill instantly — no plan change needed.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-6 bg-amber-500/8 border border-amber-500/15 rounded-xl px-4 py-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-amber-300/80 text-xs">Top-up credits never expire · Works on all plans including Free · Pay via UPI/PhonePe/GPay</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              {TOPUP_PACKS.map(pack => (
                <div key={pack.id} className="relative rounded-2xl border border-white/10 bg-white/[0.025] hover:border-amber-500/40 hover:bg-amber-500/5 transition-all p-5 flex flex-col">
                  {pack.label === "Value" && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap">Most Popular</div>
                  )}
                  <div className="mb-3 mt-1">
                    <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-1">{pack.label} Pack</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-extrabold text-amber-400">{pack.credits}</span>
                      <span className="text-white/40 text-sm">credits</span>
                    </div>
                  </div>
                  <div className="flex-1" />
                  <div className="mb-4">
                    <span className="text-white font-bold text-xl">₹{pack.priceINR}</span>
                    <span className="text-white/30 text-sm ml-1">(${pack.priceUSD})</span>
                    <p className="text-white/25 text-xs mt-0.5">{pack.desc}</p>
                  </div>
                  <button
                    onClick={() => setTopupPack(pack)}
                    className="w-full flex items-center justify-center gap-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-xl py-2.5 text-sm font-bold transition-all"
                  >
                    <Plus className="w-4 h-4" /> Top Up Now
                  </button>
                </div>
              ))}
            </div>

            {topupAdded && (
              <div className="text-center py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <p className="text-emerald-400 font-bold text-sm">✓ +{topupAdded} credits added to your account!</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer note */}
        <div className="text-center mt-12 space-y-3">
          <div className="flex items-center justify-center gap-6 text-sm text-white/40 mb-2">
            <span>🔒 Secure UPI Payments</span>
            <span>🇮🇳 PhonePe & Google Pay</span>
            <span>⚡ Instant Activation</span>
          </div>
          <p className="text-sm text-white/40 max-w-2xl mx-auto">
            * Free plan: Text=1cr, Image=5cr, Video=10cr (open-source models via OpenRouter). Paid plans use Claude Haiku & Sonnet with lower per-generation credit costs. Top-up credits work across all plans and never expire.
          </p>
        </div>
      </div>

      {paymentPlan && <UPIPaymentModal plan={paymentPlan} onClose={() => setPaymentPlan(null)} />}
      {topupPack && (
        <UPIPaymentModal
          amount={topupPack.priceINR}
          label={`${topupPack.label} Top-Up (${topupPack.credits} credits)`}
          onClose={() => setTopupPack(null)}
        />
      )}
    </section>
  );
}
