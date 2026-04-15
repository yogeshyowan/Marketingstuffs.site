import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ImageIcon, Mail, Type, Sparkles, Download, Copy, Check,
  RefreshCw, Loader2, BookOpen, Palette, Zap, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Pollinations helper ──────────────────────────────────────
function pollinationsUrl(prompt: string, w: number, h: number, seed?: number) {
  const s = seed ?? Math.floor(Math.random() * 99999);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&nologo=true&enhance=true&model=flux&seed=${s}`;
}

// ── Types ────────────────────────────────────────────────────
type ToolId = "anime" | "image" | "email" | "logo" | "art" | "text" | "bookcover";

interface Tool {
  id: ToolId;
  label: string;
  emoji: string;
  color: string;
  tagline: string;
}

const TOOLS: Tool[] = [
  { id: "anime",     label: "AI Anime Generator",   emoji: "🎌", color: "#f472b6", tagline: "Create stunning anime & manga art" },
  { id: "image",     label: "AI Image Generator",   emoji: "🖼️", color: "#22d3ee", tagline: "Any image from any description" },
  { id: "email",     label: "AI Email Generator",   emoji: "📧", color: "#34d399", tagline: "High-converting email copy in seconds" },
  { id: "logo",      label: "AI Logo Generator",    emoji: "💎", color: "#a78bfa", tagline: "Beautiful logo concepts instantly" },
  { id: "art",       label: "AI Art Generator",     emoji: "🎨", color: "#fb923c", tagline: "Fine art, illustration & creative visuals" },
  { id: "text",      label: "AI Text Generator",    emoji: "✍️", color: "#facc15", tagline: "Headlines, copy & content for everything" },
  { id: "bookcover", label: "AI Book Cover Maker",  emoji: "📚", color: "#f87171", tagline: "Professional book covers in one click" },
];

// ── SSE streaming helper ──────────────────────────────────────
async function streamText(endpoint: string, body: Record<string, string>, onChunk: (t: string) => void) {
  const r = await fetch(`/api/ai/${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok || !r.body) throw new Error("Network error");
  const reader = r.body.getReader(); const dec = new TextDecoder(); let buf = "";
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n"); buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const ev = JSON.parse(line.slice(6));
        if (ev.done || ev.error) return;
        if (ev.content) onChunk(ev.content);
      } catch { /* skip */ }
    }
  }
}

// ── Image tool shared component ───────────────────────────────
function ImageTool({
  toolId, color, promptLabel, promptPlaceholder, extraFields, buildPrompt,
  aspectOptions, defaultAspect,
}: {
  toolId: ToolId; color: string; promptLabel: string; promptPlaceholder: string;
  extraFields?: React.ReactNode; buildPrompt: (prompt: string) => string;
  aspectOptions?: { label: string; w: number; h: number }[];
  defaultAspect?: number;
}) {
  const [prompt, setPrompt] = useState("");
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [seed, setSeed] = useState(0);
  const aspects = aspectOptions ?? [
    { label: "1:1", w: 1024, h: 1024 }, { label: "16:9", w: 1280, h: 720 }, { label: "9:16", w: 720, h: 1280 },
  ];
  const [aspectIdx, setAspectIdx] = useState(defaultAspect ?? 0);
  const { w, h } = aspects[aspectIdx];

  const generate = () => {
    if (!prompt.trim()) return;
    const newSeed = Math.floor(Math.random() * 99999);
    setSeed(newSeed);
    setLoading(true);
    setImgUrl(pollinationsUrl(buildPrompt(prompt), w, h, newSeed));
  };

  const download = () => {
    if (!imgUrl) return;
    const a = document.createElement("a"); a.href = imgUrl; a.download = `${toolId}-${Date.now()}.jpg`; a.click();
  };

  const aspectClass: Record<string, string> = { "1:1": "aspect-square", "16:9": "aspect-video", "9:16": "aspect-[9/16] max-h-[500px]", "2:3": "aspect-[2/3] max-h-[500px]", "6:9": "aspect-[6/9] max-h-[500px]" };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">{promptLabel}</label>
          <textarea
            className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/30 h-28 focus:outline-none focus:border-white/30 resize-none transition-colors text-sm"
            placeholder={promptPlaceholder}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
          />
        </div>
        {extraFields}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Aspect Ratio</label>
          <div className="flex gap-2">
            {aspects.map((a, i) => (
              <button key={a.label} onClick={() => setAspectIdx(i)}
                className={`flex-1 py-2 rounded-lg text-sm transition-colors border ${aspectIdx === i ? "border-white/40 text-white bg-white/10" : "border-white/10 text-white/50 hover:bg-white/5"}`}
                style={aspectIdx === i ? { borderColor: color } : {}}
              >{a.label}</button>
            ))}
          </div>
        </div>
        <Button className="w-full h-12 font-bold text-base rounded-xl text-black" style={{ background: color }} onClick={generate} disabled={!prompt.trim() || loading}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate Image</>}
        </Button>
      </div>
      <div>
        <div className={`relative w-full ${aspectClass[aspects[aspectIdx].label] ?? "aspect-square"} bg-black/30 border border-white/10 rounded-xl overflow-hidden`}>
          {loading && !imgUrl && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color }} />
              <p className="text-white/40 text-sm">Creating your image…</p>
            </div>
          )}
          {imgUrl ? (
            <div className="relative group w-full h-full">
              <img src={imgUrl} alt="Generated" className="w-full h-full object-cover" onLoad={() => setLoading(false)} onError={() => { setLoading(false); }} />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <Button size="sm" onClick={download} className="bg-white text-black hover:bg-white/90"><Download className="w-4 h-4 mr-1" /> Save</Button>
                <Button size="sm" variant="outline" onClick={generate} className="border-white/30 text-white hover:bg-white/10"><RefreshCw className="w-4 h-4 mr-1" /> New</Button>
              </div>
            </div>
          ) : !loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6">
              <ImageIcon className="w-10 h-10 text-white/15" />
              <p className="text-white/25 text-sm">Your image appears here</p>
            </div>
          ) : null}
        </div>
        {imgUrl && !loading && (
          <p className="text-white/25 text-xs mt-2 text-center">Hover over the image to download or regenerate</p>
        )}
      </div>
    </div>
  );
}

// ── Individual tools ──────────────────────────────────────────

function AnimeGeneratorTool() {
  const [style, setStyle] = useState("Shonen anime");
  const [character, setCharacter] = useState("hero");
  const ANIME_STYLES = ["Shonen anime", "Shojo manga", "Studio Ghibli", "Cyberpunk anime", "Dark fantasy manga", "Kawaii chibi", "Mecha anime", "Slice of life"];
  const CHARACTERS = ["hero", "villain", "magical girl", "samurai", "robot", "princess", "warrior", "wizard"];

  return (
    <ImageTool
      toolId="anime" color="#f472b6"
      promptLabel="Describe your anime character or scene"
      promptPlaceholder="A powerful young mage with silver hair and glowing purple eyes, standing on a rooftop at night in a neon city, dramatic lighting..."
      buildPrompt={p => `${style} style, ${character} character, ${p}, high quality anime art, detailed illustration, vibrant colors, dynamic composition`}
      aspectOptions={[{ label: "1:1", w: 1024, h: 1024 }, { label: "9:16", w: 720, h: 1280 }, { label: "16:9", w: 1280, h: 720 }]}
      extraFields={
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Anime Style</label>
            <select className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white text-sm focus:outline-none" value={style} onChange={e => setStyle(e.target.value)}>
              {ANIME_STYLES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Character Type</label>
            <select className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white text-sm focus:outline-none" value={character} onChange={e => setCharacter(e.target.value)}>
              {CHARACTERS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
      }
    />
  );
}

function ImageGeneratorTool() {
  const [style, setStyle] = useState("Photorealistic");
  const STYLES = ["Photorealistic", "Digital Art", "3D Render", "Oil Painting", "Watercolor", "Minimalist", "Cinematic", "Illustration", "Concept Art", "Vintage"];

  return (
    <ImageTool
      toolId="image" color="#22d3ee"
      promptLabel="Describe the image you want to create"
      promptPlaceholder="A futuristic city skyline at sunset, flying vehicles, neon signs reflecting on rain-soaked streets..."
      buildPrompt={p => `${p}, ${style} style, high quality, professional, ultra detailed`}
      extraFields={
        <div>
          <label className="block text-xs font-medium text-white/60 mb-1.5">Style</label>
          <div className="flex flex-wrap gap-2">
            {STYLES.map(s => (
              <button key={s} onClick={() => setStyle(s)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-all ${style === s ? "border-cyan-400 bg-cyan-400/20 text-cyan-300" : "border-white/10 text-white/50 hover:border-white/30"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      }
    />
  );
}

function LogoGeneratorTool() {
  const [style, setStyle] = useState("Minimal flat");
  const [industry, setIndustry] = useState("Technology");
  const LOGO_STYLES = ["Minimal flat", "Geometric abstract", "Monogram lettermark", "Emblem badge", "Wordmark", "Vintage retro", "3D metallic", "Gradient modern"];
  const INDUSTRIES = ["Technology", "Fashion", "Food & Beverage", "Healthcare", "Finance", "Education", "Sports", "Beauty", "Real Estate", "Creative Agency"];

  return (
    <ImageTool
      toolId="logo" color="#a78bfa"
      promptLabel="Brand name & what it stands for"
      promptPlaceholder="NovaTech — a cutting-edge cloud software company for small businesses..."
      buildPrompt={p => `${style} logo design for ${p}, ${industry} industry, white background, clean professional branding, vector style, centered composition, no text unless wordmark`}
      aspectOptions={[{ label: "1:1", w: 1024, h: 1024 }, { label: "16:9", w: 1280, h: 640 }]}
      extraFields={
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Logo Style</label>
            <select className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white text-sm focus:outline-none" value={style} onChange={e => setStyle(e.target.value)}>
              {LOGO_STYLES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Industry</label>
            <select className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white text-sm focus:outline-none" value={industry} onChange={e => setIndustry(e.target.value)}>
              {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
        </div>
      }
    />
  );
}

function ArtGeneratorTool() {
  const [style, setStyle] = useState("Impressionist");
  const [mood, setMood] = useState("Dramatic");
  const ART_STYLES = ["Impressionist", "Surrealist", "Abstract expressionist", "Renaissance", "Art Nouveau", "Pop Art", "Cubist", "Baroque", "Contemporary", "Street Art"];
  const MOODS = ["Dramatic", "Peaceful", "Mysterious", "Energetic", "Melancholic", "Joyful", "Epic", "Dreamy"];

  return (
    <ImageTool
      toolId="art" color="#fb923c"
      promptLabel="Describe your artwork"
      promptPlaceholder="A lone lighthouse on a stormy cliff edge, crashing waves below, dramatic thunderclouds, golden light breaking through..."
      buildPrompt={p => `${p}, ${style} art style, ${mood} mood, masterpiece, fine art quality, museum-worthy, incredible detail`}
      extraFields={
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Art Style</label>
            <select className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white text-sm focus:outline-none" value={style} onChange={e => setStyle(e.target.value)}>
              {ART_STYLES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Mood</label>
            <select className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white text-sm focus:outline-none" value={mood} onChange={e => setMood(e.target.value)}>
              {MOODS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>
      }
    />
  );
}

function BookCoverTool() {
  const [genre, setGenre] = useState("Thriller");
  const GENRES = ["Thriller", "Romance", "Fantasy", "Sci-Fi", "Mystery", "Horror", "Self-Help", "Business", "Children's", "Biography", "Literary Fiction", "Adventure"];

  return (
    <ImageTool
      toolId="bookcover" color="#f87171"
      promptLabel="Book title, author name & what the story is about"
      promptPlaceholder="'The Last Signal' by J. Reed — a sci-fi thriller about an astronaut who receives a transmission from a planet that shouldn't exist..."
      buildPrompt={p => `Professional book cover design, ${genre} genre, ${p}, dramatic typography, evocative imagery, publishing quality, bestseller style, vertical book format`}
      aspectOptions={[{ label: "2:3", w: 800, h: 1200 }, { label: "1:1", w: 1024, h: 1024 }]}
      defaultAspect={0}
      extraFields={
        <div>
          <label className="block text-xs font-medium text-white/60 mb-1.5">Genre</label>
          <div className="flex flex-wrap gap-2">
            {GENRES.map(g => (
              <button key={g} onClick={() => setGenre(g)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-all ${genre === g ? "border-red-400 bg-red-400/20 text-red-300" : "border-white/10 text-white/50 hover:border-white/30"}`}>
                {g}
              </button>
            ))}
          </div>
        </div>
      }
    />
  );
}

function EmailGeneratorTool() {
  const [purpose, setPurpose] = useState("");
  const [brand, setBrand] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("professional");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState<Record<string, string> | null>(null);
  const [copied, setCopied] = useState("");
  const TONES = ["professional", "friendly", "urgent", "casual", "inspirational", "formal"];

  const generate = async () => {
    if (!purpose.trim()) return;
    setLoading(true); setEmail(null);
    try {
      const r = await fetch("/api/ai/generate-email", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose, brand, audience, tone, details }),
      });
      const data = await r.json() as Record<string, string>;
      setEmail(data);
    } finally { setLoading(false); }
  };

  const copy = (field: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(""), 2000);
  };

  const copyAll = () => {
    if (!email) return;
    const full = `Subject: ${email.subjectLine}\nPreview: ${email.previewText}\n\n${email.greeting}\n\n${email.body}\n\n${email.cta}\n\n${email.signOff}${email.ps ? "\n\nP.S. " + email.ps : ""}`;
    copy("all", full);
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Purpose / Goal of this email *</label>
          <input className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors" placeholder="e.g. Announce a 40% flash sale on all plans this weekend only" value={purpose} onChange={e => setPurpose(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Brand / Company</label>
            <input className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none" placeholder="Acme Corp" value={brand} onChange={e => setBrand(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Target Audience</label>
            <input className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none" placeholder="SaaS founders" value={audience} onChange={e => setAudience(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-white/60 mb-1.5">Tone</label>
          <div className="flex flex-wrap gap-2">
            {TONES.map(t => (
              <button key={t} onClick={() => setTone(t)}
                className={`px-3 py-1.5 rounded-full text-xs border capitalize transition-all ${tone === t ? "border-emerald-400 bg-emerald-400/20 text-emerald-300" : "border-white/10 text-white/50 hover:border-white/30"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-white/60 mb-1.5">Extra details (optional)</label>
          <textarea className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none resize-none" rows={3} placeholder="Promo code: SAVE40, expires Sunday midnight, free shipping included..." value={details} onChange={e => setDetails(e.target.value)} />
        </div>
        <Button className="w-full h-12 font-bold text-base rounded-xl text-black bg-emerald-400 hover:bg-emerald-300" onClick={generate} disabled={!purpose.trim() || loading}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating email...</> : <><Mail className="w-4 h-4 mr-2" />Generate Email</>}
        </Button>
      </div>

      <div>
        {!email && !loading && (
          <div className="h-full min-h-[300px] border border-dashed border-white/15 rounded-xl flex flex-col items-center justify-center gap-3 text-center px-6">
            <Mail className="w-10 h-10 text-white/15" />
            <p className="text-white/25 text-sm">Your email will appear here, fully editable</p>
          </div>
        )}
        {loading && (
          <div className="h-full min-h-[300px] border border-white/10 rounded-xl flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-white/40 text-sm">Writing your email…</p>
          </div>
        )}
        {email && !loading && (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Your Email</span>
                <button onClick={copyAll} className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg transition-colors">
                  {copied === "all" ? <><Check className="w-3 h-3 text-emerald-400" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy all</>}
                </button>
              </div>
              {/* Email preview card */}
              <div className="bg-white rounded-xl overflow-hidden shadow-xl text-gray-900 text-sm">
                <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 space-y-1">
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 text-xs w-16 shrink-0">Subject:</span>
                    <input className="flex-1 bg-transparent text-gray-900 font-semibold text-sm focus:outline-none" defaultValue={email.subjectLine} />
                    <button onClick={() => copy("subject", email.subjectLine)} className="text-gray-400 hover:text-gray-700"><Copy className="w-3 h-3" /></button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-xs w-16 shrink-0">Preview:</span>
                    <input className="flex-1 bg-transparent text-gray-500 text-xs focus:outline-none" defaultValue={email.previewText} />
                  </div>
                </div>
                <div className="px-5 py-4 space-y-3 max-h-80 overflow-y-auto">
                  <p className="font-medium">{email.greeting}</p>
                  <textarea className="w-full text-gray-700 text-sm leading-relaxed resize-none focus:outline-none bg-transparent" rows={8} defaultValue={email.body} />
                  <div className="my-3">
                    <span className="inline-block bg-emerald-600 text-white text-sm font-bold px-6 py-2.5 rounded-lg cursor-pointer hover:bg-emerald-700 transition-colors">{email.cta}</span>
                  </div>
                  <p className="text-gray-600">{email.signOff}</p>
                  {email.ps && <p className="text-gray-500 text-xs italic">P.S. <textarea className="inline bg-transparent text-xs italic text-gray-500 focus:outline-none resize-none w-full" rows={2} defaultValue={email.ps} /></p>}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function TextGeneratorTool() {
  const [type, setType] = useState("headline");
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const outputRef = useRef<HTMLTextAreaElement>(null);

  const TEXT_TYPES = [
    { id: "headline", label: "Headlines" }, { id: "tagline", label: "Taglines" },
    { id: "product-description", label: "Product Description" }, { id: "ad-copy", label: "Ad Copy" },
    { id: "website-copy", label: "Website Copy" }, { id: "bio", label: "Professional Bio" },
    { id: "pitch", label: "Elevator Pitch" }, { id: "press-release", label: "Press Release" },
  ];
  const TONES = ["professional", "conversational", "persuasive", "witty", "inspirational", "bold"];

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true); setOutput("");
    try {
      await streamText("generate-text", { type, topic, audience, tone, length }, chunk => {
        setOutput(prev => prev + chunk);
      });
    } catch { setOutput("Generation failed. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-white/60 mb-1.5">Content Type</label>
          <div className="grid grid-cols-2 gap-2">
            {TEXT_TYPES.map(t => (
              <button key={t.id} onClick={() => setType(t.id)}
                className={`px-3 py-2 rounded-lg text-xs border text-left transition-all ${type === t.id ? "border-yellow-400 bg-yellow-400/15 text-yellow-300" : "border-white/10 text-white/50 hover:border-white/25"}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Topic / Product / Brand *</label>
          <input className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30" placeholder="e.g. AI-powered project management tool for remote teams" value={topic} onChange={e => setTopic(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Audience</label>
            <input className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none" placeholder="Startup founders" value={audience} onChange={e => setAudience(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Length</label>
            <select className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none" value={length} onChange={e => setLength(e.target.value)}>
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-white/60 mb-1.5">Tone</label>
          <div className="flex flex-wrap gap-2">
            {TONES.map(t => (
              <button key={t} onClick={() => setTone(t)}
                className={`px-3 py-1.5 rounded-full text-xs border capitalize transition-all ${tone === t ? "border-yellow-400 bg-yellow-400/15 text-yellow-300" : "border-white/10 text-white/50 hover:border-white/30"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <Button className="w-full h-12 font-bold text-base rounded-xl text-black bg-yellow-400 hover:bg-yellow-300" onClick={generate} disabled={!topic.trim() || loading}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating…</> : <><Type className="w-4 h-4 mr-2" />Generate Text</>}
        </Button>
      </div>

      <div>
        {!output && !loading && (
          <div className="h-full min-h-[300px] border border-dashed border-white/15 rounded-xl flex flex-col items-center justify-center gap-3 text-center px-6">
            <Type className="w-10 h-10 text-white/15" />
            <p className="text-white/25 text-sm">Your generated copy appears here — fully editable</p>
          </div>
        )}
        {(output || loading) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">{TEXT_TYPES.find(t => t.id === type)?.label}</span>
              <button onClick={() => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg transition-colors">
                {copied ? <><Check className="w-3 h-3 text-yellow-400" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
              </button>
            </div>
            <textarea
              ref={outputRef}
              className="flex-1 min-h-[300px] w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white text-sm leading-relaxed resize-none focus:outline-none focus:border-yellow-400/40"
              value={output}
              onChange={e => setOutput(e.target.value)}
              placeholder={loading ? "Generating…" : ""}
            />
            {loading && <div className="flex items-center gap-2 text-xs text-white/40"><Loader2 className="w-3 h-3 animate-spin" /> Writing…</div>}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ── Main Hub ──────────────────────────────────────────────────
export default function AIToolsHub() {
  const [activeTool, setActiveTool] = useState<ToolId>("anime");
  const active = TOOLS.find(t => t.id === activeTool)!;

  const toolComponent: Record<ToolId, React.ReactNode> = {
    anime:     <AnimeGeneratorTool />,
    image:     <ImageGeneratorTool />,
    email:     <EmailGeneratorTool />,
    logo:      <LogoGeneratorTool />,
    art:       <ArtGeneratorTool />,
    text:      <TextGeneratorTool />,
    bookcover: <BookCoverTool />,
  };

  return (
    <section id="ai-tools" className="py-24 relative overflow-hidden">
      <div className="absolute left-0 bottom-0 w-[600px] h-[600px] bg-violet-600/8 rounded-full blur-[150px] pointer-events-none" />
      <div className="container px-4 mx-auto max-w-7xl">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-sm font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5 mr-2" /> 9 AI Creation Tools
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Every Tool You Need to <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">Create & Grow</span>
          </h2>
          <p className="text-lg text-white/50">Images, emails, copy, logos, book covers — all powered by AI, all completely free.</p>
        </div>

        {/* Tool selector pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {TOOLS.map(tool => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium border transition-all ${activeTool === tool.id ? "text-white border-transparent shadow-lg" : "border-white/10 text-white/60 hover:text-white hover:border-white/25 bg-white/5"}`}
              style={activeTool === tool.id ? { background: tool.color + "30", borderColor: tool.color, color: "white" } : {}}
            >
              <span>{tool.emoji}</span>
              <span>{tool.label}</span>
              {activeTool === tool.id && <ChevronRight className="w-3.5 h-3.5" style={{ color: tool.color }} />}
            </button>
          ))}
        </div>

        {/* Active tool panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTool}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Tool header */}
            <div className="flex items-center gap-4 px-6 py-5 border-b border-white/8" style={{ background: active.color + "12" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: active.color + "25" }}>
                {active.emoji}
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">{active.label}</h3>
                <p className="text-white/50 text-sm">{active.tagline}</p>
              </div>
              <div className="ml-auto hidden sm:flex items-center gap-2 text-xs text-white/30">
                <Zap className="w-3.5 h-3.5" style={{ color: active.color }} />
                <span>Free · No credits</span>
              </div>
            </div>
            {/* Tool content */}
            <div className="p-6">{toolComponent[activeTool]}</div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
