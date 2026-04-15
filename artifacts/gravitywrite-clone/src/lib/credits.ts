// ── Plan definitions ───────────────────────────────────────────
export type Plan = "free" | "plus" | "pro" | "bundle";

export const PLAN_CONFIG = {
  free:   { name: "Free",   credits: 50,   price: 0,   label: "Free",     color: "text-white/40",         badge: "bg-white/10" },
  plus:   { name: "Plus",   credits: 500,  price: 8,   label: "$8/mo",    color: "text-violet-400",        badge: "bg-violet-500/20 border border-violet-500/30" },
  pro:    { name: "Pro",    credits: 3000, price: 49,  label: "$49/mo",   color: "text-amber-400",         badge: "bg-amber-500/20 border border-amber-500/30" },
  bundle: { name: "Bundle", credits: 8700, price: 139, label: "$139/mo",  color: "text-emerald-400",       badge: "bg-emerald-500/20 border border-emerald-500/30" },
} as const satisfies Record<Plan, { name: string; credits: number; price: number; label: string; color: string; badge: string }>;

// ── Credit costs per action ────────────────────────────────────
// Rate: 62.5 credits per $1 you pay us.
// Cost formula: Claude API $ × 3 × 20 credits/$ = credits used.
// Haiku ~$0.004/request × 60 = 0.24 → rounded to 2–5
// Sonnet ~$0.05/request × 60 = 3 → rounded to 8–25
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
  // Grant full credits for new plan
  localStorage.setItem(LS_CREDITS, String(PLAN_CONFIG[plan].credits));
  localStorage.setItem(LS_MONTH, monthKey());
}

export function getCredits(): number {
  const stored = localStorage.getItem(LS_CREDITS);
  const plan = getPlan();
  const storedMonth = localStorage.getItem(LS_MONTH);

  // Monthly reset
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

export function hasCredits(amount: number): boolean {
  return getCredits() >= amount;
}

export function isFreeUser(): boolean {
  return getPlan() === "free";
}

// Credits per dollar paid (62.5 credits/$)
// Debit rate: 20 credits per $1 of Claude API cost
// Markup = 62.5 / 20 = 3.125×
export const CREDITS_PER_DOLLAR = 62.5;
export const DEBIT_PER_API_DOLLAR = 20;
