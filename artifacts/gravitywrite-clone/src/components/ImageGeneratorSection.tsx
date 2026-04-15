import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ImageIcon, Loader2, Download, RefreshCw, Sparkles, Copy, Check,
  Youtube, Instagram, Facebook, Twitter, Linkedin, Layers, Palette,
  Wand2, Star, ChevronRight, Monitor, Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { deductCredits, CREDIT_COSTS } from "@/lib/credits";

// ── Pollinations helper ───────────────────────────────────────
function pollinationsUrl(prompt: string, w: number, h: number, seed?: number) {
  const s = seed ?? Math.floor(Math.random() * 99999);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&nologo=true&enhance=true&model=flux&seed=${s}`;
}

// ── Styles ────────────────────────────────────────────────────
const STYLES = [
  { id: "photorealistic", label: "Photorealistic", emoji: "📷" },
  { id: "cinematic",      label: "Cinematic",       emoji: "🎬" },
  { id: "digital-art",   label: "Digital Art",     emoji: "🖥️" },
  { id: "3d-render",     label: "3D Render",       emoji: "🎭" },
  { id: "anime",         label: "Anime/Manga",     emoji: "🎌" },
  { id: "oil-painting",  label: "Oil Painting",    emoji: "🖼️" },
  { id: "watercolor",    label: "Watercolor",      emoji: "🎨" },
  { id: "minimalist",    label: "Minimalist",      emoji: "⬜" },
  { id: "cyberpunk",     label: "Cyberpunk",       emoji: "🌆" },
  { id: "fantasy",       label: "Fantasy",         emoji: "🧙" },
  { id: "vintage",       label: "Vintage/Retro",   emoji: "📻" },
  { id: "sketch",        label: "Pencil Sketch",   emoji: "✏️" },
  { id: "neon",          label: "Neon Glow",       emoji: "💡" },
  { id: "comic",         label: "Comic Book",      emoji: "💥" },
];

// ── Social platform presets ───────────────────────────────────
const SOCIAL_PLATFORMS = [
  { id: "yt-thumb",    label: "YouTube Thumbnail",  emoji: "🎬", icon: Youtube,    w: 1280, h: 720,  ratio: "16:9",  tip: "Click-worthy, bold text area" },
  { id: "yt-banner",   label: "YouTube Banner",     emoji: "📺", icon: Monitor,    w: 2560, h: 1440, ratio: "16:9",  tip: "Channel header art" },
  { id: "ig-post",     label: "Instagram Post",     emoji: "📸", icon: Instagram,  w: 1080, h: 1080, ratio: "1:1",   tip: "Square feed post" },
  { id: "ig-portrait", label: "Instagram Portrait", emoji: "📱", icon: Smartphone, w: 1080, h: 1350, ratio: "4:5",   tip: "Portrait for better reach" },
  { id: "ig-story",    label: "Instagram Story",    emoji: "⭕", icon: Smartphone, w: 1080, h: 1920, ratio: "9:16",  tip: "Vertical story/reel" },
  { id: "fb-post",     label: "Facebook Post",      emoji: "👍", icon: Facebook,   w: 1200, h: 630,  ratio: "~2:1",  tip: "Timeline post" },
  { id: "fb-cover",    label: "Facebook Cover",     emoji: "🖼️", icon: Monitor,    w: 1640, h: 856,  ratio: "~2:1",  tip: "Profile/page cover" },
  { id: "tw-post",     label: "Twitter / X Post",   emoji: "🐦", icon: Twitter,    w: 1200, h: 675,  ratio: "16:9",  tip: "In-feed tweet image" },
  { id: "tw-header",   label: "Twitter / X Header", emoji: "🔷", icon: Monitor,    w: 1500, h: 500,  ratio: "3:1",   tip: "Profile header" },
  { id: "li-post",     label: "LinkedIn Post",      emoji: "💼", icon: Linkedin,   w: 1200, h: 627,  ratio: "~2:1",  tip: "Professional post image" },
  { id: "li-banner",   label: "LinkedIn Banner",    emoji: "🏢", icon: Monitor,    w: 1584, h: 396,  ratio: "4:1",   tip: "Profile background banner" },
  { id: "pinterest",   label: "Pinterest Pin",      emoji: "📌", icon: Smartphone, w: 1000, h: 1500, ratio: "2:3",   tip: "Long-form pin" },
  { id: "tiktok",      label: "TikTok Cover",       emoji: "🎵", icon: Smartphone, w: 1080, h: 1920, ratio: "9:16",  tip: "Video thumbnail/cover" },
  { id: "ad-banner",   label: "Display Ad",         emoji: "📣", icon: Monitor,    w: 1200, h: 628,  ratio: "~2:1",  tip: "Google/Meta display ad" },
];

// ── Thumbnail styles ──────────────────────────────────────────
const THUMB_STYLES = [
  { id: "bold-red",    label: "Bold & Red",       desc: "High contrast, red accents, bold text" },
  { id: "dark-drama",  label: "Dark Dramatic",    desc: "Moody dark tones, cinematic lighting" },
  { id: "bright",      label: "Bright & Clean",   desc: "White/light background, vivid colors" },
  { id: "tech",        label: "Tech & Modern",    desc: "Blue/purple gradients, futuristic" },
  { id: "gaming",      label: "Gaming",           desc: "Neon, dark, explosive energy" },
  { id: "lifestyle",   label: "Lifestyle / Vlog", desc: "Warm, authentic, personal" },
];

// ── Logo industries ───────────────────────────────────────────
const LOGO_INDUSTRIES = [
  "Technology", "Fashion", "Food & Beverage", "Health & Fitness", "Finance",
  "Education", "Real Estate", "Travel", "Entertainment", "Beauty & Cosmetics",
  "Sports", "Photography", "Legal", "Gaming", "Consulting",
];

const LOGO_STYLES = [
  { id: "modern-minimal", label: "Modern Minimal", emoji: "⬜" },
  { id: "bold-geometric", label: "Bold Geometric", emoji: "🔷" },
  { id: "classic",        label: "Classic Elegant", emoji: "👑" },
  { id: "playful",        label: "Fun & Playful",  emoji: "🎈" },
  { id: "tech-abstract",  label: "Tech Abstract",  emoji: "🔮" },
  { id: "hand-drawn",     label: "Hand-Drawn",     emoji: "✍️" },
];

// ── Tabs ──────────────────────────────────────────────────────
const TABS = [
  { id: "text2img",   label: "Text to Image",         emoji: "✨" },
  { id: "social",     label: "Social Media Images",   emoji: "📱" },
  { id: "thumbnail",  label: "Thumbnail Maker",       emoji: "🎬" },
  { id: "logo",       label: "Logo Studio",           emoji: "🎨" },
];

// ── Image card ────────────────────────────────────────────────
function ImageResult({ url, label, w, h, onRegenerate, downloading }: {
  url: string; label: string; w: number; h: number;
  onRegenerate: () => void; downloading?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const aspect = w / h;
  const previewH = aspect >= 1 ? Math.round(280 / aspect) : 280;
  const previewW = aspect < 1 ? Math.round(280 * aspect) : 280;

  function download() {
    const a = document.createElement("a");
    a.href = url;
    a.download = `marketingstuffs-${Date.now()}.jpg`;
    a.target = "_blank";
    a.click();
  }

  function copyUrl() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/40"
    >
      <div className="flex items-center justify-center p-3 bg-black/30 min-h-[180px]">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
          </div>
        )}
        <img
          src={url}
          alt={label}
          onLoad={() => setLoaded(true)}
          style={{ maxWidth: previewW, maxHeight: previewH, objectFit: "cover", borderRadius: 8 }}
          className={`transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      </div>
      <div className="p-2 border-t border-white/8">
        <p className="text-white/60 text-xs mb-2">{label} · {w}×{h}px</p>
        <div className="flex gap-1.5">
          <button onClick={download} className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 text-xs font-medium transition-colors">
            <Download className="w-3 h-3" /> Download
          </button>
          <button onClick={copyUrl} className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 text-xs transition-colors">
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
          <button onClick={onRegenerate} className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 text-xs transition-colors">
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function ImageGeneratorSection() {
  const [activeTab, setActiveTab] = useState("text2img");

  // Text to Image state
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("photorealistic");
  const [aspect, setAspect] = useState<"1:1" | "4:3" | "16:9" | "9:16" | "4:5">("1:1");
  const [negPrompt, setNegPrompt] = useState("");
  const [batchCount, setBatchCount] = useState(1);
  const [generatedImages, setGeneratedImages] = useState<{ url: string; seed: number }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Social state
  const [socialPlatform, setSocialPlatform] = useState(SOCIAL_PLATFORMS[0]);
  const [socialTopic, setSocialTopic] = useState("");
  const [socialImages, setSocialImages] = useState<string[]>([]);
  const [isSocialGen, setIsSocialGen] = useState(false);

  // Thumbnail state
  const [thumbTitle, setThumbTitle] = useState("");
  const [thumbStyle, setThumbStyle] = useState(THUMB_STYLES[0]);
  const [thumbSubject, setThumbSubject] = useState("");
  const [thumbImages, setThumbImages] = useState<string[]>([]);
  const [isThumbGen, setIsThumbGen] = useState(false);

  // Logo state
  const [brandName, setBrandName] = useState("");
  const [logoIndustry, setLogoIndustry] = useState("Technology");
  const [logoStyle, setLogoStyle] = useState(LOGO_STYLES[0]);
  const [logoColor, setLogoColor] = useState("blue and white");
  const [logoImages, setLogoImages] = useState<string[]>([]);
  const [isLogoGen, setIsLogoGen] = useState(false);

  const ASPECT_DIMS: Record<string, [number, number]> = {
    "1:1": [1024, 1024], "4:3": [1280, 960], "16:9": [1280, 720], "9:16": [720, 1280], "4:5": [960, 1200],
  };

  const selectedStyle = STYLES.find(s => s.id === style)?.label ?? "photorealistic";

  // ── Text to Image generate ─────────────────────────────────
  async function generateText2Img() {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGeneratedImages([]);
    const [w, h] = ASPECT_DIMS[aspect];
    const neg = negPrompt.trim() ? `, avoid: ${negPrompt}` : "";
    const fullPrompt = `${prompt}, ${selectedStyle} style, ultra high quality, detailed${neg}`;
    const results = Array.from({ length: batchCount }, (_, i) => {
      const seed = Math.floor(Math.random() * 99999) + i * 1000;
      return { url: pollinationsUrl(fullPrompt, w, h, seed), seed };
    });
    setGeneratedImages(results);
    deductCredits(CREDIT_COSTS.tool_short.cost * batchCount);
    setTimeout(() => setIsGenerating(false), 1500);
  }

  function regenerateOne(index: number) {
    const [w, h] = ASPECT_DIMS[aspect];
    const fullPrompt = `${prompt}, ${selectedStyle} style, ultra high quality, detailed`;
    const seed = Math.floor(Math.random() * 99999);
    setGeneratedImages(prev => prev.map((img, i) => i === index ? { url: pollinationsUrl(fullPrompt, w, h, seed), seed } : img));
  }

  // ── Social generate ────────────────────────────────────────
  async function generateSocial() {
    if (!socialTopic.trim()) return;
    setIsSocialGen(true);
    setSocialImages([]);
    const { w, h, label } = socialPlatform;
    const prompts = [
      `${socialTopic}, ${label} image, professional marketing visual, high quality, vibrant colors, eye-catching`,
      `${socialTopic}, social media graphic, ${label} optimized, modern design, bold visual, professional`,
      `${socialTopic}, promotional image, ${label} format, clean professional design, marketing material`,
      `${socialTopic}, ${label} content, lifestyle photography, authentic and engaging, social media ready`,
    ];
    const urls = prompts.map(p => pollinationsUrl(p, w, h, Math.floor(Math.random() * 99999)));
    setSocialImages(urls);
    deductCredits(CREDIT_COSTS.tool_medium.cost);
    setTimeout(() => setIsSocialGen(false), 1500);
  }

  // ── Thumbnail generate ─────────────────────────────────────
  async function generateThumbnail() {
    if (!thumbTitle.trim()) return;
    setIsThumbGen(true);
    setThumbImages([]);
    const styleDesc = thumbStyle.desc;
    const subject = thumbSubject.trim() ? `, featuring ${thumbSubject}` : "";
    const prompts = [
      `YouTube thumbnail for "${thumbTitle}"${subject}, ${styleDesc}, text overlay space, clickbait psychology, ultra HD`,
      `YouTube video thumbnail "${thumbTitle}"${subject}, ${styleDesc}, professional, eye-catching, 16:9 composition`,
      `Thumbnail image: ${thumbTitle}${subject}, ${styleDesc}, YouTube-optimized, bold and dramatic, high CTR design`,
    ];
    const urls = prompts.map(p => pollinationsUrl(p, 1280, 720, Math.floor(Math.random() * 99999)));
    setThumbImages(urls);
    deductCredits(CREDIT_COSTS.tool_medium.cost);
    setTimeout(() => setIsThumbGen(false), 1500);
  }

  // ── Logo generate ──────────────────────────────────────────
  async function generateLogo() {
    if (!brandName.trim()) return;
    setIsLogoGen(true);
    setLogoImages([]);
    const prompts = [
      `${logoStyle.label} logo for "${brandName}", ${logoIndustry} brand, ${logoColor} color scheme, clean vector design, white background, professional brand identity`,
      `Minimalist logo design for ${brandName}, ${logoIndustry} company, ${logoStyle.label} style, ${logoColor}, isolated on white`,
      `Brand logo for ${brandName}, ${logoIndustry} sector, ${logoStyle.label} aesthetic, ${logoColor} palette, flat design, scalable`,
      `${brandName} company logo, ${logoIndustry}, ${logoStyle.label}, ${logoColor}, white background, high-end branding`,
    ];
    const urls = prompts.map(p => pollinationsUrl(p, 800, 800, Math.floor(Math.random() * 99999)));
    setLogoImages(urls);
    deductCredits(CREDIT_COSTS.tool_medium.cost);
    setTimeout(() => setIsLogoGen(false), 1500);
  }

  return (
    <section id="ai-image" className="py-24 relative overflow-hidden">
      <div className="absolute right-0 top-1/4 w-[600px] h-[600px] bg-teal-500/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute left-0 bottom-1/4 w-[400px] h-[400px] bg-violet-500/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="container px-4 mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-400 text-sm font-medium mb-5">
            <ImageIcon className="w-4 h-4" />
            AI Image Generator
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-5">
            AI Images That <span className="text-teal-400">Stop the Scroll</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Tired of stock photos? Describe your vision and get stunning, platform-perfect visuals — thumbnails, logos, social posts, and more. Free, instant, no design skills needed.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex overflow-x-auto gap-1.5 mb-8 p-1.5 bg-black/40 rounded-2xl border border-white/8 max-w-3xl mx-auto scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-1 justify-center ${
                activeTab === tab.id
                  ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>{tab.emoji}</span> {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ─── Tab 1: Text to Image ─── */}
          {activeTab === "text2img" && (
            <motion.div key="t2i" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="max-w-6xl mx-auto glass-card rounded-2xl border border-white/10 overflow-hidden">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Left: controls */}
                <div className="p-6 border-r border-white/8 space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-2">Describe your image</label>
                    <textarea
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/25 h-28 focus:outline-none focus:border-teal-500/40 resize-none text-sm"
                      placeholder="A futuristic city skyline at sunset with flying cars, neon lights reflecting on rain-soaked streets, cyberpunk aesthetic..."
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                    />
                  </div>

                  {/* Style chips */}
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Art Style</label>
                    <div className="flex flex-wrap gap-1.5">
                      {STYLES.map(s => (
                        <button key={s.id} onClick={() => setStyle(s.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${style === s.id ? "bg-teal-500/20 text-teal-400 border border-teal-500/30" : "bg-white/5 text-white/50 hover:text-white border border-transparent hover:border-white/10"}`}>
                          {s.emoji} {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Aspect ratio */}
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Aspect Ratio</label>
                    <div className="flex gap-2">
                      {(["1:1", "4:3", "16:9", "9:16", "4:5"] as const).map(r => (
                        <button key={r} onClick={() => setAspect(r)}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${aspect === r ? "bg-teal-500/20 text-teal-400 border border-teal-500/30" : "border border-white/10 text-white/50 hover:text-white hover:bg-white/5"}`}>
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Negative prompt */}
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Negative Prompt (optional)</label>
                    <input type="text" className="w-full bg-black/40 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-teal-500/30"
                      placeholder="blurry, low quality, distorted..."
                      value={negPrompt} onChange={e => setNegPrompt(e.target.value)} />
                  </div>

                  {/* Batch count */}
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Generate <span className="text-teal-400">{batchCount}</span> variation{batchCount > 1 ? "s" : ""}</label>
                    <input type="range" min={1} max={4} value={batchCount} onChange={e => setBatchCount(Number(e.target.value))}
                      className="w-full accent-teal-400" />
                  </div>

                  <Button onClick={generateText2Img} disabled={isGenerating || !prompt.trim()}
                    className="w-full bg-teal-500 hover:bg-teal-400 text-black font-semibold h-11 rounded-xl">
                    {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate Image{batchCount > 1 ? "s" : ""}</>}
                  </Button>
                </div>

                {/* Right: results */}
                <div className="p-6">
                  {generatedImages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[320px] gap-4">
                      <div className="w-20 h-20 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                        <ImageIcon className="w-10 h-10 text-teal-400/40" />
                      </div>
                      <p className="text-white/30 text-sm text-center">Your AI-generated images will appear here</p>
                      <div className="grid grid-cols-2 gap-2 w-full max-w-xs opacity-20">
                        {[1,2,3,4].map(i => <div key={i} className="aspect-square rounded-lg bg-white/10" />)}
                      </div>
                    </div>
                  ) : (
                    <div className={`grid gap-3 ${batchCount === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                      {generatedImages.map((img, i) => (
                        <ImageResult key={i} url={img.url} label={`Variation ${i + 1}`}
                          w={ASPECT_DIMS[aspect][0]} h={ASPECT_DIMS[aspect][1]}
                          onRegenerate={() => regenerateOne(i)} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── Tab 2: Social Media Templates ─── */}
          {activeTab === "social" && (
            <motion.div key="social" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="max-w-6xl mx-auto space-y-6">
              {/* Platform grid */}
              <div className="glass-card rounded-2xl border border-white/10 p-6">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Select Platform & Size</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
                  {SOCIAL_PLATFORMS.map(p => {
                    const Icon = p.icon;
                    const active = socialPlatform.id === p.id;
                    return (
                      <button key={p.id} onClick={() => setSocialPlatform(p)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs transition-all border ${active ? "bg-teal-500/15 border-teal-500/40 text-teal-400" : "border-white/8 bg-white/[0.02] text-white/50 hover:text-white hover:border-white/15"}`}>
                        <Icon className="w-4 h-4" />
                        <span className="font-medium text-center leading-tight">{p.label}</span>
                        <span className={`text-[10px] font-mono ${active ? "text-teal-400/70" : "text-white/25"}`}>{p.w}×{p.h}</span>
                      </button>
                    );
                  })}
                </div>
                {/* Selected platform info */}
                <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-teal-500/8 border border-teal-500/20 text-xs text-white/60">
                  <span className="text-teal-400 font-semibold">Selected:</span>
                  <span>{socialPlatform.label}</span>
                  <span className="text-white/30">·</span>
                  <span className="font-mono text-white/40">{socialPlatform.w}×{socialPlatform.h}px</span>
                  <span className="text-white/30">·</span>
                  <span>{socialPlatform.ratio}</span>
                  <span className="text-white/30">·</span>
                  <span className="text-white/40 italic">{socialPlatform.tip}</span>
                </div>
              </div>

              <div className="glass-card rounded-2xl border border-white/10 p-6 grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-2">Topic / Visual concept</label>
                    <textarea className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/25 h-28 focus:outline-none focus:border-teal-500/40 resize-none text-sm"
                      placeholder={`e.g. "A healthy meal prep guide for busy professionals" or "Summer sale 50% off announcement for clothing brand"...`}
                      value={socialTopic} onChange={e => setSocialTopic(e.target.value)} />
                  </div>
                  <Button onClick={generateSocial} disabled={isSocialGen || !socialTopic.trim()}
                    className="w-full bg-teal-500 hover:bg-teal-400 text-black font-semibold h-11 rounded-xl">
                    {isSocialGen ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating 4 variations...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate 4 {socialPlatform.label}s</>}
                  </Button>
                  <p className="text-xs text-white/30 text-center">Generates 4 unique variations optimized for {socialPlatform.label} ({socialPlatform.w}×{socialPlatform.h}px)</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {socialImages.length === 0 ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] flex items-center justify-center" style={{ aspectRatio: `${socialPlatform.w}/${socialPlatform.h}`, maxHeight: 140 }}>
                        <ImageIcon className="w-6 h-6 text-white/10" />
                      </div>
                    ))
                  ) : (
                    socialImages.map((url, i) => (
                      <ImageResult key={i} url={url} label={`${socialPlatform.label} v${i + 1}`}
                        w={socialPlatform.w} h={socialPlatform.h}
                        onRegenerate={generateSocial} />
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── Tab 3: Thumbnail Maker ─── */}
          {activeTab === "thumbnail" && (
            <motion.div key="thumb" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="max-w-6xl mx-auto glass-card rounded-2xl border border-white/10 p-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Youtube className="w-5 h-5 text-red-400" />
                      <label className="text-sm font-semibold text-white/80">Video Title</label>
                    </div>
                    <input type="text" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-red-500/40 text-sm"
                      placeholder="e.g. 10 Morning Habits That Changed My Life | Full Routine"
                      value={thumbTitle} onChange={e => setThumbTitle(e.target.value)} />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Thumbnail Style</label>
                    <div className="grid grid-cols-2 gap-2">
                      {THUMB_STYLES.map(s => (
                        <button key={s.id} onClick={() => setThumbStyle(s)}
                          className={`p-3 rounded-xl text-left transition-all border ${thumbStyle.id === s.id ? "border-red-500/40 bg-red-500/10 text-red-400" : "border-white/8 bg-white/[0.02] text-white/60 hover:border-white/15"}`}>
                          <p className="text-sm font-semibold">{s.label}</p>
                          <p className="text-xs text-white/40 mt-0.5">{s.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Subject / Person (optional)</label>
                    <input type="text" className="w-full bg-black/40 border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-red-500/30"
                      placeholder="e.g. young man holding coffee, shocked expression"
                      value={thumbSubject} onChange={e => setThumbSubject(e.target.value)} />
                  </div>

                  <Button onClick={generateThumbnail} disabled={isThumbGen || !thumbTitle.trim()}
                    className="w-full bg-red-500 hover:bg-red-400 text-white font-semibold h-11 rounded-xl">
                    {isThumbGen ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating thumbnails...</> : <><Star className="w-4 h-4 mr-2" /> Generate 3 Thumbnails</>}
                  </Button>
                  <p className="text-xs text-white/30 text-center">Outputs at 1280×720px (YouTube optimized)</p>
                </div>

                <div className="space-y-3">
                  {thumbImages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[280px] gap-3">
                      <Youtube className="w-12 h-12 text-red-400/20" />
                      <p className="text-white/25 text-sm">Enter a video title to generate thumbnails</p>
                    </div>
                  ) : (
                    thumbImages.map((url, i) => (
                      <ImageResult key={i} url={url} label={`Thumbnail option ${i + 1}`}
                        w={1280} h={720}
                        onRegenerate={generateThumbnail} />
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── Tab 4: Logo Studio ─── */}
          {activeTab === "logo" && (
            <motion.div key="logo" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="max-w-6xl mx-auto glass-card rounded-2xl border border-white/10 p-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-2">Brand Name</label>
                    <input type="text" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/40 text-base font-medium"
                      placeholder="e.g. NovaTech, BrightBrew, SwiftFlow..."
                      value={brandName} onChange={e => setBrandName(e.target.value)} />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Industry</label>
                    <select className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/40 text-sm"
                      value={logoIndustry} onChange={e => setLogoIndustry(e.target.value)}>
                      {LOGO_INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Logo Style</label>
                    <div className="grid grid-cols-3 gap-2">
                      {LOGO_STYLES.map(s => (
                        <button key={s.id} onClick={() => setLogoStyle(s)}
                          className={`p-2.5 rounded-xl text-sm font-medium transition-all border flex items-center gap-2 ${logoStyle.id === s.id ? "border-violet-500/40 bg-violet-500/10 text-violet-400" : "border-white/8 text-white/50 hover:border-white/15"}`}>
                          <span>{s.emoji}</span> {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Color Palette</label>
                    <input type="text" className="w-full bg-black/40 border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/30"
                      placeholder="e.g. deep blue and gold, green and white, black and neon orange"
                      value={logoColor} onChange={e => setLogoColor(e.target.value)} />
                  </div>

                  <Button onClick={generateLogo} disabled={isLogoGen || !brandName.trim()}
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold h-11 rounded-xl">
                    {isLogoGen ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating logos...</> : <><Palette className="w-4 h-4 mr-2" /> Generate 4 Logo Concepts</>}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {logoImages.length === 0 ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="aspect-square rounded-xl border border-dashed border-white/10 bg-white/[0.02] flex items-center justify-center">
                        <Layers className="w-8 h-8 text-white/10" />
                      </div>
                    ))
                  ) : (
                    logoImages.map((url, i) => (
                      <ImageResult key={i} url={url} label={`${brandName} Logo ${i + 1}`}
                        w={800} h={800}
                        onRegenerate={generateLogo} />
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
