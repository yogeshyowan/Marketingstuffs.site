import { Router } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import pkg from "pg";
const { Pool } = pkg;

const router = Router();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const rzp = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
  : null;

// Plan & top-up definitions (mirror frontend)
const PLANS: Record<string, { credits: number; priceINR: number; label: string }> = {
  plus:       { credits: 312,  priceINR: 449,  label: "Plus Plan"       },
  pro:        { credits: 1250, priceINR: 1699, label: "Pro Plan"        },
  enterprise: { credits: 3125, priceINR: 4199, label: "Enterprise Plan" },
};

const TOPUPS: Record<string, { credits: number; priceINR: number; label: string }> = {
  topup_100:  { credits: 100,  priceINR: 99,  label: "Starter Top-up"  },
  topup_500:  { credits: 500,  priceINR: 349, label: "Value Top-up"    },
  topup_1500: { credits: 1500, priceINR: 849, label: "Power Top-up"    },
};

// ── GET /api/payment/key ─────────────────────────────────────
// Returns the Razorpay key_id for the frontend checkout
router.get("/payment/key", (_req, res) => {
  if (!process.env.RAZORPAY_KEY_ID) {
    res.status(503).json({ error: "Payment gateway not configured" });
    return;
  }
  res.json({ key: process.env.RAZORPAY_KEY_ID });
});

// ── POST /api/payment/create-order ──────────────────────────
// Creates a Razorpay order for a plan or top-up
router.post("/payment/create-order", async (req, res) => {
  if (!rzp) { res.status(503).json({ error: "Payment gateway not configured. Please add API keys." }); return; }

  const { email, planId, topupId } = req.body as { email?: string; planId?: string; topupId?: string };
  if (!email) { res.status(400).json({ error: "email is required" }); return; }

  let amountINR = 0;
  let description = "";
  let creditsToAdd = 0;
  let planToSet: string | null = null;

  if (planId && PLANS[planId]) {
    amountINR    = PLANS[planId].priceINR;
    description  = PLANS[planId].label;
    creditsToAdd = PLANS[planId].credits;
    planToSet    = planId;
  } else if (topupId && TOPUPS[topupId]) {
    amountINR    = TOPUPS[topupId].priceINR;
    description  = TOPUPS[topupId].label;
    creditsToAdd = TOPUPS[topupId].credits;
    planToSet    = null; // top-up doesn't change plan
  } else {
    res.status(400).json({ error: "Invalid planId or topupId" }); return;
  }

  try {
    const order = await rzp.orders.create({
      amount:   amountINR * 100, // paise
      currency: "INR",
      receipt:  `ms_${Date.now()}`,
      notes:    { email, planId: planId ?? "", topupId: topupId ?? "", credits: String(creditsToAdd) },
    });

    // Persist order in DB
    await pool.query(
      `INSERT INTO ms_payments (email, razorpay_order_id, amount_paise, currency, plan, credits, status)
       VALUES ($1, $2, $3, 'INR', $4, $5, 'created')
       ON CONFLICT (razorpay_order_id) DO NOTHING`,
      [email, order.id, amountINR * 100, planToSet, creditsToAdd]
    );

    res.json({ orderId: order.id, amount: amountINR * 100, currency: "INR", description });
  } catch (err) {
    console.error("[razorpay] create-order error:", err);
    res.status(500).json({ error: "Could not create payment order. Please try again." });
  }
});

// ── POST /api/payment/verify ─────────────────────────────────
// Verifies Razorpay signature and activates the plan
router.post("/payment/verify", async (req, res) => {
  if (!process.env.RAZORPAY_KEY_SECRET) { res.status(503).json({ error: "Payment gateway not configured" }); return; }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email } = req.body as {
    razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; email: string;
  };

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !email) {
    res.status(400).json({ error: "Missing payment fields" }); return;
  }

  // Verify signature
  const expectedSig = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSig !== razorpay_signature) {
    res.status(400).json({ error: "Payment verification failed — invalid signature" }); return;
  }

  try {
    // Get order details from DB
    const { rows } = await pool.query(
      "SELECT plan, credits FROM ms_payments WHERE razorpay_order_id = $1",
      [razorpay_order_id]
    );
    if (!rows.length) { res.status(404).json({ error: "Order not found" }); return; }
    const { plan, credits } = rows[0] as { plan: string | null; credits: number };

    // Mark payment as paid
    await pool.query(
      `UPDATE ms_payments SET status = 'paid', razorpay_payment_id = $1, razorpay_signature = $2
       WHERE razorpay_order_id = $3`,
      [razorpay_payment_id, razorpay_signature, razorpay_order_id]
    );

    // Upsert user — set plan (if plan purchase) or add credits (top-up)
    if (plan) {
      // Plan purchase: set plan + credits + 30-day expiry
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      await pool.query(
        `INSERT INTO ms_users (email, plan, credits, plan_expires_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (email) DO UPDATE SET plan = $2, credits = $3, plan_expires_at = $4, updated_at = NOW()`,
        [email, plan, credits, expiresAt]
      );
    } else {
      // Top-up: add credits to existing balance (default to free plan if new user)
      await pool.query(
        `INSERT INTO ms_users (email, plan, credits, updated_at)
         VALUES ($1, 'free', $2, NOW())
         ON CONFLICT (email) DO UPDATE SET credits = ms_users.credits + $2, updated_at = NOW()`,
        [email, credits]
      );
    }

    // Return updated user state
    const { rows: userRows } = await pool.query(
      "SELECT plan, credits, plan_expires_at FROM ms_users WHERE email = $1",
      [email]
    );
    const user = userRows[0] as { plan: string; credits: number; plan_expires_at: string };
    res.json({ success: true, plan: user.plan, credits: user.credits, expiresAt: user.plan_expires_at });
  } catch (err) {
    console.error("[razorpay] verify error:", err);
    res.status(500).json({ error: "Payment verified but activation failed. Contact support." });
  }
});

// ── GET /api/payment/user?email= ────────────────────────────
// Returns the user's current plan + credits from DB (called on login)
router.get("/payment/user", async (req, res) => {
  const { email } = req.query as { email?: string };
  if (!email) { res.status(400).json({ error: "email required" }); return; }

  try {
    const { rows } = await pool.query(
      "SELECT plan, credits, plan_expires_at FROM ms_users WHERE email = $1",
      [email]
    );
    if (!rows.length) {
      res.json({ plan: "free", credits: 0, expiresAt: null });
      return;
    }
    const user = rows[0] as { plan: string; credits: number; plan_expires_at: string | null };

    // Auto-downgrade to free if plan expired
    if (user.plan !== "free" && user.plan_expires_at && new Date(user.plan_expires_at) < new Date()) {
      await pool.query(
        "UPDATE ms_users SET plan = 'free', credits = 0, updated_at = NOW() WHERE email = $1",
        [email]
      );
      res.json({ plan: "free", credits: 0, expiresAt: null });
      return;
    }
    res.json({ plan: user.plan, credits: user.credits, expiresAt: user.plan_expires_at });
  } catch (err) {
    console.error("[payment] user lookup error:", err);
    res.status(500).json({ error: "Could not fetch user plan" });
  }
});

// ── POST /api/payment/deduct ─────────────────────────────────
// Deducts credits from the user in the DB (called after generation)
router.post("/payment/deduct", async (req, res) => {
  const { email, credits } = req.body as { email?: string; credits?: number };
  if (!email || !credits || credits < 0) { res.status(400).json({ error: "email and credits required" }); return; }

  try {
    const { rows } = await pool.query(
      `UPDATE ms_users SET credits = GREATEST(0, credits - $1), updated_at = NOW()
       WHERE email = $2
       RETURNING credits`,
      [credits, email]
    );
    if (!rows.length) { res.status(404).json({ error: "User not found" }); return; }
    res.json({ credits: (rows[0] as { credits: number }).credits });
  } catch (err) {
    console.error("[payment] deduct error:", err);
    res.status(500).json({ error: "Could not deduct credits" });
  }
});

export default router;
