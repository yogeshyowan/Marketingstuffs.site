import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video, Loader2, Download, Play, Pause, RefreshCw, Sparkles,
  Youtube, Instagram, Facebook, Twitter, Smartphone, ChevronRight,
  FileText, Layers, Clock, Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPlan, deductCredits, CREDIT_COSTS } from "@/lib/credits";

// ── Pollinations helper ───────────────────────────────────────
function pollinationsUrl(prompt: string, w: number, h: number, seed?: number) {
  const s = seed ?? Math.floor(Math.random() * 99999);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&nologo=true&enhance=true&model=flux&seed=${s}`;
}

// ── Platforms ─────────────────────────────────────────────────
const PLATFORMS = [
  {
    id: "youtube",         label: "YouTube",          emoji: "🎬", icon: Youtube,
    w: 1280, h: 720,  ratio: "16:9",  format: "Landscape",
    frames: 5, duration: "2–20 min",  color: "text-red-400",   border: "border-red-500/30",  bg: "bg-red-500/10",
  },
  {
    id: "yt-shorts",       label: "YouTube Shorts",   emoji: "⚡", icon: Smartphone,
    w: 720,  h: 1280, ratio: "9:16",  format: "Vertical",
    frames: 4, duration: "15–60 sec", color: "text-red-400",   border: "border-red-500/30",  bg: "bg-red-500/10",
  },
  {
    id: "instagram-reel",  label: "Instagram Reel",   emoji: "📸", icon: Instagram,
    w: 720,  h: 1280, ratio: "9:16",  format: "Vertical",
    frames: 4, duration: "15–90 sec", color: "text-pink-400",  border: "border-pink-500/30", bg: "bg-pink-500/10",
  },
  {
    id: "tiktok",          label: "TikTok",            emoji: "🎵", icon: Smartphone,
    w: 720,  h: 1280, ratio: "9:16",  format: "Vertical",
    frames: 4, duration: "15–60 sec", color: "text-teal-400",  border: "border-teal-500/30", bg: "bg-teal-500/10",
  },
  {
    id: "facebook",        label: "Facebook Video",   emoji: "👍", icon: Facebook,
    w: 1280, h: 720,  ratio: "16:9",  format: "Landscape",
    frames: 4, duration: "1–15 min",  color: "text-blue-400",  border: "border-blue-500/30", bg: "bg-blue-500/10",
  },
  {
    id: "twitter",         label: "Twitter / X",      emoji: "🐦", icon: Twitter,
    w: 1200, h: 675,  ratio: "16:9",  format: "Landscape",
    frames: 3, duration: "0:30–2:20", color: "text-sky-400",   border: "border-sky-500/30",  bg: "bg-sky-500/10",
  },
];

// ── Video styles ──────────────────────────────────────────────
const VIDEO_STYLES = [
  { id: "cinematic",   label: "Cinematic",    desc: "Film-quality, dramatic lighting" },
  { id: "animated",    label: "Animated",     desc: "Motion graphics, colorful" },
  { id: "minimal",     label: "Minimalist",   desc: "Clean, text-driven, modern" },
  { id: "lifestyle",   label: "Lifestyle",    desc: "Authentic, real-world, warm" },
  { id: "documentary", label: "Documentary",  desc: "Factual, educational, grounded" },
  { id: "corporate",   label: "Corporate",    desc: "Professional, polished, trust" },
];

// ── Video topic categories ────────────────────────────────────
const TOPIC_EXAMPLES = [
  "Morning routine for productivity and success",
  "5 AI tools that will change your business in 2025",
  "How to grow Instagram followers organically",
  "Healthy meal prep for the entire week",
  "Best travel destinations in Southeast Asia",
  "How to start a dropshipping business with $0",
  "React vs Vue — which should you learn?",
  "The secret to viral TikTok content strategy",
];

// ── Storyboard frame preview ──────────────────────────────────
function StoryboardFrame({ url, index, label, isActive }: { url: string; index: number; label: string; isActive: boolean }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${isActive ? "border-teal-500/60 shadow-[0_0_16px_rgba(20,184,166,0.3)]" : "border-white/10"}`}>
      <div className="aspect-video bg-black/40 flex items-center justify-center min-h-[90px]">
        {!loaded && <Loader2 className="w-5 h-5 text-white/30 animate-spin" />}
        <img src={url} alt={label} onLoad={() => setLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0 absolute"}`} />
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <p className="text-white/70 text-[10px] font-medium">Scene {index + 1}</p>
        <p className="text-white/40 text-[9px] truncate">{label}</p>
      </div>
      {isActive && (
        <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
      )}
    </div>
  );
}

// ── Script display ────────────────────────────────────────────
function ScriptDisplay({ script }: { script: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-violet-400" />
          <span className="text-white/70 text-sm font-semibold">AI Script</span>
        </div>
        <button onClick={() => { navigator.clipboard.writeText(script); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="text-xs text-white/40 hover:text-white/70 transition-colors">
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <div className="p-4 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
        <p className="text-white/60 text-sm leading-relaxed whitespace-pre-line">{script}</p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function VideoGeneratorSection() {
  const [platform, setPlatform] = useState(PLATFORMS[0]);
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState(VIDEO_STYLES[0]);
  const [hook, setHook] = useState("Question");
  const [isGenerating, setIsGenerating] = useState(false);
  const [frames, setFrames] = useState<{ url: string; scene: string }[]>([]);
  const [script, setScript] = useState("");
  const [isScriptLoading, setIsScriptLoading] = useState(false);
  const [activeFrame, setActiveFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-advance frames when playing
  useEffect(() => {
    if (isPlaying && frames.length > 0) {
      playRef.current = setInterval(() => {
        setActiveFrame(f => (f + 1) % frames.length);
      }, 2000);
    } else {
      if (playRef.current) clearInterval(playRef.current);
    }
    return () => { if (playRef.current) clearInterval(playRef.current); };
  }, [isPlaying, frames.length]);

  // ── Scene prompt builder ───────────────────────────────────
  function buildScenePrompts(topic: string, platform: typeof PLATFORMS[0], style: typeof VIDEO_STYLES[0]): { url: string; scene: string }[] {
    const { w, h, format } = platform;
    const styleDesc = style.desc;
    const isVertical = format === "Vertical";

    const scenes = [
      { scene: "Opening hook / attention grabber", prompt: `${styleDesc}, ${isVertical ? "vertical video" : "widescreen cinematic"} opening frame, eye-catching hook visual for: ${topic}, dramatic lighting, compelling composition` },
      { scene: "Problem / setup", prompt: `${styleDesc}, ${isVertical ? "9:16 vertical" : "16:9 wide"} problem statement scene for: ${topic}, relatable scenario, emotional connection, high quality` },
      { scene: "Main content / solution", prompt: `${styleDesc}, ${isVertical ? "vertical short-form" : "cinematic landscape"} solution reveal for: ${topic}, helpful visual, clear and bright, professional` },
      { scene: "Key insight / highlight", prompt: `${styleDesc}, ${isVertical ? "vertical" : "widescreen"} key message frame for: ${topic}, impactful visual, memorable moment, high engagement` },
      { scene: "Call to action / outro", prompt: `${styleDesc}, ${isVertical ? "9:16" : "16:9"} call-to-action closing frame for: ${topic}, subscribe/follow CTA design, brand colors, clean finish` },
    ].slice(0, platform.frames);

    return scenes.map(s => ({
      url: pollinationsUrl(`${s.prompt}, ultra high quality, professional video frame, no text`, w, h, Math.floor(Math.random() * 99999)),
      scene: s.scene,
    }));
  }

  // ── Generate script via API ────────────────────────────────
  async function generateScript(topicStr: string, platLabel: string, styleLabel: string, hookType: string) {
    setIsScriptLoading(true);
    setScript("");
    const currentPlan = getPlan();
    const sys = `You are a viral video scriptwriter. Write concise, engaging video scripts optimized for social media. Be punchy, conversational, and structured for the platform.`;
    const usr = `Write a ${platLabel} video script for: "${topicStr}"
Style: ${styleLabel}
Hook type: ${hookType}

Format:
🎬 HOOK (first 3 seconds — grabs attention immediately)
📍 INTRO (15 sec — who you are, what they'll learn)
💡 MAIN CONTENT (3-5 key points with transitions)
🎯 CTA (subscribe/follow/comment/share)

Keep it punchy. Use emojis as scene markers. Max 250 words.`;

    try {
      const r = await fetch("/api/ai/tool-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt: sys, userPrompt: usr, plan: currentPlan }),
      });
      if (!r.ok || !r.body) throw new Error("fail");
      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const ev = JSON.parse(line.slice(6));
            if (ev.done || ev.error) break;
            if (ev.content) { full += ev.content; setScript(full); }
          } catch { /* skip */ }
        }
      }
      deductCredits(CREDIT_COSTS.tool_medium.cost);
    } catch { setScript("Script generation failed. Try again."); }
    finally { setIsScriptLoading(false); }
  }

  // ── Main generate ──────────────────────────────────────────
  async function handleGenerate() {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setFrames([]);
    setScript("");
    setActiveFrame(0);
    setIsPlaying(false);

    const generated = buildScenePrompts(topic, platform, style);
    setFrames(generated);
    deductCredits(CREDIT_COSTS.tool_short.cost);
    setTimeout(() => setIsGenerating(false), 1000);

    // Generate script in parallel
    generateScript(topic, platform.label, style.label, hook);
  }

  function regenerateFrames() {
    if (!topic.trim()) return;
    setFrames(buildScenePrompts(topic, platform, style));
    setActiveFrame(0);
  }

  const activeFrameData = frames[activeFrame];

  return (
    <section id="ai-video" className="py-24 relative overflow-hidden bg-white/[0.01] border-y border-white/5">
      <div className="absolute left-0 top-1/3 w-[500px] h-[500px] bg-indigo-500/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute right-0 bottom-1/4 w-[400px] h-[400px] bg-pink-500/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="container px-4 mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-sm font-medium mb-5">
            <Video className="w-4 h-4" />
            AI Video Creator
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-5">
            Create Stunning Videos from <span className="text-indigo-400">Text & Ideas</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Turn your topic or script into platform-ready video storyboards with AI-generated scenes, voiceover scripts, and frame-by-frame previews — for YouTube, Shorts, Reels, TikTok, and more.
          </p>
        </div>

        {/* Platform tabs */}
        <div className="flex overflow-x-auto gap-2 mb-8 pb-2 scrollbar-hide justify-center">
          {PLATFORMS.map(p => {
            const Icon = p.icon;
            const active = platform.id === p.id;
            return (
              <button key={p.id} onClick={() => { setPlatform(p); setFrames([]); setScript(""); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap border transition-all ${
                  active ? `${p.bg} ${p.border} ${p.color}` : "bg-white/5 border-white/10 text-white/50 hover:text-white"
                }`}>
                <Icon className="w-4 h-4" />
                {p.label}
                <span className={`text-[10px] font-mono ${active ? "opacity-70" : "text-white/25"}`}>{p.ratio}</span>
              </button>
            );
          })}
        </div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-5 gap-6">
          {/* Left: controls */}
          <div className="lg:col-span-2 space-y-5 glass-card rounded-2xl border border-white/10 p-6">
            {/* Platform info */}
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${platform.bg} border ${platform.border}`}>
              <platform.icon className={`w-5 h-5 ${platform.color}`} />
              <div>
                <p className={`text-sm font-semibold ${platform.color}`}>{platform.label}</p>
                <p className="text-white/40 text-xs">{platform.w}×{platform.h}px · {platform.ratio} · {platform.duration}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">Video topic or concept</label>
              <textarea className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/25 h-24 focus:outline-none focus:border-indigo-500/40 resize-none text-sm"
                placeholder="What's your video about? Be specific for better results..."
                value={topic} onChange={e => setTopic(e.target.value)} />
              {/* Quick examples */}
              <div className="flex flex-wrap gap-1 mt-2">
                {TOPIC_EXAMPLES.slice(0, 4).map(ex => (
                  <button key={ex} onClick={() => setTopic(ex)}
                    className="px-2 py-1 rounded-lg text-xs bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                    {ex.slice(0, 30)}…
                  </button>
                ))}
              </div>
            </div>

            {/* Video style */}
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Visual Style</label>
              <div className="grid grid-cols-2 gap-1.5">
                {VIDEO_STYLES.map(s => (
                  <button key={s.id} onClick={() => setStyle(s)}
                    className={`p-2.5 rounded-xl text-xs text-left border transition-all ${style.id === s.id ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-300" : "border-white/8 bg-white/[0.02] text-white/50 hover:border-white/15"}`}>
                    <p className="font-semibold">{s.label}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Hook type */}
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Hook Style</label>
              <div className="flex gap-2">
                {["Question", "Bold Claim", "Story", "Tutorial"].map(h => (
                  <button key={h} onClick={() => setHook(h)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${hook === h ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-400" : "border-white/8 text-white/40 hover:text-white"}`}>
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleGenerate} disabled={isGenerating || !topic.trim()}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold h-11 rounded-xl">
              {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating {platform.frames} scenes...</> : <><Wand2 className="w-4 h-4 mr-2" /> Generate Video Storyboard</>}
            </Button>

            <p className="text-xs text-white/25 text-center">
              Generates {platform.frames} storyboard frames + AI script · {platform.label} optimized
            </p>
          </div>

          {/* Right: storyboard preview */}
          <div className="lg:col-span-3 space-y-5">
            {/* Main frame preview */}
            <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8 bg-black/30">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-indigo-400" />
                  <span className="text-white/70 text-sm font-semibold">Storyboard Preview</span>
                  {frames.length > 0 && <span className="text-xs text-white/30">· Scene {activeFrame + 1}/{frames.length}</span>}
                </div>
                {frames.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setIsPlaying(p => !p)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-xs font-medium transition-colors">
                      {isPlaying ? <><Pause className="w-3 h-3" /> Pause</> : <><Play className="w-3 h-3" /> Play</>}
                    </button>
                    <button onClick={regenerateFrames}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 transition-colors">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Main frame */}
              <div className="p-5">
                {!activeFrameData ? (
                  <div className={`rounded-xl border border-dashed border-white/10 bg-black/20 flex flex-col items-center justify-center gap-3 ${platform.ratio === "9:16" ? "aspect-[9/16] max-h-80 max-w-[180px] mx-auto" : "aspect-video"}`}>
                    <Video className="w-10 h-10 text-white/10" />
                    <p className="text-white/25 text-sm">Generate to see your storyboard</p>
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div key={activeFrame}
                      initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }}
                      transition={{ duration: 0.3 }}
                      className={`relative ${platform.ratio === "9:16" ? "max-w-[220px] mx-auto" : "w-full"}`}>
                      <img src={activeFrameData.url} alt={activeFrameData.scene}
                        className={`w-full ${platform.ratio === "9:16" ? "aspect-[9/16]" : "aspect-video"} object-cover rounded-xl border border-white/10`} />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent rounded-b-xl p-4">
                        <p className="text-white text-sm font-semibold">Scene {activeFrame + 1}: {activeFrameData.scene}</p>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>

              {/* Frame strip */}
              {frames.length > 0 && (
                <div className="px-5 pb-5">
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    {frames.map((frame, i) => (
                      <button key={i} onClick={() => { setActiveFrame(i); setIsPlaying(false); }}
                        className="shrink-0 w-24">
                        <StoryboardFrame url={frame.url} index={i} label={frame.scene} isActive={i === activeFrame} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Script */}
            {(script || isScriptLoading) && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {isScriptLoading && !script ? (
                  <div className="rounded-xl border border-white/10 bg-black/30 p-5 flex items-center gap-3">
                    <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                    <span className="text-white/40 text-sm">Writing your AI script...</span>
                  </div>
                ) : (
                  <ScriptDisplay script={script} />
                )}
              </motion.div>
            )}

            {/* Download section */}
            {frames.length > 0 && (
              <div className="flex gap-3">
                <button onClick={() => frames.forEach((f, i) => { const a = document.createElement("a"); a.href = f.url; a.download = `scene-${i+1}.jpg`; a.target = "_blank"; a.click(); })}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 text-sm font-medium transition-colors">
                  <Download className="w-4 h-4" /> Download All Frames
                </button>
                <button onClick={() => { if (script) { const b = new Blob([script], { type: "text/plain" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "video-script.txt"; a.click(); }}}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 text-sm font-medium transition-colors ${!script ? "opacity-50 cursor-not-allowed" : ""}`}>
                  <FileText className="w-4 h-4" /> Download Script
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
