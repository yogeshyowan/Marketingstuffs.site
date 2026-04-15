import { useState, useEffect } from "react";
import { CheckCircle2, Zap, Crown, Package, Sparkles, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPlan, setPlan, getCredits, PLAN_CONFIG, CREDIT_COSTS, type Plan } from "@/lib/credits";

const CREDIT_EXAMPLES = [
  { action: "Short blog (600w)", cost: CREDIT_COSTS.blog_600.cost, model: "Claude Haiku", emoji: "📝" },
  { action: "Standard blog (900w)", cost: CREDIT_COSTS.blog_900.cost, model: "Claude Haiku", emoji: "📄" },
  { action: "Long-form blog (1400w)", cost: CREDIT_COSTS.blog_1400.cost, model: "Claude Sonnet", emoji: "📰" },
  { action: "In-depth blog (2000w)", cost: CREDIT_COSTS.blog_2000.cost, model: "Claude Sonnet", emoji: "📖" },
  { action: "Epic blog (3000w)", cost: CREDIT_COSTS.blog_3000.cost, model: "Claude Sonnet", emoji: "🏆" },
  { action: "Website section", cost: CREDIT_COSTS.website.cost, model: "Claude Sonnet", emoji: "🌐" },
  { action: "Writing tool (short)", cost: CREDIT_COSTS.tool_short.cost, model: "Claude Haiku", emoji: "✍️" },
  { action: "Writing tool (medium)", cost: CREDIT_COSTS.tool_medium.cost, model: "Claude Haiku", emoji: "🔧" },
];

const PLANS: { id: Plan; emoji: string; name: string; price: number; billing: string; oldPrice?: string; saveBadge: string; highlight: boolean; features: string[] }[] = [
  {
    id: "plus",
    emoji: "⚡",
    name: "Plus",
    price: 8,
    billing: "Billed as $97/yr",
    oldPrice: "$49",
    saveBadge: "Save 84%",
    highlight: true,
    features: [
      "500 AI Credits/month",
      "~62 credits per dollar paid",
      "Claude Haiku — fast, sharp writing",
      "Claude Sonnet — for long-form blogs",
      "35 language support",
      "All 104+ writing tools",
      "Social Media Manager",
      "Website Builder (5 sections)",
      "Image & Media Library",
    ],
  },
  {
    id: "pro",
    emoji: "👑",
    name: "Pro",
    price: 49,
    billing: "Billed as $599/yr",
    oldPrice: "$79",
    saveBadge: "Save 38%",
    highlight: false,
    features: [
      "3,000 AI Credits/month",
      "~62 credits per dollar paid",
      "Claude Haiku + Sonnet access",
      "Everything in Plus",
      "30 social media accounts",
      "250 scheduled posts",
      "Priority generation queue",
      "API access for automation",
      "Team collaboration (5 seats)",
    ],
  },
  {
    id: "bundle",
    emoji: "📦",
    name: "Bundle",
    price: 139,
    billing: "Annual plan only",
    oldPrice: "$709",
    saveBadge: "Save 80%",
    highlight: false,
    features: [
      "8,700 AI Credits/month",
      "~62 credits per dollar paid",
      "Marketingstuffs Pro (included)",
      "WordPress Hosting (Starter)",
      "Free .xyz domain + SSL",
      "n8n Automation (self-hosted)",
      "Unlimited team seats",
      "One-click publish to WordPress",
    ],
  },
];

export default function PricingSection() {
  const [activePlan, setActivePlan] = useState<Plan>("free");
  const [credits, setCredits] = useState(0);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    setActivePlan(getPlan());
    setCredits(getCredits());
    const id = setInterval(() => {
      setActivePlan(getPlan());
      setCredits(getCredits());
    }, 2000);
    return () => clearInterval(id);
  }, []);

  function activate(plan: Plan) {
    setPlan(plan);
    setActivePlan(plan);
    setCredits(PLAN_CONFIG[plan].credits);
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
          <p className="text-lg text-muted-foreground">
            Credits power all your AI generations. Paid plans use <span className="text-violet-400 font-semibold">Claude Haiku & Sonnet</span> — significantly better quality than free-tier models.
          </p>
        </div>

        {/* Credit cost table */}
        <div className="max-w-3xl mx-auto mb-16">
          <button
            onClick={() => setShowInfo(s => !s)}
            className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-white/3 border border-white/10 hover:border-white/20 transition-all text-left group"
          >
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-violet-400" />
              <span className="text-white/70 text-sm font-medium">How AI credits are calculated</span>
            </div>
            <span className="text-xs text-violet-400 group-hover:text-violet-300 transition-colors">{showInfo ? "Hide ↑" : "Show ↓"}</span>
          </button>

          {showInfo && (
            <div className="mt-3 rounded-2xl bg-[#0e0e1a] border border-white/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/8">
                <p className="text-xs text-white/50 leading-relaxed">
                  <span className="text-white font-semibold">Rate: 62.5 credits per $1 you pay us.</span> When you generate content, credits are consumed based on Claude's actual API cost × 3 (markup) × 20 credits/$. This funds Claude's superior AI quality vs. free models.
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
                        <td className="px-5 py-3 text-white/70">
                          <span className="mr-2">{ex.emoji}</span>{ex.action}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1 bg-violet-500/15 text-violet-300 px-2 py-0.5 rounded-full text-xs font-bold">
                            <Zap className="w-2.5 h-2.5" />{ex.cost}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className={`text-xs font-medium ${ex.model === "Claude Sonnet" ? "text-amber-400" : "text-violet-400"}`}>
                            {ex.model}
                          </span>
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
                  <p className="text-white font-semibold text-sm">
                    {PLAN_CONFIG[activePlan].name} plan active
                    <span className="ml-2 text-white/40 font-normal text-xs">(demo mode)</span>
                  </p>
                  <p className="text-emerald-400/70 text-xs">{credits.toLocaleString()} credits remaining this month · Claude AI enabled</p>
                </div>
              </div>
              <button
                onClick={() => activate("free")}
                className="text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                Reset to Free
              </button>
            </div>
          </div>
        )}

        {/* Plan cards */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto items-start">

          {/* Plus — highlighted in center */}
          {PLANS.map((plan, idx) => {
            const isActive = activePlan === plan.id;
            const cfg = PLAN_CONFIG[plan.id];
            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-8 border transition-all ${
                  plan.highlight
                    ? "border-primary/50 shadow-[0_0_40px_rgba(124,58,237,0.15)] bg-background z-10 lg:-mt-4"
                    : "border-white/10 bg-white/[0.02]"
                } ${isActive ? "ring-2 ring-emerald-500/50" : ""}`}
              >
                {plan.highlight && !isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-primary to-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Active (Demo)
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-3xl">{plan.emoji}</span>
                    <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                  </div>
                  <div className="inline-block bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-semibold">
                    {plan.saveBadge}
                  </div>
                </div>

                <div className="mb-6 pb-6 border-b border-white/10">
                  <div className="flex items-end gap-2 mb-1">
                    <span className="text-5xl font-bold text-white">${plan.price}</span>
                    <span className="text-muted-foreground mb-1">/month</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-white/40 line-through">{plan.oldPrice}</span>
                    <span className="text-white/60">{plan.billing}</span>
                  </div>
                  {/* Credits formula */}
                  <div className="mt-3 flex items-center gap-2 text-xs text-white/40">
                    <Zap className="w-3 h-3 text-violet-400" />
                    <span>{cfg.credits.toLocaleString()} credits ÷ ${plan.price} = <span className="text-violet-300 font-semibold">62.5 cr/$</span></span>
                  </div>
                </div>

                {isActive ? (
                  <button
                    onClick={() => activate("free")}
                    className="w-full flex items-center justify-center gap-2 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 rounded-full h-12 mb-8 text-base font-semibold transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Currently Active
                  </button>
                ) : (
                  <Button
                    onClick={() => activate(plan.id)}
                    className={`w-full rounded-full h-12 mb-8 text-base ${
                      plan.highlight
                        ? "bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 text-white"
                        : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                    }`}
                  >
                    Activate {plan.name} (Demo)
                  </Button>
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

        {/* Footer note */}
        <div className="text-center mt-12 space-y-3">
          <p className="text-sm text-white/40 max-w-2xl mx-auto">
            * Credits shared across all features. Claude Haiku is used for short/quick generations; Claude Sonnet for long-form blogs & website sections. Free plan uses open-source models (Gemma, Llama, Qwen) via OpenRouter.
          </p>
          <p className="text-xs text-white/25">
            Demo mode: Click "Activate" to simulate a plan in your browser. Real payments coming soon.
          </p>
        </div>
      </div>
    </section>
  );
}
