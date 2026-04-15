// ── Plan definitions ───────────────────────────────────────────
export type Plan = "free" | "plus" | "pro" | "enterprise";

export const PLAN_CONFIG = {
  free:       { name: "Free",       credits: 50,   price: 0,  priceINR: 0,    label: "Free",       color: "text-white/40",    badge: "bg-white/10" },
  plus:       { name: "Plus",       credits: 312,  price: 5,  priceINR: 449,  label: "$5/mo",      color: "text-violet-400",  badge: "bg-violet-500/20 border border-violet-500/30" },
  pro:        { name: "Pro",        credits: 1250, price: 20, priceINR: 1699, label: "$20/mo",     color: "text-amber-400",   badge: "bg-amber-500/20 border border-amber-500/30" },
  enterprise: { name: "Enterprise", credits: 3125, price: 50, priceINR: 4199, label: "$50/mo",     color: "text-emerald-400", badge: "bg-emerald-500/20 border border-emerald-500/30" },
} as const satisfies Record<Plan, { name: string; credits: number; price: number; priceINR: number; label: string; color: string; badge: string }>;

// ── Credit billing rates (credits consumed per $1 of Claude API cost) ──────
// Free plan: flat rate (1 text / 5 image / 10 video)
// Plus:       $1 Claude = 186 credits consumed
// Pro:        $1 Claude = 182 credits consumed
// Enterprise: $1 Claude = 182 credits consumed
export const CREDITS_PER_CLAUDE_DOLLAR: Record<Plan, number> = {
  free:       0,   // N/A — flat rate
  plus:       186,
  pro:        182,
  enterprise: 182,
};

// ── Credit costs per action (for free plan) ────────────────────
// Free plan flat costs — text=1, image=5, video=10
// Paid plans use lower rates (see getCreditCostForPlan)
export const CREDIT_COSTS = {
  blog_600:    { cost: 5,  model: "haiku",  label: "Short blog (~600w)" },
  blog_900:    { cost: 8,  model: "haiku",  label: "Standard blog (~900w)" },
  blog_1400:   { cost: 12, model: "sonnet", label: "Long-form blog (~1400w)" },
  blog_2000:   { cost: 18, model: "sonnet", label: "In-depth blog (~2000w)" },
  blog_3000:   { cost: 25, model: "sonnet", label: "Epic blog (~3000w)" },
  website:     { cost: 12, model: "sonnet", label: "Website section" },
  tool_short:  { cost: 2,  model: "haiku",  label: "Writing tool (short)" },
  tool_medium: { cost: 4,  model: "haiku",  label: "Writing tool (medium)" },
  social:      { cost: 2,  model: "haiku",  label: "Social post" },
  ad:          { cost: 4,  model: "haiku",  label: "Ad copy" },
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

// Map word count to credit action key
export function blogCreditKey(wordCount: number): CreditAction {
  if (wordCount <= 700) return "blog_600";
  if (wordCount <= 1100) return "blog_900";
  if (wordCount <= 1700) return "blog_1400";
  if (wordCount <= 2500) return "blog_2000";
  return "blog_3000";
}

// ── Pay-as-you-go Top-Up Packs ────────────────────────────────
export const TOPUP_PACKS = [
  { id: "topup_100",  credits: 100,  priceUSD: 1,  priceINR: 99,  label: "Starter",  desc: "Quick refill" },
  { id: "topup_500",  credits: 500,  priceUSD: 4,  priceINR: 349, label: "Value",    desc: "Most popular" },
  { id: "topup_1500", credits: 1500, priceUSD: 10, priceINR: 849, label: "Power",    desc: "Best per credit" },
] as const;

// ── localStorage keys ──────────────────────────────────────────
const LS_PLAN    = "marketingstuffs_plan";
const LS_CREDITS = "marketingstuffs_credits";
const LS_MONTH   = "marketingstuffs_credit_month";

function monthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ── State getters/setters ──────────────────────────────────────
export function getPlan(): Plan {
  const p = localStorage.getItem(LS_PLAN) as Plan | null;
  return (p && p in PLAN_CONFIG) ? p : "free";
}

export function setPlan(plan: Plan): void {
  localStorage.setItem(LS_PLAN, plan);
  localStorage.setItem(LS_CREDITS, String(PLAN_CONFIG[plan].credits));
  localStorage.setItem(LS_MONTH, monthKey());
}

export function getCredits(): number {
  const stored = localStorage.getItem(LS_CREDITS);
  const plan = getPlan();
  const storedMonth = localStorage.getItem(LS_MONTH);

  // Monthly reset for paid plans
  if (storedMonth !== monthKey()) {
    const fresh = PLAN_CONFIG[plan].credits;
    localStorage.setItem(LS_CREDITS, String(fresh));
    localStorage.setItem(LS_MONTH, monthKey());
    return fresh;
  }

  if (stored === null) {
    const fresh = PLAN_CONFIG[plan].credits;
    localStorage.setItem(LS_CREDITS, String(fresh));
    return fresh;
  }
  return Math.max(0, parseInt(stored, 10));
}

export function getTotalCredits(): number {
  return PLAN_CONFIG[getPlan()].credits;
}

export function deductCredits(amount: number): boolean {
  const current = getCredits();
  if (current < amount) return false;
  localStorage.setItem(LS_CREDITS, String(current - amount));
  return true;
}

export function addCredits(amount: number): void {
  const current = getCredits();
  localStorage.setItem(LS_CREDITS, String(current + amount));
}

export function hasCredits(amount: number): boolean {
  return getCredits() >= amount;
}

export function isFreeUser(): boolean {
  return getPlan() === "free";
}

// ── Plan-aware credit cost per generation type ─────────────────
// Free:       text=1,  image=5,  video=10
// Plus:       text=1,  image=2,  video=5   ($1 Claude = 186 cr)
// Pro:        text=1,  image=2,  video=5   ($1 Claude = 182 cr)
// Enterprise: text=1,  image=1,  video=3   ($1 Claude = 182 cr)
export function getCreditCostForPlan(type: "text" | "image" | "video", plan: Plan): number {
  if (plan === "free") {
    if (type === "video") return 10;
    if (type === "image") return 5;
    return 1;
  }
  if (plan === "enterprise") {
    if (type === "video") return 3;
    if (type === "image") return 1;
    return 1;
  }
  // plus / pro
  if (type === "video") return 5;
  if (type === "image") return 2;
  return 1;
}
