import { Router } from "express";
import pkg from "pg";
const { Pool } = pkg;

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID     ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const ADMIN_EMAIL          = "yogesh.yowan@gmail.com";

function getRedirectUri(req: any): string {
  // Prefer explicit env var; fall back to request host
  const base = process.env.SITE_URL
    ?? `https://${req.get("host")}`;
  return `${base}/api/auth/google/callback`;
}

// ── GET /api/auth/google/start ────────────────────────────────────────────────
router.get("/auth/google/start", (req, res) => {
  if (!GOOGLE_CLIENT_ID) {
    return res.status(503).send(
      "Google OAuth not configured. Please add GOOGLE_CLIENT_ID to environment secrets."
    );
  }
  const params = new URLSearchParams({
    client_id:     GOOGLE_CLIENT_ID,
    redirect_uri:  getRedirectUri(req),
    response_type: "code",
    scope:         "openid email profile",
    access_type:   "offline",
    prompt:        "select_account",
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// ── GET /api/auth/google/callback ─────────────────────────────────────────────
router.get("/auth/google/callback", async (req, res) => {
  const { code, error } = req.query as Record<string, string>;

  if (error || !code) {
    return res.send(closePopupHtml("error", null, null, null,
      error ?? "No auth code returned from Google."));
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.send(closePopupHtml("error", null, null, null,
      "OAuth not configured on server."));
  }

  try {
    // Exchange code → tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id:     GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri:  getRedirectUri(req),
        grant_type:    "authorization_code",
      }),
    });
    const tokens = (await tokenRes.json()) as any;
    if (tokens.error) throw new Error(tokens.error_description ?? tokens.error);

    // Get user profile
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const user = (await userRes.json()) as any;

    const email  = (user.email as string).toLowerCase().trim();
    const name   = (user.name ?? "") as string;
    const googleId = user.sub as string;
    const avatar   = (user.picture ?? "") as string;
    const isAdmin  = email === ADMIN_EMAIL;

    // Upsert ms_users (existing plan/credits preserved)
    await pool.query(`
      INSERT INTO ms_users (email, name, google_id, avatar_url, last_login_at)
      VALUES ($1, $2, $3, $4, now())
      ON CONFLICT (email) DO UPDATE
        SET name = EXCLUDED.name,
            google_id = EXCLUDED.google_id,
            avatar_url = EXCLUDED.avatar_url,
            last_login_at = now(),
            updated_at = now()
    `, [email, name, googleId, avatar]);

    // Upsert ms_leads — every sign-in is a lead
    await pool.query(`
      INSERT INTO ms_leads (email, name, google_id, avatar_url)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE
        SET name = EXCLUDED.name,
            google_id = EXCLUDED.google_id,
            last_seen_at = now()
    `, [email, name, googleId, avatar]);

    return res.send(closePopupHtml("success", email, name, avatar, null, isAdmin));
  } catch (err: any) {
    console.error("[auth/google/callback] error:", err);
    return res.send(closePopupHtml("error", null, null, null,
      err?.message ?? "Authentication failed. Please try again."));
  }
});

// ── GET /api/auth/leads ───────────────────────────────────────────────────────
// Admin-only endpoint to list all leads
router.get("/auth/leads", async (req, res) => {
  const adminEmail = (req.query.admin as string ?? "").toLowerCase().trim();
  if (adminEmail !== ADMIN_EMAIL) {
    return res.status(403).json({ error: "Forbidden" });
  }
  try {
    const result = await pool.query(`
      SELECT l.email, l.name, l.source, l.created_at, l.last_seen_at,
             u.plan, u.credits
      FROM ms_leads l
      LEFT JOIN ms_users u ON u.email = l.email
      ORDER BY l.last_seen_at DESC
      LIMIT 500
    `);
    res.json({ leads: result.rows });
  } catch (err) {
    res.status(500).json({ error: "DB error" });
  }
});

// ── Helper: popup close page ──────────────────────────────────────────────────
function closePopupHtml(
  status: "success" | "error",
  email: string | null,
  name:  string | null,
  avatar: string | null,
  errorMsg: string | null,
  isAdmin = false,
): string {
  const payload = status === "success"
    ? JSON.stringify({ type: "MS_AUTH_SUCCESS", email, name, avatar, isAdmin })
    : JSON.stringify({ type: "MS_AUTH_ERROR",   error: errorMsg });

  return `<!DOCTYPE html><html><head><title>Signing in…</title>
<style>
  body { background: #0a0a1a; color: white; font-family: sans-serif;
         display: flex; align-items: center; justify-content: center;
         min-height: 100vh; margin: 0; }
  .card { text-align: center; padding: 2rem; }
  .spinner { width: 36px; height: 36px; border: 3px solid #34d399;
             border-top-color: transparent; border-radius: 50%;
             animation: spin .8s linear infinite; margin: 0 auto 1rem; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head><body>
<div class="card">
  ${status === "success"
    ? `<div class="spinner"></div><p>Signing you in…</p>`
    : `<p style="color:#f87171">⚠ ${errorMsg ?? "Auth failed"}</p><p>You can close this window.</p>`}
</div>
<script>
  (function() {
    var payload = ${payload};
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(payload, '*');
    }
    setTimeout(function() { window.close(); }, 800);
  })();
</script>
</body></html>`;
}

export default router;
