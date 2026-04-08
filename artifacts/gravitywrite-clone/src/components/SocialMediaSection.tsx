import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Copy, Check, Calendar, Share2, Clock, Lightbulb, RefreshCw, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Content types ─────────────────────────────────────────
const CONTENT_TYPES = [
  { id: "blog", emoji: "📝", label: "Blog Post", desc: "Share your latest article" },
  { id: "announcement", emoji: "📢", label: "Announcement", desc: "Big news or updates" },
  { id: "discount", emoji: "🎁", label: "Sale / Discount", desc: "Promotions & offers" },
  { id: "product", emoji: "✨", label: "Product Launch", desc: "New product reveal" },
  { id: "event", emoji: "🎉", label: "Event", desc: "Upcoming event invite" },
  { id: "testimonial", emoji: "⭐", label: "Success Story", desc: "Customer testimonial" },
  { id: "tip", emoji: "💡", label: "Tip / How-To", desc: "Educational content" },
  { id: "behind", emoji: "📸", label: "Behind the Scenes", desc: "Show your process" },
];

const PLATFORMS = [
  { id: "Instagram", emoji: "📸", label: "Instagram", hint: "Visual storytelling, reels & stories", char: "No limit" },
  { id: "Facebook", emoji: "👥", label: "Facebook", hint: "Community & shares", char: "63k" },
  { id: "LinkedIn", emoji: "💼", label: "LinkedIn", hint: "Professional insights", char: "3k" },
  { id: "X (Twitter)", emoji: "🐦", label: "Twitter / X", hint: "Punchy & viral", char: "280" },
  { id: "Pinterest", emoji: "📌", label: "Pinterest", hint: "Discover & inspire", char: "500" },
  { id: "TikTok", emoji: "🎵", label: "TikTok", hint: "Trending & authentic", char: "150" },
];

const TONES = [
  { id: "engaging", emoji: "🔥", label: "Engaging" },
  { id: "professional", emoji: "👔", label: "Professional" },
  { id: "humorous", emoji: "😄", label: "Humorous" },
  { id: "inspirational", emoji: "✨", label: "Inspirational" },
  { id: "educational", emoji: "🎓", label: "Educational" },
  { id: "urgent", emoji: "⚡", label: "Urgent / FOMO" },
];

// Dynamic input fields per content type
const CONTENT_FIELDS: Record<string, Array<{ key: string; label: string; placeholder: string; multiline?: boolean }>> = {
  blog: [
    { key: "title", label: "Blog post title", placeholder: "e.g., 10 Ways AI Will Change Marketing in 2025" },
    { key: "summary", label: "What's the blog about? (2-3 sentences)", placeholder: "e.g., The blog explores how AI tools are helping marketers save 10+ hours a week on content creation...", multiline: true },
    { key: "link", label: "Blog URL (optional)", placeholder: "https://yourblog.com/post-url" },
  ],
  announcement: [
    { key: "headline", label: "What are you announcing?", placeholder: "e.g., We just hit 10,000 customers! 🎉" },
    { key: "details", label: "Key details", placeholder: "e.g., Started in 2023, grew to 10k users in 18 months, now launching in 5 new countries", multiline: true },
  ],
  discount: [
    { key: "offer", label: "What's the offer?", placeholder: "e.g., 40% off all plans this Black Friday" },
    { key: "code", label: "Promo code (optional)", placeholder: "e.g., BLACKFRIDAY40" },
    { key: "expiry", label: "Offer expires", placeholder: "e.g., November 29th, midnight EST" },
    { key: "details", label: "Extra details (optional)", placeholder: "e.g., Limited to first 100 customers, includes free onboarding call" },
  ],
  product: [
    { key: "product", label: "Product name", placeholder: "e.g., GrowBiz Pro 2.0" },
    { key: "feature", label: "What's the biggest feature or benefit?", placeholder: "e.g., Generates complete websites in 60 seconds with just a description", multiline: true },
    { key: "availability", label: "When / where is it available?", placeholder: "e.g., Available now at growbiz.ai/pro" },
  ],
  event: [
    { key: "event", label: "Event name", placeholder: "e.g., AI Marketing Masterclass" },
    { key: "date", label: "Date & time", placeholder: "e.g., Tuesday March 15, 2 PM EST" },
    { key: "details", label: "What will people get from attending?", placeholder: "e.g., Learn how to 10x your content output using free AI tools, live Q&A with experts", multiline: true },
  ],
  testimonial: [
    { key: "customer", label: "Customer name / company", placeholder: "e.g., Sarah K., Marketing Director at TechCorp" },
    { key: "result", label: "What result did they get?", placeholder: "e.g., Grew blog traffic by 340% in 3 months using GrowBiz", multiline: true },
    { key: "quote", label: "Their quote (optional)", placeholder: `e.g., "GrowBiz literally changed how we create content — we publish 5x more now"` },
  ],
  tip: [
    { key: "tip", label: "The tip or lesson", placeholder: "e.g., Always write your blog headline before the content — it keeps you focused and on-topic", multiline: true },
    { key: "context", label: "Why does this matter?", placeholder: "e.g., 80% of readers decide whether to click based on the headline alone" },
  ],
  behind: [
    { key: "scene", label: "What are you showing?", placeholder: "e.g., Our team brainstorming new AI features at our monthly offsite" },
    { key: "story", label: "What's the story?", placeholder: "e.g., We spent 3 days testing 50 different AI models to find the best free ones for our users", multiline: true },
  ],
};

interface SocialPost {
  platform: string;
  content: string;
  hashtags: string[];
  bestTime?: string;
  tip?: string;
}

const STEPS = ["Content Type", "What to Post", "Platforms & Tone", "Your Posts"];

export default function SocialMediaSection() {
  const [step, setStep] = useState(0);
  const [contentType, setContentType] = useState("announcement");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [brand, setBrand] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["Instagram", "LinkedIn", "X (Twitter)"]);
  const [tone, setTone] = useState("engaging");
  const [includeEmojis, setIncludeEmojis] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [activePlatform, setActivePlatform] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState("");

  function setField(key: string, val: string) {
    setFields(prev => ({ ...prev, [key]: val }));
  }

  function togglePlatform(id: string) {
    setSelectedPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  }

  function buildTopic(): string {
    const type = CONTENT_TYPES.find(t => t.id === contentType)!;
    const fieldDefs = CONTENT_FIELDS[contentType] ?? [];
    const parts: string[] = [`Content type: ${type.label}`];
    if (brand) parts.push(`Brand: ${brand}`);
    fieldDefs.forEach(f => {
      if (fields[f.key]) parts.push(`${f.label}: ${fields[f.key]}`);
    });
    return parts.join("\n");
  }

  async function handleGenerate() {
    if (!selectedPlatforms.length) return;
    setIsGenerating(true);
    setError("");
    setPosts([]);

    const topic = buildTopic();
    const selectedTone = TONES.find(t => t.id === tone)?.label ?? tone;

    try {
      const res = await fetch("/api/ai/generate-social-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          brand,
          platforms: selectedPlatforms,
          tone: selectedTone.toLowerCase(),
          includeEmojis,
          hashtagCount: 5,
          postLength: "medium",
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json() as { posts?: SocialPost[]; error?: string };
      if (data.error) throw new Error(data.error);
      setPosts(data.posts ?? []);
      setActivePlatform(0);
      setStep(3);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Generation failed. Please try again.");
    } finally { setIsGenerating(false); }
  }

  function handleCopy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const activePost = posts[activePlatform];
  const activePlatformInfo = PLATFORMS.find(p => p.id === activePost?.platform);
  const selectedType = CONTENT_TYPES.find(t => t.id === contentType);
  const fieldDefs = CONTENT_FIELDS[contentType] ?? [];
  const hasContent = fieldDefs.some(f => fields[f.key]?.trim());

  return (
    <section id="social-media" className="py-24 relative overflow-hidden">
      <div className="absolute right-0 top-1/3 w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="container px-4 mx-auto max-w-3xl">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-3 py-1.5 rounded-full border border-pink-500/30 bg-pink-500/10 text-pink-400 text-sm font-medium mb-4">
            <Share2 className="w-4 h-4 mr-2" /> Social Media AI
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Post to Every Platform <span className="text-pink-400">In One Click</span>
          </h2>
          <p className="text-white/50 text-lg">Tell us what happened — we write platform-perfect posts for Instagram, LinkedIn, Twitter, and more</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-3">
            {STEPS.map((s, i) => (
              <button key={s} onClick={() => i < step && setStep(i)}
                className={`flex flex-col items-center gap-1 ${i < step ? "cursor-pointer" : "cursor-default"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < step ? "bg-pink-500 text-white" : i === step ? "bg-pink-500/30 border-2 border-pink-500 text-pink-400" : "bg-white/5 border border-white/10 text-white/30"}`}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span className={`text-xs hidden sm:block ${i === step ? "text-pink-400 font-medium" : "text-white/30"}`}>{s}</span>
              </button>
            ))}
          </div>
          <div className="h-1.5 bg-white/10 rounded-full">
            <div className="h-full bg-gradient-to-r from-pink-500 to-rose-600 rounded-full transition-all duration-500"
              style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
          </div>
        </div>

        <div className="glass-card rounded-2xl border border-white/10 p-6 md:p-8 min-h-80">
          <AnimatePresence mode="wait">

            {/* Step 0: Content type */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-xl font-bold text-white mb-2">What are you posting about? 📣</h3>
                <p className="text-white/50 text-sm mb-5">Pick the type of content — we'll ask the right questions next</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {CONTENT_TYPES.map(t => (
                    <button key={t.id} onClick={() => { setContentType(t.id); setFields({}); }}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${contentType === t.id ? "border-pink-500/60 bg-pink-500/15 shadow-[0_0_20px_rgba(236,72,153,0.2)]" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                      <span className="text-3xl">{t.emoji}</span>
                      <span className={`text-xs font-semibold text-center ${contentType === t.id ? "text-pink-300" : "text-white/70"}`}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 1: Content details */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-4xl">{selectedType?.emoji}</span>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedType?.label} details 📋</h3>
                    <p className="text-white/50 text-sm">Fill in the details — the more info, the better the posts!</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">Your brand / business name <span className="text-white/30">(optional)</span></label>
                    <input className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-pink-500/50 text-sm"
                      placeholder="e.g., GrowBiz" value={brand} onChange={e => setBrand(e.target.value)} />
                  </div>
                  {fieldDefs.map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-medium text-white/50 mb-1.5">{f.label}</label>
                      {f.multiline ? (
                        <textarea className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-pink-500/50 h-24 resize-none text-sm"
                          placeholder={f.placeholder} value={fields[f.key] ?? ""} onChange={e => setField(f.key, e.target.value)} />
                      ) : (
                        <input className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-pink-500/50 text-sm"
                          placeholder={f.placeholder} value={fields[f.key] ?? ""} onChange={e => setField(f.key, e.target.value)} />
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Platforms & tone */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-xl font-bold text-white mb-2">Choose your platforms & tone 🎯</h3>
                <p className="text-white/50 text-sm mb-5">We'll write a different, optimized post for each platform you pick</p>

                <div className="mb-6">
                  <label className="block text-xs font-medium text-white/50 mb-3">Platforms <span className="text-pink-400">({selectedPlatforms.length} selected)</span></label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PLATFORMS.map(p => (
                      <button key={p.id} onClick={() => togglePlatform(p.id)}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${selectedPlatforms.includes(p.id) ? "border-pink-500/60 bg-pink-500/15" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                        <span className="text-2xl">{p.emoji}</span>
                        <div>
                          <div className={`text-sm font-semibold ${selectedPlatforms.includes(p.id) ? "text-pink-300" : "text-white/70"}`}>{p.label}</div>
                          <div className="text-xs text-white/35">{p.hint}</div>
                        </div>
                        {selectedPlatforms.includes(p.id) && <div className="ml-auto text-pink-400">✓</div>}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-5">
                  <label className="block text-xs font-medium text-white/50 mb-3">Tone of voice</label>
                  <div className="flex flex-wrap gap-2">
                    {TONES.map(t => (
                      <button key={t.id} onClick={() => setTone(t.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${tone === t.id ? "border-pink-500/60 bg-pink-500/15 text-pink-300" : "border-white/10 bg-white/5 text-white/50 hover:text-white/80"}`}>
                        <span>{t.emoji}</span> {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                  <div>
                    <div className="text-sm font-medium text-white/70">Include emojis</div>
                    <div className="text-xs text-white/40">Emojis boost engagement by up to 48%</div>
                  </div>
                  <button onClick={() => setIncludeEmojis(e => !e)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${includeEmojis ? "bg-pink-500" : "bg-white/20"}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${includeEmojis ? "translate-x-7" : "translate-x-1"}`} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Results */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <Loader2 className="w-10 h-10 text-pink-400 animate-spin" />
                    <p className="text-white/50 text-sm">Writing platform-perfect posts...</p>
                    <p className="text-white/30 text-xs">Using free AI — no credits charged</p>
                  </div>
                ) : posts.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white">Your {posts.length} posts are ready! 🎉</h3>
                      <button onClick={() => {
                        const all = posts.map(p => `=== ${p.platform} ===\n${p.content}\n\n${p.hashtags.map(h => `#${h}`).join(" ")}`).join("\n\n---\n\n");
                        handleCopy(all, "all");
                      }} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors">
                        {copied === "all" ? <><Check className="w-3.5 h-3.5 text-emerald-400" />Copied all</> : <><Copy className="w-3.5 h-3.5" />Copy all</>}
                      </button>
                    </div>

                    {/* Platform tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {posts.map((p, i) => {
                        const info = PLATFORMS.find(pl => pl.id === p.platform);
                        return (
                          <button key={i} onClick={() => setActivePlatform(i)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all ${activePlatform === i ? "bg-pink-500/20 border border-pink-500/50 text-pink-400" : "bg-white/5 border border-white/10 text-white/50 hover:text-white/80"}`}>
                            <span>{info?.emoji}</span> {p.platform === "X (Twitter)" ? "Twitter" : p.platform}
                          </button>
                        );
                      })}
                    </div>

                    {/* Active post card */}
                    {activePost && (
                      <motion.div key={activePlatform} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="rounded-2xl border border-white/10 overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3 bg-white/5 border-b border-white/10">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{activePlatformInfo?.emoji}</span>
                            <span className="font-semibold text-white text-sm">{activePost.platform === "X (Twitter)" ? "Twitter / X" : activePost.platform}</span>
                            {activePost.platform === "X (Twitter)" && activePost.content.length > 280 && (
                              <span className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-full">Thread recommended</span>
                            )}
                          </div>
                          <button onClick={() => handleCopy(`${activePost.content}\n\n${activePost.hashtags.map(h => `#${h}`).join(" ")}`, `p-${activePlatform}`)}
                            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors">
                            {copied === `p-${activePlatform}` ? <><Check className="w-3.5 h-3.5 text-emerald-400" />Copied</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
                          </button>
                        </div>
                        <div className="p-5 space-y-4">
                          <p className="text-white/85 leading-relaxed text-sm whitespace-pre-wrap">{activePost.content}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {activePost.hashtags.map(tag => (
                              <span key={tag} className="text-xs text-pink-400/80 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-full">#{tag}</span>
                            ))}
                          </div>
                          {(activePost.bestTime || activePost.tip) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-white/5">
                              {activePost.bestTime && (
                                <div className="flex items-start gap-2">
                                  <Clock className="w-4 h-4 text-pink-400 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <div className="text-xs font-medium text-white/40 mb-0.5">Best time to post</div>
                                    <div className="text-sm text-white/70">{activePost.bestTime}</div>
                                  </div>
                                </div>
                              )}
                              {activePost.tip && (
                                <div className="flex items-start gap-2">
                                  <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <div className="text-xs font-medium text-white/40 mb-0.5">Platform tip</div>
                                    <div className="text-sm text-white/70">{activePost.tip}</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          <div className="flex gap-2 pt-1">
                            <Button size="sm" className="bg-pink-500/15 text-pink-400 hover:bg-pink-500/25 border border-pink-500/30 text-xs h-8 rounded-lg">
                              <Calendar className="w-3.5 h-3.5 mr-1.5" /> Schedule Post
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => { setStep(2); setPosts([]); }}
                              className="border-white/10 text-white/40 hover:bg-white/5 text-xs h-8 rounded-lg">
                              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Regenerate
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="text-5xl">📱</div>
                    <p className="text-white/40 text-sm text-center">Your posts will appear here after generation</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && <div className="mt-4 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">{error}</div>}

        {/* Summary chips */}
        {step > 0 && step < 3 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1 text-white/50">{selectedType?.emoji} {selectedType?.label}</span>
            {brand && <span className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1 text-white/50">🏢 {brand}</span>}
            {step > 1 && selectedPlatforms.length > 0 && (
              <span className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1 text-white/50">📱 {selectedPlatforms.length} platforms</span>
            )}
          </div>
        )}

        {/* Navigation */}
        {step < 3 && (
          <div className="flex items-center gap-3 mt-6">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(s => s - 1)}
                className="border-white/10 text-white/50 hover:bg-white/5 rounded-xl h-12 px-5">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}
            {step < 2 ? (
              <Button onClick={() => setStep(s => s + 1)}
                className="flex-1 bg-pink-600 hover:bg-pink-500 text-white rounded-xl h-12 font-semibold">
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleGenerate} disabled={isGenerating || !selectedPlatforms.length}
                className="flex-1 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white rounded-xl h-12 font-bold shadow-[0_0_30px_rgba(236,72,153,0.3)]">
                {isGenerating ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Writing posts...</> : <><Sparkles className="w-5 h-5 mr-2" />Generate {selectedPlatforms.length} Posts</>}
              </Button>
            )}
          </div>
        )}
        {step === 3 && !isGenerating && (
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={() => setStep(0)}
              className="border-white/10 text-white/50 hover:bg-white/5 rounded-xl h-11">
              New Post
            </Button>
            <Button onClick={() => setStep(2)} className="flex-1 bg-pink-600 hover:bg-pink-500 text-white rounded-xl h-11">
              <RefreshCw className="w-4 h-4 mr-2" /> Tweak & Regenerate
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
