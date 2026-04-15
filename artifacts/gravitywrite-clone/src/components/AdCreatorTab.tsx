import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image as ImageIcon, Video, Mic, ChevronRight, ChevronLeft,
  Sparkles, Loader2, Download, Play, Square, RefreshCw,
  Upload, X, Volume2, Copy, Check, Zap, Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdobeExpressEditor } from "./AdobeExpressEditor";

// ── Types ─────────────────────────────────────────────────────────────────────

type AdFormat = "image" | "video" | "audio";
type AdStep = 0 | 1 | 2 | 3 | 4;

interface AdData {
  format: AdFormat;
  platform: string;
  objective: string;
  brandName: string;
  productName: string;
  keyMessage: string;
  cta: string;
  colorScheme: string;
  template: string;
  duration: number;
  uploadedImage: string | null;
  voiceGender: "female" | "male";
}

interface AdScript {
  headline: string;
  tagline: string;
  caption: string;
  voiceover: string;
  hashtags: string[];
  features?: string[];
  stats?: { label: string; value: string }[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const COLOR_SCHEMES = [
  { id: "purple",   label: "Royal",   bg: ["#0f0020", "#2d0066"], accent: "#a855f7", text: "#fff" },
  { id: "pink",     label: "Vibrant", bg: ["#1a0010", "#4d0040"], accent: "#ec4899", text: "#fff" },
  { id: "blue",     label: "Ocean",   bg: ["#000a1a", "#001a4d"], accent: "#3b82f6", text: "#fff" },
  { id: "gold",     label: "Luxury",  bg: ["#100800", "#3d2800"], accent: "#f59e0b", text: "#fff" },
  { id: "dark",     label: "Stealth", bg: ["#050508", "#0f1020"], accent: "#64ffda", text: "#fff" },
  { id: "fire",     label: "Bold",    bg: ["#1a0000", "#4d1000"], accent: "#ef4444", text: "#fff" },
];

const PLATFORMS = [
  { id: "Instagram", emoji: "📸", sizes: ["1080×1080 (Feed)", "1080×1920 (Reel/Story)"] },
  { id: "TikTok",    emoji: "🎵", sizes: ["1080×1920 (Video)"] },
  { id: "Facebook",  emoji: "👥", sizes: ["1200×628 (Feed)", "1080×1920 (Story)"] },
  { id: "YouTube",   emoji: "▶️",  sizes: ["1920×1080 (Banner)", "1080×1920 (Short)"] },
  { id: "LinkedIn",  emoji: "💼", sizes: ["1200×627 (Feed)"] },
  { id: "X (Twitter)", emoji: "🐦", sizes: ["1200×675 (Feed)"] },
];

const OBJECTIVES = [
  { id: "product",    emoji: "✨", label: "Product Launch" },
  { id: "sale",       emoji: "🎁", label: "Sale / Promo" },
  { id: "awareness",  emoji: "📢", label: "Brand Awareness" },
  { id: "event",      emoji: "🎉", label: "Event Promo" },
  { id: "service",    emoji: "💼", label: "Service Ad" },
  { id: "testimonial",emoji: "⭐", label: "Testimonial" },
];

// ── Pre-written prompt templates ───────────────────────────────────────────────
const AD_PROMPT_TEMPLATES = [
  {
    id: "product-launch",
    emoji: "🚀",
    label: "Product Launch",
    tag: "New arrival",
    objective: "product",
    colorScheme: "purple",
    platform: "Instagram",
    keyMessage: "Introducing our brand new [product name] — designed to [key benefit]. Be the first to experience it. Available now, exclusively at [brand name].",
    cta: "Shop Now",
    productHint: "e.g. Wireless Earbuds Pro",
  },
  {
    id: "flash-sale",
    emoji: "⚡",
    label: "Flash Sale",
    tag: "Limited time",
    objective: "sale",
    colorScheme: "fire",
    platform: "Instagram",
    keyMessage: "FLASH SALE — [X]% OFF everything for the next 24 hours only! Don't miss out. Huge savings on [product/category]. Limited stock available.",
    cta: "Grab the Deal",
    productHint: "e.g. Summer Collection",
  },
  {
    id: "subscribe",
    emoji: "🔔",
    label: "Subscribe / Follow",
    tag: "Community growth",
    objective: "awareness",
    colorScheme: "pink",
    platform: "YouTube",
    keyMessage: "Hit subscribe and join [number] people who get weekly [content type]. New videos every [day]. Don't miss the next one — subscribe and turn on notifications.",
    cta: "Subscribe Now",
    productHint: "e.g. Marketing Tips",
  },
  {
    id: "brand-intro",
    emoji: "🎬",
    label: "Brand Intro",
    tag: "Meet us",
    objective: "awareness",
    colorScheme: "blue",
    platform: "TikTok",
    keyMessage: "Meet [brand name]. We're on a mission to [brand mission]. Here's what makes us different: [unique value proposition]. This is just the beginning.",
    cta: "Learn More",
    productHint: "e.g. Your Mission",
  },
  {
    id: "event-promo",
    emoji: "🎉",
    label: "Event / Launch Party",
    tag: "Save the date",
    objective: "event",
    colorScheme: "gold",
    platform: "Instagram",
    keyMessage: "You're invited! Join us on [date] at [location/online] for [event name]. Exclusive [offers/speakers/experiences] await. Register free before spots fill up.",
    cta: "Register Free",
    productHint: "e.g. Annual Summit 2025",
  },
  {
    id: "testimonial",
    emoji: "⭐",
    label: "Customer Review",
    tag: "Social proof",
    objective: "testimonial",
    colorScheme: "gold",
    platform: "Facebook",
    keyMessage: '"[Customer quote about their experience with your product/service]" — [Customer Name], [Location]. Join thousands of happy customers at [brand name].',
    cta: "Read More Reviews",
    productHint: "e.g. SkinGlow Serum",
  },
  {
    id: "service-ad",
    emoji: "💼",
    label: "Service Promotion",
    tag: "Professional",
    objective: "service",
    colorScheme: "dark",
    platform: "LinkedIn",
    keyMessage: "Struggling with [problem]? [Brand name] helps [target audience] achieve [outcome] in [timeframe]. Trusted by [number]+ clients. Book a free discovery call today.",
    cta: "Book Free Call",
    productHint: "e.g. Social Media Management",
  },
  {
    id: "before-after",
    emoji: "✨",
    label: "Before & After",
    tag: "Transformation",
    objective: "product",
    colorScheme: "pink",
    platform: "TikTok",
    keyMessage: "Before [brand name]: [pain point / struggle]. After [brand name]: [transformation / result]. Real results, real people. See what [product] can do for you.",
    cta: "See Results",
    productHint: "e.g. FitPro Workout Plan",
  },
  {
    id: "countdown",
    emoji: "⏳",
    label: "Countdown / Urgency",
    tag: "Limited offer",
    objective: "sale",
    colorScheme: "fire",
    platform: "Instagram",
    keyMessage: "Only [X] hours left! Our [offer] ends tonight at midnight. Once it's gone, it's gone. [Brand name] — [key benefit]. Don't wait.",
    cta: "Claim Before It Ends",
    productHint: "e.g. 50% Off Membership",
  },
  {
    id: "tips-value",
    emoji: "💡",
    label: "Tips / Value Add",
    tag: "Educational",
    objective: "awareness",
    colorScheme: "blue",
    platform: "TikTok",
    keyMessage: "[Number] things you didn't know about [topic]. Brought to you by [brand name]. Save this for later and share with someone who needs to see it!",
    cta: "Follow for More Tips",
    productHint: "e.g. 5 Social Media Hacks",
  },
  {
    id: "seasonal",
    emoji: "🌟",
    label: "Seasonal / Holiday",
    tag: "Festive",
    objective: "sale",
    colorScheme: "gold",
    platform: "Facebook",
    keyMessage: "Celebrate [season/holiday] with [brand name]! Special [season] deals on [products/services]. The perfect gift for [audience]. Shop our [season] collection now.",
    cta: "Shop the Collection",
    productHint: "e.g. Christmas Gift Bundle",
  },
  {
    id: "challenge",
    emoji: "🏆",
    label: "Challenge / Trend",
    tag: "Viral",
    objective: "awareness",
    colorScheme: "purple",
    platform: "TikTok",
    keyMessage: "We're starting the [challenge name] challenge! [Brief description of what to do]. Tag us @[brand] and use #[hashtag]. Join the movement — [brand name].",
    cta: "Join the Challenge",
    productHint: "e.g. #GlowUpChallenge",
  },
];

const TEMPLATES = [
  { id: "bold",     label: "Bold Impact",    desc: "Large text, strong contrast" },
  { id: "gradient", label: "Gradient Glass", desc: "Frosted glass over gradient" },
  { id: "neon",     label: "Neon Glow",      desc: "Dark bg with glowing text" },
  { id: "minimal",  label: "Clean Minimal",  desc: "Geometric, lots of space" },
];

const DURATIONS = [15, 30, 60];

// ── Easing helpers ─────────────────────────────────────────────────────────────

const easeOut  = (t: number) => 1 - Math.pow(1 - Math.min(t, 1), 3);
const easeIn   = (t: number) => Math.pow(Math.min(t, 1), 2);
const easeInOut = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const clamp01  = (v: number) => Math.max(0, Math.min(1, v));
const lerp     = (a: number, b: number, t: number) => a + (b - a) * clamp01(t);

// ── Canvas helpers ─────────────────────────────────────────────────────────────

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number): number {
  const words = text.split(" ");
  let line = "";
  let ty = y;
  for (const word of words) {
    const test = line + (line ? " " : "") + word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, ty);
      ty += lineH;
      line = word;
    } else {
      line = test;
    }
  }
  if (line) { ctx.fillText(line, x, ty); ty += lineH; }
  return ty;
}

// Draw a glowing star
function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const innerAngle = angle + (2 * Math.PI) / 10;
    if (i === 0) ctx.moveTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    else ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    ctx.lineTo(cx + (r * 0.4) * Math.cos(innerAngle), cy + (r * 0.4) * Math.sin(innerAngle));
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Draw sparkle particle
function drawSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - size, y); ctx.lineTo(x + size, y);
  ctx.moveTo(x, y - size); ctx.lineTo(x, y + size);
  ctx.moveTo(x - size * 0.6, y - size * 0.6); ctx.lineTo(x + size * 0.6, y + size * 0.6);
  ctx.moveTo(x + size * 0.6, y - size * 0.6); ctx.lineTo(x - size * 0.6, y + size * 0.6);
  ctx.stroke();
  ctx.restore();
}

// Seeded pseudo-random for consistent particles
function seededRand(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

// ── Main renderFrame ────────────────────────────────────────────────────────────

function renderFrame(
  ctx: CanvasRenderingContext2D,
  t: number,
  total: number,
  data: AdData,
  script: AdScript,
  bgImg: HTMLImageElement | null,
) {
  const W = 540, H = 960;
  const scheme = COLOR_SCHEMES.find(c => c.id === data.colorScheme) || COLOR_SCHEMES[0];
  const accent = scheme.accent;
  const { r: ar, g: ag, b: ab } = hexToRgb(accent);

  ctx.clearRect(0, 0, W, H);

  // ── 1. BACKGROUND ────────────────────────────────────────────────────────────
  if (bgImg) {
    const scale = Math.max(W / bgImg.width, H / bgImg.height);
    const iw = bgImg.width * scale, ih = bgImg.height * scale;
    ctx.drawImage(bgImg, (W - iw) / 2, (H - ih) / 2, iw, ih);
    // Gradient scrim so text is readable
    const scrim = ctx.createLinearGradient(0, 0, 0, H);
    scrim.addColorStop(0, "rgba(0,0,0,0.70)");
    scrim.addColorStop(0.4, "rgba(0,0,0,0.45)");
    scrim.addColorStop(0.7, "rgba(0,0,0,0.55)");
    scrim.addColorStop(1, "rgba(0,0,0,0.80)");
    ctx.fillStyle = scrim;
    ctx.fillRect(0, 0, W, H);
  } else {
    const g = ctx.createLinearGradient(0, W * 0.3, W, H);
    g.addColorStop(0, scheme.bg[0]);
    g.addColorStop(0.6, scheme.bg[1]);
    g.addColorStop(1, scheme.bg[0]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Ambient radial glow
    const pulse = 0.65 + 0.35 * Math.sin(t * 1.8);
    const gr = ctx.createRadialGradient(W * 0.5, H * 0.42, 80, W * 0.5, H * 0.42, 420);
    gr.addColorStop(0, `rgba(${ar},${ag},${ab},${0.22 * pulse})`);
    gr.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, W, H);

    // Corner accent glows
    const cr1 = ctx.createRadialGradient(0, 0, 0, 0, 0, 220);
    cr1.addColorStop(0, `rgba(${ar},${ag},${ab},0.12)`);
    cr1.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = cr1;
    ctx.fillRect(0, 0, W, H);

    const cr2 = ctx.createRadialGradient(W, H, 0, W, H, 280);
    cr2.addColorStop(0, `rgba(${ar},${ag},${ab},0.10)`);
    cr2.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = cr2;
    ctx.fillRect(0, 0, W, H);
  }

  // ── 2. GRID LINES (minimal / gradient) ──────────────────────────────────────
  if (data.template === "minimal" || data.template === "gradient") {
    ctx.strokeStyle = `rgba(${ar},${ag},${ab},0.06)`;
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 54) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 54) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  }

  // ── 3. FLOATING PARTICLES ───────────────────────────────────────────────────
  const particleCount = 18;
  for (let i = 0; i < particleCount; i++) {
    const px = seededRand(i * 7) * W;
    const baseY = seededRand(i * 13) * H;
    const speed = 18 + seededRand(i * 3) * 30;
    const py = ((baseY - t * speed * 0.5) % H + H) % H;
    const size = 2 + seededRand(i * 5) * 4;
    const alpha = (0.15 + seededRand(i * 11) * 0.35) * (0.6 + 0.4 * Math.sin(t * 2 + i));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(px, py, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Sparkle bursts at corners and mid-points
  const sparklePts = [
    [80, 150], [460, 100], [30, 480], [510, 520], [270, 80], [160, 840], [380, 870],
  ];
  for (let i = 0; i < sparklePts.length; i++) {
    const [sx, sy] = sparklePts[i];
    const phase = (t * 1.5 + i * 0.9) % 3;
    const alpha = phase < 1.5 ? easeOut(phase / 1.5) * 0.6 : easeOut((3 - phase) / 1.5) * 0.6;
    const size = 4 + seededRand(i * 7) * 5;
    drawSparkle(ctx, sx, sy, size, accent, alpha);
  }

  // ── 4. TOP ACCENT BARS ───────────────────────────────────────────────────────
  const barAlpha = clamp01(easeOut(t / 0.4));
  ctx.fillStyle = `rgba(${ar},${ag},${ab},${barAlpha})`;
  ctx.fillRect(0, 0, W, 4);

  // Thin vertical accent lines (bold / neon)
  if (data.template === "bold" || data.template === "neon") {
    ctx.fillStyle = `rgba(${ar},${ag},${ab},${barAlpha * 0.4})`;
    ctx.fillRect(0, 0, 3, H);
    ctx.fillRect(W - 3, 0, 3, H);
  }

  // ── 5. NEON GLOW OVERLAY ─────────────────────────────────────────────────────
  if (data.template === "neon") {
    const pulse = 0.7 + 0.3 * Math.sin(t * 3);
    const gr = ctx.createRadialGradient(W / 2, H * 0.45, 30, W / 2, H * 0.45, 460);
    gr.addColorStop(0, `rgba(${ar},${ag},${ab},${0.22 * pulse})`);
    gr.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, W, H);
  }

  // ── 6. BRAND PILL (top-left) ─────────────────────────────────────────────────
  const brandP = easeOut(clamp01(t / 0.5));
  ctx.save();
  ctx.globalAlpha = brandP;
  ctx.translate(lerp(-60, 0, easeOut(clamp01(t / 0.5))), 0);

  // Pill bg
  ctx.fillStyle = `rgba(${ar},${ag},${ab},0.22)`;
  drawRoundedRect(ctx, 24, 32, 210, 38, 19);
  ctx.fill();
  ctx.strokeStyle = `rgba(${ar},${ag},${ab},0.65)`;
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, 24, 32, 210, 38, 19);
  ctx.stroke();

  ctx.font = "bold 15px Inter, Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.fillText("🚀 " + (data.brandName || "Your Brand").toUpperCase().slice(0, 18), 44, 57);
  ctx.restore();

  // ── 7. PLATFORM BADGE (top-right) ────────────────────────────────────────────
  ctx.save();
  ctx.globalAlpha = brandP;
  const platEmoji = PLATFORMS.find(p => p.id === data.platform)?.emoji ?? "📱";
  ctx.fillStyle = `rgba(255,255,255,0.10)`;
  drawRoundedRect(ctx, W - 110, 32, 90, 34, 17);
  ctx.fill();
  ctx.font = "12px Inter, Arial, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.textAlign = "center";
  ctx.fillText(platEmoji + " " + data.platform.split(" ")[0], W - 65, 54);
  ctx.restore();

  // ── 8. OBJECTIVE ICON BURST (0.5–1.5s) ──────────────────────────────────────
  const objP = clamp01((t - 0.4) / 0.7);
  if (objP > 0) {
    const objEmoji = OBJECTIVES.find(o => o.id === data.objective)?.emoji ?? "✨";
    ctx.save();
    ctx.globalAlpha = easeOut(objP) * (objP < 0.5 ? 1 : lerp(1, 0, easeIn((objP - 0.5) * 2)));
    const scale = lerp(0.5, 1.2, easeOut(objP));
    ctx.translate(W / 2, H * 0.22);
    ctx.scale(scale, scale);
    ctx.font = "56px Inter, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(objEmoji, 0, 0);
    ctx.textBaseline = "alphabetic";
    ctx.restore();
  }

  // ── 9. HEADLINE (1.2–3s) ─────────────────────────────────────────────────────
  const hlP = clamp01((t - 1.0) / 1.0);
  ctx.save();
  ctx.globalAlpha = easeOut(hlP);
  ctx.translate(0, lerp(60, 0, easeOut(hlP)));
  ctx.textAlign = "center";

  if (data.template === "neon") {
    ctx.shadowColor = accent;
    ctx.shadowBlur = 28;
  }
  if (data.template === "bold") {
    const bgH = 170;
    ctx.fillStyle = `rgba(${ar},${ag},${ab},0.13)`;
    ctx.fillRect(0, H * 0.30 - 16, W, bgH);
    ctx.strokeStyle = `rgba(${ar},${ag},${ab},0.25)`;
    ctx.lineWidth = 1;
    ctx.strokeRect(0, H * 0.30 - 16, W, bgH);
  }
  if (data.template === "gradient") {
    ctx.fillStyle = `rgba(255,255,255,0.06)`;
    drawRoundedRect(ctx, 20, H * 0.29 - 14, W - 40, 175, 16);
    ctx.fill();
  }

  ctx.font = "bold 54px Inter, Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.shadowBlur = data.template === "neon" ? 22 : 0;
  wrapText(ctx, (script.headline || data.keyMessage).toUpperCase(), W / 2, H * 0.33, W - 60, 66);
  ctx.shadowBlur = 0;
  ctx.restore();

  // ── 10. TAGLINE (2.3–4s) ──────────────────────────────────────────────────────
  const tlP = clamp01((t - 2.2) / 1.2);
  ctx.save();
  ctx.globalAlpha = easeInOut(tlP);
  ctx.translate(0, lerp(24, 0, easeOut(tlP)));
  ctx.textAlign = "center";

  if (data.template === "gradient" && tlP > 0.1) {
    ctx.fillStyle = `rgba(255,255,255,0.10)`;
    drawRoundedRect(ctx, 36, H * 0.50 - 14, W - 72, 82, 14);
    ctx.fill();
  }

  ctx.font = "italic 19px Inter, Arial, sans-serif";
  ctx.fillStyle = `rgba(255,255,255,0.88)`;
  wrapText(ctx, script.tagline || "", W / 2, H * 0.52, W - 100, 30);
  ctx.restore();

  // ── 11. PRODUCT NAME BADGE (2.8s+) ───────────────────────────────────────────
  if (data.productName) {
    const pdP = clamp01((t - 2.6) / 0.7);
    ctx.save();
    ctx.globalAlpha = easeOut(pdP);
    ctx.textAlign = "center";

    // Accent pill
    const ptw = Math.min(ctx.measureText("✦ " + data.productName + " ✦").width + 40, W - 80);
    ctx.fillStyle = `rgba(${ar},${ag},${ab},0.30)`;
    drawRoundedRect(ctx, (W - ptw) / 2, H * 0.463 - 16, ptw, 30, 15);
    ctx.fill();
    ctx.strokeStyle = `rgba(${ar},${ag},${ab},0.7)`;
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, (W - ptw) / 2, H * 0.463 - 16, ptw, 30, 15);
    ctx.stroke();

    ctx.font = "bold 14px Inter, Arial, sans-serif";
    ctx.fillStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 10;
    ctx.fillText("✦ " + data.productName + " ✦", W / 2, H * 0.463);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ── 12. FEATURE BULLETS (3.2–5s, staggered) ──────────────────────────────────
  const features = script.features?.length
    ? script.features.slice(0, 3)
    : [
        data.keyMessage.split(".")[0].split(",")[0].slice(0, 40) || "Premium Quality",
        "Fast Delivery",
        "100% Satisfaction Guaranteed",
      ];

  for (let fi = 0; fi < features.length; fi++) {
    const fP = clamp01((t - (3.0 + fi * 0.35)) / 0.6);
    if (fP <= 0) continue;
    const fx = lerp(-W * 0.6, 0, easeOut(fP));
    ctx.save();
    ctx.globalAlpha = easeOut(fP);
    ctx.translate(fx, 0);

    const fy = H * 0.635 + fi * 44;

    // Bullet line bg
    ctx.fillStyle = `rgba(${ar},${ag},${ab},0.12)`;
    drawRoundedRect(ctx, 32, fy - 15, W - 64, 34, 17);
    ctx.fill();
    ctx.strokeStyle = `rgba(${ar},${ag},${ab},0.35)`;
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, 32, fy - 15, W - 64, 34, 17);
    ctx.stroke();

    // Check icon
    ctx.fillStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(58, fy + 2, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = "bold 11px Inter, Arial, sans-serif";
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.fillText("✓", 58, fy + 6);

    // Feature text
    ctx.font = "13px Inter, Arial, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.fillText(features[fi].slice(0, 42), 78, fy + 6);

    ctx.restore();
  }

  // ── 13. STAR RATING (4.0s+) ───────────────────────────────────────────────────
  const starP = clamp01((t - 3.9) / 0.8);
  if (starP > 0 && data.objective !== "awareness") {
    ctx.save();
    ctx.globalAlpha = easeOut(starP);
    const starY = H * 0.635 + 3 * 44 + 18;
    ctx.textAlign = "center";
    const stars = "★★★★★";
    const shown = Math.round(5 * starP);
    ctx.font = "bold 20px Inter, Arial, sans-serif";
    ctx.fillStyle = "#fbbf24";
    ctx.shadowColor = "#fbbf24";
    ctx.shadowBlur = 10;
    ctx.fillText(stars.slice(0, shown), W / 2 - 30, starY);
    ctx.shadowBlur = 0;
    ctx.font = "12px Inter, Arial, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.fillText("4.9 · 2,800+ reviews", W / 2 + 48, starY);
    ctx.restore();
  }

  // ── 14. VOICEOVER KARAOKE TEXT (4.5s–end-5s) ─────────────────────────────────
  const voiceText = script.voiceover || "";
  if (voiceText) {
    const karaokeStart = 4.2;
    const karaokeEnd = total - 4.5;
    const karaokeP = clamp01((t - karaokeStart) / 0.5);

    if (karaokeP > 0 && t < karaokeEnd + 1) {
      const words = voiceText.split(" ");
      const totalWords = words.length;
      const wordsPerSec = totalWords / Math.max(karaokeEnd - karaokeStart, 1);
      const wordsShown = Math.min(totalWords, Math.floor((t - karaokeStart) * wordsPerSec) + 1);

      // Show a sliding window of ~6 words at a time
      const windowSize = 6;
      const windowStart = Math.max(0, wordsShown - windowSize);
      const windowWords = words.slice(windowStart, wordsShown);

      ctx.save();
      ctx.globalAlpha = easeOut(karaokeP) * (t > karaokeEnd ? easeOut(clamp01((karaokeEnd + 1 - t))) : 1);

      // Karaoke box bg
      const kbY = H * 0.835;
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      drawRoundedRect(ctx, 24, kbY - 20, W - 48, 64, 14);
      ctx.fill();
      ctx.strokeStyle = `rgba(${ar},${ag},${ab},0.40)`;
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, 24, kbY - 20, W - 48, 64, 14);
      ctx.stroke();

      // Mic icon
      ctx.font = "14px Inter, Arial, sans-serif";
      ctx.fillStyle = accent;
      ctx.textAlign = "left";
      ctx.fillText("🎙", 38, kbY + 5);

      // Karaoke words
      ctx.font = "bold 15px Inter, Arial, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      const karaokeStr = windowWords.join(" ");
      ctx.fillText(karaokeStr.slice(0, 55), W / 2 + 10, kbY + 5);

      // Animated cursor
      const blink = Math.floor(t * 2) % 2 === 0;
      if (blink) {
        const tw = ctx.measureText(karaokeStr.slice(0, 55)).width;
        ctx.fillStyle = accent;
        ctx.fillRect(W / 2 + 10 + tw / 2 + 4, kbY - 10, 2, 22);
      }

      ctx.restore();
    }
  }

  // ── 15. ANIMATED DIVIDER ─────────────────────────────────────────────────────
  const divP = clamp01((t - 2.8) / 0.7);
  if (divP > 0) {
    ctx.save();
    ctx.globalAlpha = easeOut(divP);
    const lineW = lerp(0, W - 100, easeOut(divP));
    const lineY = H * 0.608;
    // Left half
    ctx.strokeStyle = `rgba(${ar},${ag},${ab},0.55)`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(W / 2, lineY);
    ctx.lineTo(W / 2 - lineW / 2, lineY);
    ctx.stroke();
    // Right half
    ctx.beginPath();
    ctx.moveTo(W / 2, lineY);
    ctx.lineTo(W / 2 + lineW / 2, lineY);
    ctx.stroke();
    // Center diamond
    ctx.fillStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 10;
    ctx.save();
    ctx.translate(W / 2, lineY);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ── 16. HASHTAG PILLS (4.2s+) ────────────────────────────────────────────────
  if (script.hashtags?.length) {
    const htp = clamp01((t - 4.0) / 0.9);
    const tags = script.hashtags.slice(0, 3);
    ctx.save();
    ctx.globalAlpha = easeOut(htp);

    let hx = 32;
    const hy = H * 0.795;
    for (const tag of tags) {
      const tw = ctx.measureText(tag).width;
      const pw = tw + 22;
      if (hx + pw > W - 32) break;
      ctx.fillStyle = `rgba(${ar},${ag},${ab},0.20)`;
      drawRoundedRect(ctx, hx, hy - 14, pw, 26, 13);
      ctx.fill();
      ctx.strokeStyle = `rgba(${ar},${ag},${ab},0.5)`;
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, hx, hy - 14, pw, 26, 13);
      ctx.stroke();
      ctx.font = "11px Inter, Arial, sans-serif";
      ctx.fillStyle = `rgba(${ar},${ag},${ab},1)`;
      ctx.textAlign = "left";
      ctx.fillText(tag, hx + 11, hy + 4);
      hx += pw + 8;
    }
    ctx.restore();
  }

  // ── 17. CTA BUTTON (last 6s) ──────────────────────────────────────────────────
  const ctaStart = Math.max(total - 6.5, 4.5);
  const ctaP = clamp01((t - ctaStart) / 1.2);
  const ctaPulse = 1 + 0.05 * Math.sin(t * 4.5);

  ctx.save();
  ctx.globalAlpha = easeOut(ctaP);
  ctx.translate(W / 2, H * 0.755);
  ctx.scale(ctaPulse, ctaPulse);

  // Outer glow ring
  ctx.shadowColor = `rgba(${ar},${ag},${ab},0.7)`;
  ctx.shadowBlur = 30 * ctaPulse;
  const btG = ctx.createLinearGradient(-130, 0, 130, 0);
  btG.addColorStop(0, accent);
  btG.addColorStop(0.5, `rgba(${ar},${ag},${ab},0.85)`);
  btG.addColorStop(1, accent);
  ctx.fillStyle = btG;
  drawRoundedRect(ctx, -130, -26, 260, 52, 26);
  ctx.fill();

  // Button text
  ctx.shadowBlur = 0;
  ctx.font = "bold 19px Inter, Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText((data.cta || "Shop Now").toUpperCase(), 0, 7);

  // Arrow indicator
  ctx.font = "14px Inter, Arial, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText("→", 100, 7);

  ctx.restore();

  // ── 18. PROGRESS BAR ─────────────────────────────────────────────────────────
  const progAlpha = clamp01(easeOut((t - 0.2) / 0.5));
  const progress = t / total;
  ctx.save();
  ctx.globalAlpha = progAlpha * 0.45;
  ctx.fillStyle = `rgba(255,255,255,0.12)`;
  ctx.fillRect(0, H - 70, W, 2);
  ctx.fillStyle = `rgba(${ar},${ag},${ab},1)`;
  ctx.fillRect(0, H - 70, W * progress, 2);
  ctx.restore();

  // ── 19. BOTTOM STRIP ─────────────────────────────────────────────────────────
  const btmP = clamp01((t - 0.2) / 0.6);
  ctx.save();
  ctx.globalAlpha = easeOut(btmP);

  // Gradient strip
  const bsg = ctx.createLinearGradient(0, H - 66, 0, H);
  bsg.addColorStop(0, "rgba(0,0,0,0)");
  bsg.addColorStop(0.3, "rgba(0,0,0,0.65)");
  bsg.addColorStop(1, "rgba(0,0,0,0.85)");
  ctx.fillStyle = bsg;
  ctx.fillRect(0, H - 66, W, 66);

  // Bottom accent bar
  ctx.fillStyle = `rgba(${ar},${ag},${ab},1)`;
  ctx.fillRect(0, H - 4, W, 4);

  // Brand name (bottom center)
  ctx.font = "12px Inter, Arial, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.50)";
  ctx.textAlign = "center";
  ctx.fillText("marketingstuffs.site · " + (data.brandName || "Your Brand"), W / 2, H - 14);

  ctx.restore();

  // ── 20. FLOATING EMOJI ACCENTS (scattered around) ────────────────────────────
  const emojiSet = ["✨", "🔥", "💎", "⚡", "🎯", "💫"];
  for (let ei = 0; ei < 4; ei++) {
    const ep = clamp01((t - (0.8 + ei * 0.6)) / 0.5);
    if (ep <= 0) continue;
    const ex = [60, W - 60, 45, W - 45][ei];
    const ey = [250, 280, 680, 700][ei];
    const floatY = ey + Math.sin(t * 1.2 + ei) * 8;
    ctx.save();
    ctx.globalAlpha = easeOut(ep) * 0.55;
    ctx.font = "22px Inter, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(emojiSet[ei % emojiSet.length], ex, floatY);
    ctx.restore();
  }

  // ── 21. WAVEFORM ANIMATION (bottom, near brand) ───────────────────────────────
  const waveP = clamp01((t - 0.5) / 0.8);
  if (waveP > 0) {
    ctx.save();
    ctx.globalAlpha = easeOut(waveP) * 0.4;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.5;
    const bars = 24;
    const barW = 6;
    const gap = (W * 0.5) / bars;
    const waveY = H - 38;
    for (let bi = 0; bi < bars; bi++) {
      const barH = 4 + Math.abs(Math.sin(t * 3 + bi * 0.5)) * 14;
      const bx = W * 0.25 + bi * gap;
      ctx.beginPath();
      ctx.moveTo(bx, waveY - barH);
      ctx.lineTo(bx, waveY + barH);
      ctx.stroke();
    }
    ctx.restore();
  }
}

// ── Build ambient background music via AudioContext ─────────────────────────────

function buildAmbientAudio(
  audioCtx: AudioContext,
  dest: MediaStreamAudioDestinationNode,
  duration: number,
  accentColor: string,
) {
  const { r, g, b } = hexToRgb(accentColor);
  // Pick a musical scale based on color warmth
  const warmth = (r - b) / 255;
  const baseFreq = warmth > 0.3 ? 261.63 : warmth < -0.3 ? 220.00 : 246.94; // C4, A3, or B3
  const scale = [1, 1.25, 1.5, 2, 2.5, 3].map(f => baseFreq * f);

  const masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(0, 0);
  masterGain.gain.linearRampToValueAtTime(0.18, 0.5);
  masterGain.gain.setValueAtTime(0.18, duration - 1.5);
  masterGain.gain.linearRampToValueAtTime(0, duration);
  masterGain.connect(dest);

  // Pad chords every 2 seconds
  for (let beat = 0; beat < duration; beat += 2) {
    const chord = [scale[0], scale[2], scale[4]];
    chord.forEach((freq, ci) => {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq * (ci === 2 ? 0.5 : 1);
      g.gain.setValueAtTime(0, beat);
      g.gain.linearRampToValueAtTime(0.06, beat + 0.1);
      g.gain.setValueAtTime(0.06, beat + 1.7);
      g.gain.linearRampToValueAtTime(0, beat + 2.0);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(beat);
      osc.stop(beat + 2.1);
    });
  }

  // Subtle hi-hat rhythm
  for (let beat = 0; beat < duration; beat += 0.5) {
    const bufSz = audioCtx.sampleRate * 0.04;
    const buf = audioCtx.createBuffer(1, bufSz, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSz; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSz, 3);
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const hiG = audioCtx.createGain();
    hiG.gain.value = beat % 1 === 0 ? 0.04 : 0.02;
    const filter = audioCtx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 6000;
    src.connect(filter);
    filter.connect(hiG);
    hiG.connect(masterGain);
    src.start(beat);
  }

  // Kick drum on every beat
  for (let beat = 0; beat < duration; beat += 1) {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.frequency.setValueAtTime(120, beat);
    osc.frequency.exponentialRampToValueAtTime(40, beat + 0.15);
    g.gain.setValueAtTime(0.12, beat);
    g.gain.exponentialRampToValueAtTime(0.001, beat + 0.3);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(beat);
    osc.stop(beat + 0.4);
  }
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdCreatorTab() {
  const [step, setStep] = useState<AdStep>(0);
  const [data, setData] = useState<AdData>({
    format: "image",
    platform: "Instagram",
    objective: "product",
    brandName: "",
    productName: "",
    keyMessage: "",
    cta: "Shop Now",
    colorScheme: "purple",
    template: "bold",
    duration: 15,
    uploadedImage: null,
    voiceGender: "female",
  });
  const [script, setScript] = useState<AdScript | null>(null);
  const [loadingScript, setLoadingScript] = useState(false);
  const [scriptError, setScriptError] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [outputUrl, setOutputUrl] = useState<string>("");
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const rafRef = useRef<number>(0);
  const bgImgRef = useRef<HTMLImageElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [speaking, setSpeaking] = useState(false);
  const [copied, setCopied] = useState<string>("");

  const set = (k: keyof AdData, v: unknown) => setData(d => ({ ...d, [k]: v }));
  const setMulti = (fields: Partial<AdData>) => setData(d => ({ ...d, ...fields }));

  const loadBg = useCallback(async () => {
    if (data.uploadedImage) {
      const img = new Image();
      img.onload = () => { bgImgRef.current = img; };
      img.src = data.uploadedImage;
      return;
    }
    bgImgRef.current = null;
    if (script) {
      const prompt = encodeURIComponent(
        `${data.template} style advertisement for ${data.productName || data.brandName}, ${data.objective}, ${data.colorScheme} color scheme, professional product photography, cinematic lighting, no text, high quality`
      );
      const url = `https://image.pollinations.ai/prompt/${prompt}?width=540&height=960&nologo=true&seed=${Date.now() % 9999}`;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => { bgImgRef.current = img; };
      img.onerror = () => { bgImgRef.current = null; };
      img.src = url;
    }
  }, [data, script]);

  const generateScript = async () => {
    setLoadingScript(true);
    setScriptError("");
    try {
      const res = await fetch("/api/ai/generate-ad-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: data.brandName,
          productName: data.productName,
          keyMessage: data.keyMessage,
          cta: data.cta,
          platform: data.platform,
          objective: data.objective,
          format: data.format,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Failed to generate script");
      setScript(json.script);
      setStep(3);
    } catch (e) {
      setScriptError(e instanceof Error ? e.message : "Error generating script");
    } finally {
      setLoadingScript(false);
    }
  };

  const renderImage = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !script) return;
    setGenerating(true);
    await loadBg();
    await new Promise(r => setTimeout(r, 1400));
    const ctx = canvas.getContext("2d")!;
    renderFrame(ctx, data.duration * 0.45, data.duration, data, script, bgImgRef.current);
    const url = canvas.toDataURL("image/png");
    setOutputUrl(url);
    setGenerated(true);
    setGenerating(false);
    setStep(4);
  }, [data, script, loadBg]);

  const renderVideo = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !script) return;
    setGenerating(true);
    setRecording(true);

    await loadBg();
    await new Promise(r => setTimeout(r, 1400));

    // ── Setup AudioContext with ambient music ──────────────────────────────────
    const audioCtx = new AudioContext();
    audioCtxRef.current = audioCtx;
    const audioDest = audioCtx.createMediaStreamDestination();
    const scheme = COLOR_SCHEMES.find(c => c.id === data.colorScheme) || COLOR_SCHEMES[0];
    buildAmbientAudio(audioCtx, audioDest, data.duration, scheme.accent);

    // ── Start voiceover (user hears it live; text shown on canvas) ────────────
    if (script.voiceover && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(script.voiceover);
      utter.rate = 0.88;
      utter.pitch = data.voiceGender === "female" ? 1.1 : 0.85;
      const voices = window.speechSynthesis.getVoices();
      const pick = voices.find(v =>
        data.voiceGender === "female"
          ? /female|samantha|google uk english female/i.test(v.name)
          : /male|daniel/i.test(v.name)
      ) || voices.find(v => v.lang === "en-US") || voices[0];
      if (pick) utter.voice = pick;
      // Start at 4.2s offset matching karaoke timing
      setTimeout(() => {
        window.speechSynthesis.speak(utter);
      }, 4200);
    }

    // ── Combine canvas video + audio ──────────────────────────────────────────
    const canvasStream = canvas.captureStream(30);
    const videoTrack = canvasStream.getVideoTracks()[0];
    const audioTrack = audioDest.stream.getAudioTracks()[0];
    const combinedStream = new MediaStream([videoTrack, audioTrack]);

    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : "video/webm";

    const recorder = new MediaRecorder(combinedStream, { mimeType: mime });
    recorderRef.current = recorder;
    const chunks: Blob[] = [];
    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      window.speechSynthesis.cancel();
      if (audioCtx.state !== "closed") audioCtx.close();
      const blob = new Blob(chunks, { type: mime });
      const url = URL.createObjectURL(blob);
      setOutputUrl(url);
      setGenerated(true);
      setGenerating(false);
      setRecording(false);
      setStep(4);
    };

    recorder.start(100);
    const fps = 30;
    const totalFrames = data.duration * fps;
    let frame = 0;
    const ctx = canvas.getContext("2d")!;

    const tick = () => {
      const t = frame / fps;
      renderFrame(ctx, t, data.duration, data, script, bgImgRef.current);
      frame++;
      if (frame <= totalFrames) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        recorder.stop();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [data, script, loadBg]);

  const stopRecording = () => {
    cancelAnimationFrame(rafRef.current);
    window.speechSynthesis.cancel();
    recorderRef.current?.stop();
  };

  const handleGenerate = async () => {
    if (data.format === "video") await renderVideo();
    else await renderImage();
  };

  const playVoiceover = () => {
    if (!script?.voiceover) return;
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const utter = new SpeechSynthesisUtterance(script.voiceover);
    utter.rate = 0.9;
    utter.pitch = data.voiceGender === "female" ? 1.1 : 0.85;
    const voices = window.speechSynthesis.getVoices();
    const pick = voices.find(v =>
      data.voiceGender === "female"
        ? /female|samantha|google uk english female/i.test(v.name)
        : /male|daniel/i.test(v.name)
    ) || voices.find(v => v.lang === "en-US") || voices[0];
    if (pick) utter.voice = pick;
    utter.onend = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utter);
  };

  useEffect(() => () => {
    window.speechSynthesis.cancel();
    cancelAnimationFrame(rafRef.current);
    if (audioCtxRef.current?.state !== "closed") audioCtxRef.current?.close();
  }, []);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  const CW = 270, CH = 480;
  const STEP_LABELS = ["Format", "Details", "Content", "AI Script", "Export"];

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-white font-bold text-xl mb-1 flex items-center gap-2">
          <Zap size={20} className="text-pink-400" /> Ad Creator Studio
        </h2>
        <p className="text-slate-400 text-sm">Build image ads, video reels, or audio scripts — your format, your choice</p>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex items-center">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              i === step ? "bg-pink-600 text-white" :
              i < step  ? "bg-slate-700 text-pink-300" :
                          "bg-slate-800/50 text-slate-500"
            }`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                i < step ? "bg-pink-500 text-white" : "bg-slate-700 text-slate-400"
              }`}>{i < step ? "✓" : i + 1}</span>
              {label}
            </div>
            {i < STEP_LABELS.length - 1 && <div className={`w-6 h-px mx-0.5 ${i < step ? "bg-pink-500/50" : "bg-slate-700"}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── STEP 0: Format ───────────────────────────────────────────────── */}
        {step === 0 && (
          <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h3 className="text-white font-semibold mb-4">What do you want to create?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {([
                { id: "image", icon: <ImageIcon size={32} />, label: "Image Ad", desc: "Static poster — perfect for feed posts, stories, and banners", tags: ["PNG", "Any platform", "Instant"] },
                { id: "video", icon: <Video size={32} />, label: "Video Reel", desc: "Animated reel with motion effects, karaoke voiceover & background music", tags: ["WebM", "9:16 reel", "15-60s", "Audio"] },
                { id: "audio", icon: <Mic size={32} />, label: "Audio / Script", desc: "AI-generated voiceover script with one-click playback", tags: ["Script", "Voiceover", "Shareable"] },
              ] as { id: AdFormat; icon: React.ReactNode; label: string; desc: string; tags: string[] }[]).map(f => (
                <button key={f.id} onClick={() => set("format", f.id)}
                  className={`p-5 rounded-2xl border-2 text-left transition-all flex flex-col gap-3 ${
                    data.format === f.id
                      ? "border-pink-500 bg-pink-500/10 shadow-lg shadow-pink-500/10"
                      : "border-slate-700 bg-slate-900 hover:border-slate-600"
                  }`}>
                  <div className={`${data.format === f.id ? "text-pink-400" : "text-slate-400"}`}>{f.icon}</div>
                  <div>
                    <div className="text-white font-bold text-base mb-1">{f.label}</div>
                    <div className="text-slate-400 text-sm leading-relaxed">{f.desc}</div>
                  </div>
                  <div className="flex gap-1.5 flex-wrap mt-auto">
                    {f.tags.map(t => (
                      <span key={t} className="px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded-full">{t}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(1)} className="bg-pink-600 hover:bg-pink-500 text-white px-6">
                Next <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 1: Platform & Objective ─────────────────────────────────── */}
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div>
              <h3 className="text-white font-semibold mb-3">Target Platform</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {PLATFORMS.map(p => (
                  <button key={p.id} onClick={() => set("platform", p.id)}
                    className={`py-3 px-2 rounded-xl border text-center transition-all ${
                      data.platform === p.id
                        ? "border-pink-500 bg-pink-500/10 text-white"
                        : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600"
                    }`}>
                    <div className="text-2xl mb-1">{p.emoji}</div>
                    <div className="text-xs font-medium">{p.id}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-3">Ad Objective</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {OBJECTIVES.map(o => (
                  <button key={o.id} onClick={() => set("objective", o.id)}
                    className={`py-3 px-4 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      data.objective === o.id
                        ? "border-pink-500 bg-pink-500/10 text-white"
                        : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600"
                    }`}>
                    <span className="text-xl">{o.emoji}</span>
                    <span className="text-sm font-medium">{o.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {data.format === "video" && (
              <div>
                <h3 className="text-white font-semibold mb-3">Video Duration</h3>
                <div className="flex gap-2">
                  {DURATIONS.map(d => (
                    <button key={d} onClick={() => set("duration", d)}
                      className={`px-5 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                        data.duration === d
                          ? "border-pink-500 bg-pink-500/10 text-pink-300"
                          : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600"
                      }`}>{d}s</button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(0)} className="text-slate-400"><ChevronLeft size={16} className="mr-1" /> Back</Button>
              <Button onClick={() => setStep(2)} className="bg-pink-600 hover:bg-pink-500 text-white px-6">Next <ChevronRight size={16} className="ml-1" /></Button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: Content ───────────────────────────────────────────────── */}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">

            {/* ── Prompt template picker ─────────────────────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">Start from a Prompt Template</h3>
                <span className="text-xs text-slate-500">Optional — click any to pre-fill</span>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
                {AD_PROMPT_TEMPLATES.map(tpl => (
                  <button
                    key={tpl.id}
                    onClick={() => setMulti({
                      objective: tpl.objective as AdData["objective"],
                      colorScheme: tpl.colorScheme,
                      platform: tpl.platform,
                      keyMessage: tpl.keyMessage,
                      cta: tpl.cta,
                    })}
                    className={`flex-shrink-0 flex flex-col items-start gap-1.5 px-3.5 py-3 rounded-xl border transition-all text-left w-[148px] ${
                      data.keyMessage === tpl.keyMessage
                        ? "border-pink-500 bg-pink-500/10"
                        : "border-slate-700 bg-slate-900 hover:border-pink-500/50 hover:bg-slate-800"
                    }`}
                  >
                    <span className="text-2xl">{tpl.emoji}</span>
                    <span className="text-white text-xs font-semibold leading-tight">{tpl.label}</span>
                    <span className="text-[10px] text-slate-500 leading-tight">{tpl.tag}</span>
                  </button>
                ))}
              </div>
              {/* Show the selected template's key message as a preview */}
              {data.keyMessage && AD_PROMPT_TEMPLATES.some(t => t.keyMessage === data.keyMessage) && (
                <div className="mt-3 rounded-xl bg-slate-900 border border-pink-500/20 px-4 py-3">
                  <p className="text-[11px] text-pink-400 font-semibold uppercase tracking-widest mb-1.5">Template pre-filled — replace the [ ] placeholders below</p>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{data.keyMessage}</p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 pt-4" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-300 text-sm font-medium block mb-1.5">Brand / Business Name *</label>
                <input value={data.brandName} onChange={e => set("brandName", e.target.value)} placeholder="e.g. UrbanWear Co."
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-pink-500 transition-colors" />
              </div>
              <div>
                <label className="text-slate-300 text-sm font-medium block mb-1.5">Product / Service Name</label>
                <input value={data.productName} onChange={e => set("productName", e.target.value)} placeholder="e.g. Summer Collection 2025"
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-pink-500 transition-colors" />
              </div>
              <div className="md:col-span-2">
                <label className="text-slate-300 text-sm font-medium block mb-1.5">Key Message / Offer *</label>
                <textarea value={data.keyMessage} onChange={e => set("keyMessage", e.target.value)} rows={2}
                  placeholder="e.g. Get 40% off our new summer collection — limited time only!"
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-pink-500 transition-colors resize-none" />
              </div>
              <div>
                <label className="text-slate-300 text-sm font-medium block mb-1.5">Call to Action</label>
                <input value={data.cta} onChange={e => set("cta", e.target.value)} placeholder="e.g. Shop Now, Learn More, Book Free Call"
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-pink-500 transition-colors" />
              </div>
              {data.format !== "audio" && (
                <div>
                  <label className="text-slate-300 text-sm font-medium block mb-1.5">Upload Image (optional)</label>
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-800 border border-slate-600 border-dashed hover:border-pink-500 rounded-xl px-4 py-2.5 text-slate-400 text-sm transition-colors">
                    <Upload size={14} />
                    {data.uploadedImage ? "Image uploaded ✓" : "Click to upload"}
                    <input type="file" accept="image/*" className="hidden" onChange={e => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const reader = new FileReader();
                      reader.onload = () => set("uploadedImage", reader.result as string);
                      reader.readAsDataURL(f);
                    }} />
                  </label>
                  {data.uploadedImage && (
                    <button onClick={() => set("uploadedImage", null)} className="mt-1 text-xs text-slate-500 hover:text-red-400 flex items-center gap-1">
                      <X size={11} /> Remove image
                    </button>
                  )}
                </div>
              )}
            </div>

            {data.format !== "audio" && (
              <>
                <div>
                  <label className="text-slate-300 text-sm font-medium block mb-2.5 flex items-center gap-1.5"><Palette size={14} /> Color Scheme</label>
                  <div className="flex gap-2 flex-wrap">
                    {COLOR_SCHEMES.map(c => (
                      <button key={c.id} onClick={() => set("colorScheme", c.id)} className="flex flex-col items-center gap-1 transition-all">
                        <div className={`w-10 h-10 rounded-xl border-2 ${data.colorScheme === c.id ? "border-white scale-110" : "border-transparent"}`}
                          style={{ background: `linear-gradient(135deg, ${c.bg[0]}, ${c.bg[1]})`, boxShadow: data.colorScheme === c.id ? `0 0 10px ${c.accent}` : "none" }} />
                        <span className="text-xs text-slate-400">{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 text-sm font-medium block mb-2.5">Ad Template</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {TEMPLATES.map(t => (
                      <button key={t.id} onClick={() => set("template", t.id)}
                        className={`py-2.5 px-3 rounded-xl border text-left transition-all ${
                          data.template === t.id ? "border-pink-500 bg-pink-500/10" : "border-slate-700 bg-slate-900 hover:border-slate-600"
                        }`}>
                        <div className={`text-sm font-bold ${data.template === t.id ? "text-pink-300" : "text-white"}`}>{t.label}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {(data.format === "audio" || data.format === "video") && (
              <div>
                <label className="text-slate-300 text-sm font-medium block mb-2.5">Voiceover Voice</label>
                <div className="flex gap-2">
                  {(["female", "male"] as const).map(g => (
                    <button key={g} onClick={() => set("voiceGender", g)}
                      className={`px-5 py-2 rounded-xl border text-sm font-medium capitalize transition-all ${
                        data.voiceGender === g ? "border-pink-500 bg-pink-500/10 text-pink-300" : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600"
                      }`}>{g === "female" ? "👩 Female" : "👨 Male"}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(1)} className="text-slate-400"><ChevronLeft size={16} className="mr-1" /> Back</Button>
              <Button onClick={generateScript} disabled={!data.brandName || !data.keyMessage || loadingScript}
                className="bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 text-white px-6 font-bold disabled:opacity-40">
                {loadingScript
                  ? <><Loader2 size={15} className="animate-spin mr-2" />Generating Script…</>
                  : <><Sparkles size={15} className="mr-2" />Generate AI Script</>}
              </Button>
            </div>
            {scriptError && <p className="text-red-400 text-sm mt-2">{scriptError}</p>}
          </motion.div>
        )}

        {/* ── STEP 3: AI Script ─────────────────────────────────────────────── */}
        {step === 3 && script && (
          <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-white font-semibold">Your AI-Generated Ad Script</h3>
              <Button variant="ghost" size="sm" onClick={() => { setScript(null); generateScript(); }}
                className="text-slate-400 text-xs"><RefreshCw size={13} className="mr-1" />Regenerate</Button>
            </div>

            {[
              { key: "headline",  label: "🔥 Headline",         val: script.headline },
              { key: "tagline",   label: "✨ Tagline",           val: script.tagline },
              { key: "caption",   label: "📱 Social Caption",    val: script.caption },
              { key: "voiceover", label: "🎙️ Voiceover Script",  val: script.voiceover },
            ].map(({ key, label, val }) => (
              <div key={key} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300 text-sm font-semibold">{label}</span>
                  <button onClick={() => copyText(val, key)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-white transition-colors">
                    {copied === key ? <><Check size={12} className="text-green-400" /> Copied</> : <><Copy size={12} /> Copy</>}
                  </button>
                </div>
                <p className="text-white text-sm leading-relaxed">{val}</p>
              </div>
            ))}

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 text-sm font-semibold"># Hashtags</span>
                <button onClick={() => copyText(script.hashtags.join(" "), "hashtags")}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-white transition-colors">
                  {copied === "hashtags" ? <><Check size={12} className="text-green-400" /> Copied</> : <><Copy size={12} /> Copy All</>}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {script.hashtags.map(h => (
                  <span key={h} className="px-2 py-0.5 bg-pink-500/15 border border-pink-500/30 text-pink-300 text-xs rounded-full">{h}</span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <Button size="sm" onClick={playVoiceover}
                className={`${speaking ? "bg-red-600 hover:bg-red-500" : "bg-violet-600 hover:bg-violet-500"} text-white flex items-center gap-2`}>
                {speaking ? <><Square size={13} />Stop</> : <><Volume2 size={13} />Play Voiceover</>}
              </Button>
              <span className="text-slate-400 text-xs">Preview your voiceover before generating the reel</span>
            </div>

            {data.format === "video" && (
              <div className="p-3 bg-violet-950/40 border border-violet-500/20 rounded-xl">
                <p className="text-violet-300 text-xs leading-relaxed">
                  🎵 <strong>Video reel includes:</strong> animated karaoke voiceover text, floating particles, feature bullets, star rating, waveform, background music, and a pulsing CTA button — all rendered on the canvas and exported as a WebM video with audio.
                </p>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(2)} className="text-slate-400"><ChevronLeft size={16} className="mr-1" /> Back</Button>
              <Button onClick={() => { setGenerated(false); setOutputUrl(""); setStep(4); }}
                className="bg-pink-600 hover:bg-pink-500 text-white px-6 font-bold">
                Generate {data.format === "image" ? "Image Ad" : data.format === "video" ? "Video Reel" : "Export"} <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 4: Generate & Export ─────────────────────────────────────── */}
        {step === 4 && (
          <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Canvas preview */}
              <div className="flex flex-col items-center">
                <div className="relative rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl"
                  style={{ width: CW, height: CH }}>
                  <canvas ref={canvasRef} width={540} height={960}
                    style={{ width: CW, height: CH, display: "block" }} />
                  {!generated && !generating && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
                      <div className="text-5xl mb-3">🎬</div>
                      <p className="text-slate-400 text-sm text-center px-4">Click Generate to render your ad</p>
                    </div>
                  )}
                  {generating && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
                      <Loader2 size={36} className="animate-spin text-pink-400 mb-3" />
                      <p className="text-white text-sm font-medium">
                        {recording ? `Recording ${data.duration}s reel…` : "Rendering…"}
                      </p>
                      {recording && (
                        <>
                          <p className="text-slate-400 text-xs mt-1">🎵 Music playing · 🎙️ Voiceover starting at 4s</p>
                          <Button size="sm" variant="ghost" onClick={stopRecording}
                            className="mt-3 text-slate-400 text-xs border border-slate-600">
                            <Square size={12} className="mr-1" /> Stop Early
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-slate-500 text-xs mt-2">Preview (540×960 · 9:16 format)</p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-4">
                <h3 className="text-white font-semibold">
                  {data.format === "audio" ? "🎙️ Audio Script" : generated ? "✅ Ready to Download!" : "Generate Your Ad"}
                </h3>

                {data.format === "audio" ? (
                  <div className="space-y-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                      <p className="text-slate-300 text-sm leading-relaxed">{script?.voiceover}</p>
                    </div>
                    <Button onClick={playVoiceover} className={`w-full font-bold ${speaking ? "bg-red-600 hover:bg-red-500" : "bg-violet-600 hover:bg-violet-500"} text-white`}>
                      {speaking ? <><Square size={15} className="mr-2" />Stop Playback</> : <><Volume2 size={15} className="mr-2" />Play Full Voiceover</>}
                    </Button>
                    <Button onClick={() => copyText(script?.voiceover || "", "full")} variant="outline" className="w-full border-slate-600 text-slate-300">
                      {copied === "full" ? <><Check size={15} className="mr-2 text-green-400" />Copied!</> : <><Copy size={15} className="mr-2" />Copy Script</>}
                    </Button>
                    <p className="text-slate-500 text-xs">Use this script for your own recording, video editing tool, or professional voiceover service.</p>
                  </div>
                ) : (
                  <>
                    {!generated ? (
                      <Button onClick={handleGenerate} disabled={generating}
                        className="bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 text-white font-bold py-3 text-base disabled:opacity-50">
                        {generating
                          ? <><Loader2 size={18} className="animate-spin mr-2" />{data.format === "video" ? `Recording ${data.duration}s reel…` : "Rendering image…"}</>
                          : <><Sparkles size={18} className="mr-2" />Generate {data.format === "video" ? "Video Reel" : "Image Ad"}</>}
                      </Button>
                    ) : (
                      <a href={outputUrl}
                        download={`marketingstuffs-ad.${data.format === "video" ? "webm" : "png"}`}
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 text-base rounded-xl flex items-center justify-center gap-2 transition-colors">
                        <Download size={18} /> Download {data.format === "video" ? "Video (.webm)" : "Image (.png)"}
                      </a>
                    )}

                    {generated && (
                      <Button onClick={() => { setGenerated(false); setOutputUrl(""); handleGenerate(); }}
                        variant="outline" className="w-full border-slate-600 text-slate-300">
                        <RefreshCw size={15} className="mr-2" /> Regenerate
                      </Button>
                    )}

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500">Format</span><span className="text-white capitalize">{data.format === "video" ? `${data.duration}s WebM + Audio` : "PNG Image"}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Dimensions</span><span className="text-white">540 × 960 px (9:16)</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Platform</span><span className="text-white">{data.platform}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Template</span><span className="text-white capitalize">{data.template}</span></div>
                      {data.format === "video" && <div className="flex justify-between"><span className="text-slate-500">Audio</span><span className="text-white">Background music + karaoke text</span></div>}
                    </div>

                    {script && (
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-slate-400 text-xs font-semibold">CAPTION TO POST</span>
                          <button onClick={() => copyText((script.caption + "\n\n" + script.hashtags.join(" ")), "export")}
                            className="text-xs text-slate-500 hover:text-white flex items-center gap-1">
                            {copied === "export" ? <><Check size={11} className="text-green-400" />Copied</> : <><Copy size={11} />Copy</>}
                          </button>
                        </div>
                        <p className="text-slate-300 text-xs leading-relaxed line-clamp-4">{script.caption}</p>
                        <p className="text-pink-400/70 text-xs mt-2 line-clamp-2">{script.hashtags.join(" ")}</p>
                      </div>
                    )}

                    {/* ── Adobe Express ──────────────────────────────────── */}
                    <div className="pt-2">
                      <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-2">Or edit in Adobe Express</p>
                      <AdobeExpressEditor
                        brandName={data.brandName}
                        productName={data.productName}
                        headline={script?.headline ?? ""}
                        tagline={script?.tagline ?? ""}
                        platform={data.platform}
                        objective={data.objective}
                        generatedImageBase64={data.format === "image" && outputUrl ? outputUrl : null}
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-2 mt-auto">
                  <Button variant="ghost" onClick={() => setStep(3)} className="text-slate-400 text-sm"><ChevronLeft size={14} className="mr-1" />Script</Button>
                  <Button variant="ghost" onClick={() => { setStep(0); setScript(null); setGenerated(false); setOutputUrl(""); }}
                    className="text-slate-400 text-sm">Start New Ad</Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
