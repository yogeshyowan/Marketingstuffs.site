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

// ── Arts & Drawing styles ─────────────────────────────────────
const ART_STYLES = [
  { id: "pencil-sketch",  label: "Pencil Sketch",    emoji: "✏️",  prompt: "detailed pencil sketch, graphite drawing, fine art, hand-drawn, realistic shading" },
  { id: "charcoal",       label: "Charcoal Art",     emoji: "🖤",  prompt: "charcoal drawing, smudged dark tones, expressive black and white art, textured paper" },
  { id: "watercolor",     label: "Watercolor",       emoji: "💧",  prompt: "soft watercolor painting, translucent washes of color, delicate brushwork, artistic" },
  { id: "oil-painting",   label: "Oil Painting",     emoji: "🖼️",  prompt: "classical oil painting, rich textures, painterly strokes, museum quality fine art" },
  { id: "comic-book",     label: "Comic Book",       emoji: "💥",  prompt: "comic book art style, bold ink outlines, halftone shading, vibrant colors, action panel" },
  { id: "manga",          label: "Manga / Anime",    emoji: "🎌",  prompt: "manga illustration style, clean anime line art, expressive characters, Japanese art style" },
  { id: "line-art",       label: "Line Art",         emoji: "〰️", prompt: "clean minimalist line art, single continuous lines, elegant contour drawing, white background" },
  { id: "pixel-art",      label: "Pixel Art",        emoji: "🕹️",  prompt: "retro pixel art, 8-bit style, pixelated illustration, game art aesthetic" },
  { id: "chalk-art",      label: "Chalk Art",        emoji: "🍋",  prompt: "chalk art on blackboard, textured chalk marks, vibrant colors on dark background" },
  { id: "impressionist",  label: "Impressionist",    emoji: "🌸",  prompt: "impressionist painting style, Monet-inspired, dappled light, loose brushstrokes, color blending" },
  { id: "surrealist",     label: "Surrealist",       emoji: "🌀",  prompt: "surrealist artwork, dreamlike impossible scene, Salvador Dali inspired, hyper-detailed" },
  { id: "stained-glass",  label: "Stained Glass",    emoji: "🔆",  prompt: "stained glass window art, vibrant colored glass panels, lead lines, cathedral style" },
];

// ── Graphic Design templates ──────────────────────────────────
const DESIGN_TEMPLATES = [
  { id: "poster",       label: "Poster",             emoji: "📋", w: 794, h: 1123, desc: "A3 portrait poster",        prompt: "professional poster design, bold typography, strong visual hierarchy, print-ready, marketing poster" },
  { id: "flyer",        label: "Event Flyer",        emoji: "🎫", w: 794, h: 1123, desc: "A4 portrait flyer",         prompt: "event flyer design, eye-catching layout, professional typography, promotional material" },
  { id: "business-card",label: "Business Card",      emoji: "💳", w: 1050, h: 600, desc: "Standard business card",    prompt: "elegant business card design, professional layout, clean minimal design, corporate identity" },
  { id: "banner",       label: "Web Banner",         emoji: "📣", w: 1200, h: 400, desc: "Leaderboard banner",        prompt: "web banner design, advertising banner, clean marketing layout, call to action" },
  { id: "email-header", label: "Email Header",       emoji: "📧", w: 1200, h: 300, desc: "Email newsletter header",   prompt: "email newsletter header design, professional branding, clean marketing layout" },
  { id: "book-cover",   label: "Book Cover",         emoji: "📚", w: 800, h: 1200, desc: "Book/ebook cover",          prompt: "professional book cover design, compelling artwork, bold title typography, genre-appropriate" },
  { id: "album-art",    label: "Album Art",          emoji: "🎵", w: 1000, h: 1000, desc: "Music album cover",        prompt: "music album cover art, artistic design, square format, creative visual concept" },
  { id: "presentation", label: "Slide / Keynote",   emoji: "📊", w: 1280, h: 720,  desc: "Presentation slide 16:9",  prompt: "presentation slide design, professional keynote slide, clean layout, data visualization" },
  { id: "menu",         label: "Restaurant Menu",   emoji: "🍽️", w: 794, h: 1123, desc: "A4 menu card",              prompt: "elegant restaurant menu design, food photography layout, luxury dining aesthetic" },
  { id: "certificate",  label: "Certificate",       emoji: "🏆", w: 1200, h: 850, desc: "Landscape certificate",     prompt: "professional certificate design, elegant border, award certificate, formal typography" },
];

// ── Product types ─────────────────────────────────────────────
const PRODUCT_TYPES = [
  { id: "white-bg",    label: "White Studio",       emoji: "⬜", prompt: "product photography on pure white background, professional studio lighting, clean commercial photo, e-commerce ready" },
  { id: "lifestyle",   label: "Lifestyle Shot",     emoji: "🌿", prompt: "lifestyle product photography, contextual setting, natural lighting, aspirational scene, brand storytelling" },
  { id: "flat-lay",    label: "Flat Lay",           emoji: "📐", prompt: "flat lay product photography, overhead bird's eye view, styled composition, minimalist props, clean background" },
  { id: "packaging",   label: "Packaging Mockup",   emoji: "📦", prompt: "professional packaging mockup, box design visualization, branding on packaging, studio render" },
  { id: "3d-render",   label: "3D Product Render",  emoji: "🎭", prompt: "3D product render, photorealistic CGI, studio lighting, high gloss product visualization" },
  { id: "outdoor",     label: "Outdoor / Scenic",   emoji: "🏔️", prompt: "outdoor product photography, natural scenic background, adventure lifestyle brand, golden hour lighting" },
  { id: "on-model",    label: "On Model / Person",  emoji: "👤", prompt: "product in use, person using product, lifestyle model photography, natural authentic use case" },
  { id: "closeup",     label: "Detail Close-up",    emoji: "🔍", prompt: "macro product photography, extreme close-up detail shot, texture and material showcase, high detail" },
];

// ── Template Categories (matching screenshot) ──────────────────
const TEMPLATE_CATS = [
  { id: "all",      label: "All Templates",           emoji: "🗂️",  prompts: ["design template gallery", "creative template layout", "professional document template", "modern visual template"] },
  { id: "social",   label: "Social Media",            emoji: "📱",  prompts: ["Instagram post template", "Facebook cover template", "Twitter banner template", "LinkedIn post template"] },
  { id: "cards",    label: "Cards & Invitations",     emoji: "🎉",  prompts: ["birthday party invitation card design", "wedding invitation elegant template", "baby shower invitation pink floral", "event invitation card design"] },
  { id: "print",    label: "Print Marketing",         emoji: "🖨️",  prompts: ["promotional flyer template design", "business brochure tri-fold", "leaflet marketing design", "catalogue print design"] },
  { id: "docs",     label: "Professional Documents",  emoji: "📄",  prompts: ["professional resume template design", "business letterhead template", "invoice professional design", "company report cover page"] },
  { id: "edu",      label: "Educational Materials",   emoji: "🎓",  prompts: ["educational worksheet template", "school certificate design", "infographic educational template", "classroom poster design"] },
  { id: "digital",  label: "Digital Marketing",       emoji: "💻",  prompts: ["email newsletter template design", "web banner advertising design", "digital ad template", "landing page mockup design"] },
  { id: "products", label: "Print Products",          emoji: "🏷️",  prompts: ["product label sticker design", "packaging box design template", "tag label design", "merchandise print design"] },
  { id: "visual",   label: "Visual Design Elements",  emoji: "🎨",  prompts: ["decorative pattern background design", "abstract geometric design element", "icon set flat design", "illustration design element"] },
];

// ── Tabs ──────────────────────────────────────────────────────
const TABS = [
  { id: "text2img",   label: "Text to Image",       emoji: "✨" },
  { id: "templates",  label: "Templates",            emoji: "📋" },
  { id: "arts",       label: "Arts & Drawing",      emoji: "🖼️" },
  { id: "social",     label: "Social Media",        emoji: "📱" },
  { id: "thumbnail",  label: "Thumbnails",          emoji: "🎬" },
  { id: "graphics",   label: "Graphic Designs",     emoji: "📐" },
  { id: "product",    label: "Product Studio",      emoji: "📦" },
  { id: "logo",       label: "Logo Studio",         emoji: "🎨" },
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

  // Templates state
  const [templateCat, setTemplateCat] = useState(TEMPLATE_CATS[0]);
  const [templateImages, setTemplateImages] = useState<string[]>([]);
  const [isTemplateGen, setIsTemplateGen] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");

  // Arts & Drawing state
  const [artPrompt, setArtPrompt] = useState("");
  const [artStyle, setArtStyle] = useState(ART_STYLES[0]);
  const [artImages, setArtImages] = useState<string[]>([]);
  const [isArtGen, setIsArtGen] = useState(false);

  // Graphic Design state
  const [designTemplate, setDesignTemplate] = useState(DESIGN_TEMPLATES[0]);
  const [designTopic, setDesignTopic] = useState("");
  const [designColors, setDesignColors] = useState("blue and white");
  const [designImages, setDesignImages] = useState<string[]>([]);
  const [isDesignGen, setIsDesignGen] = useState(false);

  // Product Studio state
  const [productName, setProductName] = useState("");
  const [productType, setProductType] = useState(PRODUCT_TYPES[0]);
  const [productDesc, setProductDesc] = useState("");
  const [productImages, setProductImages] = useState<string[]>([]);
  const [isProductGen, setIsProductGen] = useState(false);

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

  // ── Templates generate ─────────────────────────────────────
  async function generateTemplate(cat: typeof TEMPLATE_CATS[0]) {
    setIsTemplateGen(true);
    setTemplateImages([]);
    const prompts = cat.id === "all"
      ? [...TEMPLATE_CATS.slice(1).flatMap(c => c.prompts.slice(0, 1)).slice(0, 8)]
      : [...cat.prompts, ...cat.prompts];
    const urls = prompts.slice(0, 8).map((p, i) =>
      pollinationsUrl(`${p}, clean professional design, white background, high quality graphic design, modern layout`, 800, 1000, Math.floor(Math.random() * 99999) + i * 77)
    );
    setTemplateImages(urls);
    deductCredits(CREDIT_COSTS.tool_short.cost);
    setTimeout(() => setIsTemplateGen(false), 1200);
  }

  // ── Arts & Drawing generate ────────────────────────────────
  async function generateArt() {
    if (!artPrompt.trim()) return;
    setIsArtGen(true);
    setArtImages([]);
    const stylePrompt = artStyle.prompt;
    const prompts = [
      `${artPrompt}, ${stylePrompt}, masterpiece, ultra detailed`,
      `${artPrompt}, ${stylePrompt}, high quality artwork, professional artist`,
      `${artPrompt}, ${stylePrompt}, award winning art, stunning composition`,
      `${artPrompt}, ${stylePrompt}, fine art, beautiful rendering`,
    ];
    const urls = prompts.map(p => pollinationsUrl(p, 1024, 1024, Math.floor(Math.random() * 99999)));
    setArtImages(urls);
    deductCredits(CREDIT_COSTS.tool_medium.cost);
    setTimeout(() => setIsArtGen(false), 1500);
  }

  // ── Graphic Design generate ────────────────────────────────
  async function generateDesign() {
    if (!designTopic.trim()) return;
    setIsDesignGen(true);
    setDesignImages([]);
    const { w, h, prompt: tmplPrompt, label } = designTemplate;
    const prompts = [
      `${label}: "${designTopic}", ${tmplPrompt}, ${designColors} color scheme, clean layout, high quality`,
      `Professional ${label} design for "${designTopic}", ${tmplPrompt}, ${designColors} palette, modern aesthetic`,
      `${label} template: ${designTopic}, ${tmplPrompt}, ${designColors}, creative layout, print-ready quality`,
      `${designTopic} ${label}, ${tmplPrompt}, ${designColors} branding, sleek design, professional result`,
    ];
    const urls = prompts.map(p => pollinationsUrl(p, w, h, Math.floor(Math.random() * 99999)));
    setDesignImages(urls);
    deductCredits(CREDIT_COSTS.tool_medium.cost);
    setTimeout(() => setIsDesignGen(false), 1500);
  }

  // ── Product Studio generate ────────────────────────────────
  async function generateProduct() {
    if (!productName.trim()) return;
    setIsProductGen(true);
    setProductImages([]);
    const typePrompt = productType.prompt;
    const desc = productDesc.trim() ? `, ${productDesc}` : "";
    const prompts = [
      `${productName}${desc}, ${typePrompt}, commercial photography, ultra HD`,
      `${productName}${desc}, ${typePrompt}, professional product shot, studio quality`,
      `${productName}${desc}, ${typePrompt}, high resolution commercial image, premium brand`,
      `${productName}${desc}, ${typePrompt}, photorealistic render, product catalog quality`,
    ];
    const urls = prompts.map(p => pollinationsUrl(p, 1024, 1024, Math.floor(Math.random() * 99999)));
    setProductImages(urls);
    deductCredits(CREDIT_COSTS.tool_medium.cost);
    setTimeout(() => setIsProductGen(false), 1500);
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
        <div className="flex overflow-x-auto gap-1 mb-8 p-1.5 bg-black/40 rounded-2xl border border-white/8 max-w-5xl mx-auto scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-1 justify-center min-w-[100px] ${
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
          {/* ─── Templates Tab ─── */}
          {activeTab === "templates" && (
            <motion.div key="templates" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="max-w-6xl mx-auto glass-card rounded-2xl border border-white/10 overflow-hidden">
              <div className="grid md:grid-cols-[220px_1fr]">
                {/* Sidebar */}
                <div className="border-r border-white/8 p-3 space-y-1">
                  <div className="px-3 py-2 mb-2">
                    <input type="text" placeholder="Search templates..."
                      className="w-full bg-black/40 border border-white/8 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-teal-500/30"
                      value={templateSearch} onChange={e => setTemplateSearch(e.target.value)} />
                  </div>
                  {TEMPLATE_CATS.map(cat => (
                    <button key={cat.id}
                      onClick={() => { setTemplateCat(cat); generateTemplate(cat); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${templateCat.id === cat.id ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "text-white/50 hover:text-white hover:bg-white/5"}`}>
                      <span>{cat.emoji}</span>
                      <span className="truncate">{cat.label}</span>
                    </button>
                  ))}
                </div>

                {/* Template grid */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-white font-semibold">{templateCat.label}</h3>
                      <p className="text-xs text-white/40 mt-0.5">Complete collection — click to generate</p>
                    </div>
                    <Button onClick={() => generateTemplate(templateCat)} disabled={isTemplateGen} size="sm"
                      className="bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs">
                      {isTemplateGen ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Loading...</> : <><RefreshCw className="w-3 h-3 mr-1" />Refresh</>}
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {templateImages.length === 0 ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="aspect-[4/5] rounded-xl border border-dashed border-white/8 bg-white/[0.02] flex items-center justify-center cursor-pointer hover:bg-white/[0.04] transition-colors"
                          onClick={() => generateTemplate(templateCat)}>
                          {isTemplateGen ? <Loader2 className="w-5 h-5 text-white/20 animate-spin" /> : <Layers className="w-5 h-5 text-white/10" />}
                        </div>
                      ))
                    ) : (
                      templateImages.map((url, i) => (
                        <ImageResult key={i} url={url} label={`${templateCat.label} ${i + 1}`}
                          w={800} h={1000}
                          onRegenerate={() => generateTemplate(templateCat)} />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── Tab 5: Arts & Drawing ─── */}
          {activeTab === "arts" && (
            <motion.div key="arts" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="max-w-6xl mx-auto glass-card rounded-2xl border border-white/10 p-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-2">What do you want to draw?</label>
                    <textarea
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/25 h-28 focus:outline-none focus:border-purple-500/40 resize-none text-sm"
                      placeholder="A majestic lion resting in a savanna at golden hour, surrounded by tall grass and acacia trees..."
                      value={artPrompt}
                      onChange={e => setArtPrompt(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Art Style</label>
                    <div className="grid grid-cols-3 gap-2">
                      {ART_STYLES.map(s => (
                        <button key={s.id} onClick={() => setArtStyle(s)}
                          className={`p-2.5 rounded-xl text-xs font-medium transition-all border flex items-center gap-1.5 ${artStyle.id === s.id ? "border-purple-500/40 bg-purple-500/10 text-purple-400" : "border-white/8 text-white/50 hover:border-white/15 hover:text-white"}`}>
                          <span className="text-base">{s.emoji}</span> {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5">
                    <p className="text-xs text-purple-300/70 font-medium">Selected: <span className="text-purple-300">{artStyle.emoji} {artStyle.label}</span></p>
                    <p className="text-xs text-white/30 mt-1 leading-relaxed">{artStyle.prompt}</p>
                  </div>

                  <Button onClick={generateArt} disabled={isArtGen || !artPrompt.trim()}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold h-11 rounded-xl">
                    {isArtGen ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating artwork...</> : <><Wand2 className="w-4 h-4 mr-2" /> Generate 4 Artworks</>}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {artImages.length === 0 ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="aspect-square rounded-xl border border-dashed border-white/10 bg-white/[0.02] flex items-center justify-center">
                        <Palette className="w-8 h-8 text-white/10" />
                      </div>
                    ))
                  ) : (
                    artImages.map((url, i) => (
                      <ImageResult key={i} url={url} label={`${artStyle.label} Art ${i + 1}`}
                        w={1024} h={1024}
                        onRegenerate={generateArt} />
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── Tab 6: Graphic Designs ─── */}
          {activeTab === "graphics" && (
            <motion.div key="graphics" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="max-w-6xl mx-auto glass-card rounded-2xl border border-white/10 p-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Design Template</label>
                    <div className="grid grid-cols-2 gap-2">
                      {DESIGN_TEMPLATES.map(t => (
                        <button key={t.id} onClick={() => setDesignTemplate(t)}
                          className={`p-2.5 rounded-xl text-xs font-medium transition-all border flex items-center gap-2 ${designTemplate.id === t.id ? "border-orange-500/40 bg-orange-500/10 text-orange-400" : "border-white/8 text-white/50 hover:border-white/15 hover:text-white"}`}>
                          <span className="text-base">{t.emoji}</span>
                          <span className="text-left">
                            <div className="font-semibold">{t.label}</div>
                            <div className="text-white/30 text-[10px]">{t.desc}</div>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-2">Topic / Subject</label>
                    <input type="text"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-orange-500/40 text-sm"
                      placeholder="e.g. Summer Music Festival 2025, Tech Conference, New Product Launch..."
                      value={designTopic} onChange={e => setDesignTopic(e.target.value)} />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Color Scheme</label>
                    <input type="text"
                      className="w-full bg-black/40 border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500/30"
                      placeholder="e.g. deep purple and gold, navy and coral, black and electric blue"
                      value={designColors} onChange={e => setDesignColors(e.target.value)} />
                  </div>

                  <Button onClick={generateDesign} disabled={isDesignGen || !designTopic.trim()}
                    className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold h-11 rounded-xl">
                    {isDesignGen ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Designing...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate 4 Designs</>}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {designImages.length === 0 ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className={`rounded-xl border border-dashed border-white/10 bg-white/[0.02] flex items-center justify-center ${designTemplate.h > designTemplate.w ? "aspect-[3/4]" : "aspect-video"}`}>
                        <Layers className="w-8 h-8 text-white/10" />
                      </div>
                    ))
                  ) : (
                    designImages.map((url, i) => (
                      <ImageResult key={i} url={url} label={`${designTemplate.label} ${i + 1}`}
                        w={designTemplate.w} h={designTemplate.h}
                        onRegenerate={generateDesign} />
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── Tab 7: Product Studio ─── */}
          {activeTab === "product" && (
            <motion.div key="product" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="max-w-6xl mx-auto glass-card rounded-2xl border border-white/10 p-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-2">Product Name</label>
                    <input type="text"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-cyan-500/40 text-sm font-medium"
                      placeholder="e.g. Wireless Headphones, Luxury Watch, Skincare Serum..."
                      value={productName} onChange={e => setProductName(e.target.value)} />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Photography Style</label>
                    <div className="grid grid-cols-2 gap-2">
                      {PRODUCT_TYPES.map(t => (
                        <button key={t.id} onClick={() => setProductType(t)}
                          className={`p-2.5 rounded-xl text-xs font-medium transition-all border flex items-center gap-2 ${productType.id === t.id ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400" : "border-white/8 text-white/50 hover:border-white/15 hover:text-white"}`}>
                          <span className="text-base">{t.emoji}</span> {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-2">Product Description <span className="text-white/30 font-normal">(optional)</span></label>
                    <textarea
                      className="w-full bg-black/40 border border-white/8 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/30 resize-none text-sm h-20"
                      placeholder="e.g. matte black finish, premium leather strap, minimalist design..."
                      value={productDesc} onChange={e => setProductDesc(e.target.value)}
                    />
                  </div>

                  <Button onClick={generateProduct} disabled={isProductGen || !productName.trim()}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold h-11 rounded-xl">
                    {isProductGen ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Shooting product...</> : <><Star className="w-4 h-4 mr-2" /> Generate 4 Product Shots</>}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {productImages.length === 0 ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="aspect-square rounded-xl border border-dashed border-white/10 bg-white/[0.02] flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-white/10" />
                      </div>
                    ))
                  ) : (
                    productImages.map((url, i) => (
                      <ImageResult key={i} url={url} label={`${productName} — ${productType.label} ${i + 1}`}
                        w={1024} h={1024}
                        onRegenerate={generateProduct} />
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
