import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image as ImageIcon, Video, Mic, ChevronRight, ChevronLeft,
  Sparkles, Loader2, Download, Play, Square, RefreshCw,
  Upload, X, Volume2, Copy, Check, Zap, Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
  { id: "product",   emoji: "✨", label: "Product Launch" },
  { id: "sale",      emoji: "🎁", label: "Sale / Promo" },
  { id: "awareness", emoji: "📢", label: "Brand Awareness" },
  { id: "event",     emoji: "🎉", label: "Event Promo" },
  { id: "service",   emoji: "💼", label: "Service Ad" },
  { id: "testimonial",emoji: "⭐", label: "Testimonial" },
];

const TEMPLATES = [
  { id: "bold",     label: "Bold Impact",    desc: "Large text, strong contrast" },
  { id: "gradient", label: "Gradient Glass", desc: "Frosted glass over gradient" },
  { id: "neon",     label: "Neon Glow",      desc: "Dark bg with glowing text" },
  { id: "minimal",  label: "Clean Minimal",  desc: "Geometric, lots of space" },
];

const DURATIONS = [15, 30, 60];

// ── Easing helpers ─────────────────────────────────────────────────────────────

const easeOut = (t: number) => 1 - Math.pow(1 - Math.min(t, 1), 3);
const easeInOut = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp01(t);

// ── Canvas draw ────────────────────────────────────────────────────────────────

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

function renderFrame(
  ctx: CanvasRenderingContext2D,
  t: number,           // current second
  total: number,       // total seconds
  data: AdData,
  script: AdScript,
  bgImg: HTMLImageElement | null,
) {
  const W = 540, H = 960;
  const scheme = COLOR_SCHEMES.find(c => c.id === data.colorScheme) || COLOR_SCHEMES[0];
  const accent = scheme.accent;
  const { r: ar, g: ag, b: ab } = hexToRgb(accent);

  ctx.clearRect(0, 0, W, H);

  // ── Background ──────────────────────────────────────────────────────────────
  if (bgImg) {
    // Cover-fit the uploaded image
    const scale = Math.max(W / bgImg.width, H / bgImg.height);
    const iw = bgImg.width * scale, ih = bgImg.height * scale;
    ctx.drawImage(bgImg, (W - iw) / 2, (H - ih) / 2, iw, ih);
    // Dark scrim
    ctx.fillStyle = "rgba(0,0,0,0.58)";
    ctx.fillRect(0, 0, W, H);
  } else {
    // Gradient bg
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, scheme.bg[0]);
    g.addColorStop(1, scheme.bg[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // ── Subtle grid lines (template: minimal / gradient) ─────────────────────────
  if (data.template === "minimal" || data.template === "gradient") {
    ctx.strokeStyle = `rgba(${ar},${ag},${ab},0.07)`;
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 54) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 54) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  }

  // ── Neon glow radial (template: neon) ─────────────────────────────────────
  if (data.template === "neon") {
    const pulse = 0.7 + 0.3 * Math.sin(t * 3);
    const gr = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, 500);
    gr.addColorStop(0, `rgba(${ar},${ag},${ab},${0.18 * pulse})`);
    gr.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, W, H);
  }

  // ── Decorative accent bar top ──────────────────────────────────────────────
  const barAlpha = clamp01(easeOut(t / 0.5));
  ctx.fillStyle = `rgba(${ar},${ag},${ab},${barAlpha})`;
  ctx.fillRect(0, 0, W, 4);

  // ── Brand name (phase 0: 0-2s) ────────────────────────────────────────────
  const brandAlpha = easeOut(clamp01(t / 0.6));
  const brandSlide = lerp(-30, 0, easeOut(clamp01(t / 0.6)));
  ctx.save();
  ctx.globalAlpha = brandAlpha;
  ctx.translate(0, brandSlide);

  // Brand pill
  ctx.fillStyle = `rgba(${ar},${ag},${ab},0.25)`;
  drawRoundedRect(ctx, 30, 36, 200, 36, 18);
  ctx.fill();
  ctx.strokeStyle = `rgba(${ar},${ag},${ab},0.6)`;
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, 30, 36, 200, 36, 18);
  ctx.stroke();

  ctx.font = "bold 16px Inter, Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.fillText("🚀 " + (data.brandName || "Your Brand").toUpperCase(), 48, 60);
  ctx.restore();

  // ── Platform badge (top right) ─────────────────────────────────────────────
  ctx.save();
  ctx.globalAlpha = brandAlpha;
  ctx.font = "13px Inter, Arial, sans-serif";
  ctx.fillStyle = `rgba(255,255,255,0.5)`;
  ctx.textAlign = "right";
  ctx.fillText(data.platform, W - 30, 58);
  ctx.restore();

  // ── Headline (phase 1: 1.5-4s) ────────────────────────────────────────────
  const hlP = clamp01((t - 1.2) / 1.0);
  const hlAlpha = easeOut(hlP);
  const hlSlide = lerp(50, 0, easeOut(hlP));

  ctx.save();
  ctx.globalAlpha = hlAlpha;
  ctx.translate(0, hlSlide);
  ctx.textAlign = "center";

  if (data.template === "neon") {
    ctx.shadowColor = accent;
    ctx.shadowBlur = 30;
  }
  if (data.template === "bold") {
    // Big accent block behind headline
    ctx.fillStyle = `rgba(${ar},${ag},${ab},0.15)`;
    ctx.fillRect(0, H * 0.34 - 10, W, 160);
  }

  ctx.font = "bold 56px Inter, Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.shadowBlur = data.template === "neon" ? 20 : 0;
  wrapText(ctx, (script.headline || data.keyMessage).toUpperCase(), W / 2, H * 0.38, W - 60, 68);

  ctx.shadowBlur = 0;
  ctx.restore();

  // ── Tagline (phase 2: 2.8-5.5s) ───────────────────────────────────────────
  const tlP = clamp01((t - 2.5) / 1.2);
  ctx.save();
  ctx.globalAlpha = easeInOut(tlP);
  ctx.translate(0, lerp(20, 0, easeOut(tlP)));
  ctx.textAlign = "center";

  if (data.template === "gradient") {
    ctx.fillStyle = `rgba(255,255,255,0.12)`;
    drawRoundedRect(ctx, 40, H * 0.55 - 12, W - 80, 80, 12);
    ctx.fill();
  }

  ctx.font = "20px Inter, Arial, sans-serif";
  ctx.fillStyle = `rgba(255,255,255,0.85)`;
  wrapText(ctx, script.tagline || "", W / 2, H * 0.57, W - 100, 28);
  ctx.restore();

  // ── Product name badge (phase 3: 4s+) ─────────────────────────────────────
  if (data.productName) {
    const pdP = clamp01((t - 3.8) / 0.8);
    ctx.save();
    ctx.globalAlpha = easeOut(pdP);
    ctx.textAlign = "center";
    ctx.font = "bold 15px Inter, Arial, sans-serif";
    ctx.fillStyle = accent;
    ctx.fillText("✦ " + data.productName + " ✦", W / 2, H * 0.50);
    ctx.restore();
  }

  // ── Divider line ──────────────────────────────────────────────────────────
  const divP = clamp01((t - 3.5) / 0.6);
  ctx.save();
  ctx.globalAlpha = easeOut(divP);
  const lineW = lerp(0, W - 120, easeOut(divP));
  ctx.strokeStyle = `rgba(${ar},${ag},${ab},0.5)`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo((W - lineW) / 2, H * 0.67);
  ctx.lineTo((W + lineW) / 2, H * 0.67);
  ctx.stroke();
  ctx.restore();

  // ── Hashtags row (phase 4: 5s+) ───────────────────────────────────────────
  if (script.hashtags?.length) {
    const htp = clamp01((t - 5) / 1);
    ctx.save();
    ctx.globalAlpha = easeOut(htp);
    ctx.textAlign = "center";
    ctx.font = "12px Inter, Arial, sans-serif";
    ctx.fillStyle = `rgba(${ar},${ag},${ab},0.8)`;
    const tags = script.hashtags.slice(0, 4).join("  ");
    ctx.fillText(tags, W / 2, H * 0.70);
    ctx.restore();
  }

  // ── CTA button (phase 5: last 5s) ─────────────────────────────────────────
  const ctaStart = Math.max(total - 6, 5);
  const ctaP = clamp01((t - ctaStart) / 1.2);
  const ctaPulse = 1 + 0.04 * Math.sin(t * 4);

  ctx.save();
  ctx.globalAlpha = easeOut(ctaP);
  ctx.translate(W / 2, H * 0.80);
  ctx.scale(ctaPulse, ctaPulse);

  // Button shadow
  ctx.shadowColor = `rgba(${ar},${ag},${ab},0.5)`;
  ctx.shadowBlur = 24;

  // Button bg
  const btG = ctx.createLinearGradient(-120, 0, 120, 0);
  btG.addColorStop(0, accent);
  btG.addColorStop(1, `rgba(${ar},${ag},${ab},0.7)`);
  ctx.fillStyle = btG;
  drawRoundedRect(ctx, -120, -24, 240, 48, 24);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.font = "bold 18px Inter, Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText((data.cta || "Learn More").toUpperCase(), 0, 7);
  ctx.restore();

  // ── Bottom brand strip ─────────────────────────────────────────────────────
  const btmP = clamp01((t - 0.3) / 0.7);
  ctx.save();
  ctx.globalAlpha = easeOut(btmP);

  ctx.fillStyle = `rgba(0,0,0,0.5)`;
  ctx.fillRect(0, H - 60, W, 60);

  ctx.fillStyle = `rgba(${ar},${ag},${ab},1)`;
  ctx.fillRect(0, H - 4, W, 4);

  ctx.font = "13px Inter, Arial, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.textAlign = "center";
  ctx.fillText(data.brandName || "Your Brand", W / 2, H - 20);
  ctx.restore();
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

  // Canvas / video state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [outputUrl, setOutputUrl] = useState<string>("");
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const rafRef = useRef<number>(0);
  const bgImgRef = useRef<HTMLImageElement | null>(null);

  // Voice
  const [speaking, setSpeaking] = useState(false);
  const [copied, setCopied] = useState<string>("");

  const set = (k: keyof AdData, v: unknown) => setData(d => ({ ...d, [k]: v }));

  // Load AI image when format is image/video
  const loadBg = useCallback(async () => {
    if (data.uploadedImage) {
      const img = new Image();
      img.onload = () => { bgImgRef.current = img; };
      img.src = data.uploadedImage;
      return;
    }
    bgImgRef.current = null;
    // Optionally fetch Pollinations background
    if (script) {
      const prompt = encodeURIComponent(
        `${data.template} style advertisement background for ${data.productName || data.brandName}, ${data.objective}, color scheme ${data.colorScheme}, professional, cinematic, no text`
      );
      const url = `https://image.pollinations.ai/prompt/${prompt}?width=540&height=960&nologo=true&seed=${Date.now()}`;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => { bgImgRef.current = img; };
      img.src = url;
    }
  }, [data, script]);

  // Generate AI script
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
      setScriptError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoadingScript(false);
    }
  };

  // Render static image
  const renderImage = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !script) return;
    setGenerating(true);
    await loadBg();
    await new Promise(r => setTimeout(r, 1200)); // wait for bg image
    const ctx = canvas.getContext("2d")!;
    renderFrame(ctx, data.duration * 0.4, data.duration, data, script, bgImgRef.current);
    const url = canvas.toDataURL("image/png");
    setOutputUrl(url);
    setGenerated(true);
    setGenerating(false);
    setStep(4);
  }, [data, script, loadBg]);

  // Render animated video
  const renderVideo = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !script) return;
    setGenerating(true);
    setRecording(true);
    await loadBg();
    await new Promise(r => setTimeout(r, 1200));

    const stream = canvas.captureStream(30);
    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType: mime });
    recorderRef.current = recorder;
    const chunks: Blob[] = [];
    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
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
    recorderRef.current?.stop();
  };

  const handleGenerate = async () => {
    if (data.format === "video") await renderVideo();
    else await renderImage();
  };

  // Voiceover playback
  const playVoiceover = () => {
    if (!script?.voiceover) return;
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const utter = new SpeechSynthesisUtterance(script.voiceover);
    utter.rate = 0.9;
    utter.pitch = data.voiceGender === "female" ? 1.1 : 0.85;
    const voices = window.speechSynthesis.getVoices();
    const pick = voices.find(v =>
      data.voiceGender === "female"
        ? v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("samantha") || v.name.toLowerCase().includes("google uk english female")
        : v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("daniel")
    ) || voices.find(v => v.lang === "en-US") || voices[0];
    if (pick) utter.voice = pick;
    utter.onend = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utter);
  };

  useEffect(() => () => { window.speechSynthesis.cancel(); cancelAnimationFrame(rafRef.current); }, []);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  // ── Canvas dims ────────────────────────────────────────────────────────────
  const CW = 270, CH = 480; // display half of 540×960

  // ── Steps ──────────────────────────────────────────────────────────────────
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
                { id: "video", icon: <Video size={32} />, label: "Video Reel", desc: "Animated short-form video with text motion effects", tags: ["WebM", "9:16 reel", "15-60s"] },
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

            {/* Visual options */}
            {data.format !== "audio" && (
              <>
                <div>
                  <label className="text-slate-300 text-sm font-medium block mb-2.5 flex items-center gap-1.5"><Palette size={14} /> Color Scheme</label>
                  <div className="flex gap-2 flex-wrap">
                    {COLOR_SCHEMES.map(c => (
                      <button key={c.id} onClick={() => set("colorScheme", c.id)}
                        className={`flex flex-col items-center gap-1 transition-all`}>
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
                          data.template === t.id
                            ? "border-pink-500 bg-pink-500/10"
                            : "border-slate-700 bg-slate-900 hover:border-slate-600"
                        }`}>
                        <div className={`text-sm font-bold ${data.template === t.id ? "text-pink-300" : "text-white"}`}>{t.label}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Voice gender for audio */}
            {(data.format === "audio" || data.format === "video") && (
              <div>
                <label className="text-slate-300 text-sm font-medium block mb-2.5">Voiceover Voice</label>
                <div className="flex gap-2">
                  {(["female", "male"] as const).map(g => (
                    <button key={g} onClick={() => set("voiceGender", g)}
                      className={`px-5 py-2 rounded-xl border text-sm font-medium capitalize transition-all ${
                        data.voiceGender === g
                          ? "border-pink-500 bg-pink-500/10 text-pink-300"
                          : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600"
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
              { key: "headline",  label: "🔥 Headline",       val: script.headline },
              { key: "tagline",   label: "✨ Tagline",        val: script.tagline },
              { key: "caption",   label: "📱 Social Caption", val: script.caption },
              { key: "voiceover", label: "🎙️ Voiceover Script", val: script.voiceover },
            ].map(({ key, label, val }) => (
              <div key={key} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300 text-sm font-semibold">{label}</span>
                  <button onClick={() => copyText(val, key)}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-white transition-colors">
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

            {/* Voiceover playback */}
            <div className="flex items-center gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <Button size="sm" onClick={playVoiceover}
                className={`${speaking ? "bg-red-600 hover:bg-red-500" : "bg-violet-600 hover:bg-violet-500"} text-white flex items-center gap-2`}>
                {speaking ? <><Square size={13} />Stop</> : <><Volume2 size={13} />Play Voiceover</>}
              </Button>
              <span className="text-slate-400 text-xs">Browser text-to-speech — hear your script before exporting</span>
            </div>

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
                      <div className="text-5xl mb-3">🎨</div>
                      <p className="text-slate-400 text-sm text-center px-4">Click Generate to render your ad</p>
                    </div>
                  )}
                  {generating && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
                      <Loader2 size={36} className="animate-spin text-pink-400 mb-3" />
                      <p className="text-white text-sm font-medium">
                        {recording ? `Recording ${data.format === "video" ? "video" : ""}…` : "Rendering…"}
                      </p>
                      {recording && (
                        <Button size="sm" variant="ghost" onClick={stopRecording}
                          className="mt-3 text-slate-400 text-xs border border-slate-600">
                          <Square size={12} className="mr-1" /> Stop Early
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-slate-500 text-xs mt-2">Preview (540×960 render)</p>
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
                    <Button onClick={() => copyText(script?.voiceover || "", "full")} variant="outline"
                      className="w-full border-slate-600 text-slate-300">
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
                          ? <><Loader2 size={18} className="animate-spin mr-2" />{data.format === "video" ? `Recording ${data.duration}s video…` : "Rendering image…"}</>
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
                      <div className="flex justify-between"><span className="text-slate-500">Format</span><span className="text-white capitalize">{data.format === "video" ? `${data.duration}s WebM Video` : "PNG Image"}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Dimensions</span><span className="text-white">540 × 960 px (9:16)</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Platform</span><span className="text-white">{data.platform}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Template</span><span className="text-white capitalize">{data.template}</span></div>
                    </div>

                    {/* Caption quick copy */}
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
