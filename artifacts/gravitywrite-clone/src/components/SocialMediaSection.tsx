import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, Copy, Check, Calendar, Share2, Clock, Lightbulb, RefreshCw, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLATFORMS = [
  { id: "Instagram", emoji: "📸", color: "from-purple-500 to-pink-500", desc: "Stories & Reels" },
  { id: "Facebook", emoji: "👥", color: "from-blue-600 to-blue-800", desc: "Community" },
  { id: "LinkedIn", emoji: "💼", color: "from-sky-500 to-blue-700", desc: "Professional" },
  { id: "X (Twitter)", emoji: "🐦", color: "from-gray-700 to-black", desc: "Viral content" },
  { id: "Pinterest", emoji: "📌", color: "from-red-500 to-red-700", desc: "Discovery" },
  { id: "TikTok", emoji: "🎵", color: "from-black to-pink-600", desc: "Short video" },
];

const TONES = ["Engaging", "Professional", "Humorous", "Inspirational", "Educational", "Promotional", "Storytelling"];
const POST_LENGTHS = [
  { id: "short", label: "Short", desc: "Quick & punchy" },
  { id: "medium", label: "Medium", desc: "Balanced" },
  { id: "long", label: "Long", desc: "Detailed" },
];
const HASHTAG_COUNTS = [3, 5, 7, 10, 15, 20];

interface SocialPost {
  platform: string;
  content: string;
  hashtags: string[];
  bestTime?: string;
  tip?: string;
}

export default function SocialMediaSection() {
  const [topic, setTopic] = useState("");
  const [brand, setBrand] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["Instagram", "LinkedIn", "X (Twitter)"]);
  const [tone, setTone] = useState("Engaging");
  const [postLength, setPostLength] = useState("medium");
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [hashtagCount, setHashtagCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [activePostIdx, setActivePostIdx] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  function togglePlatform(id: string) {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  }

  async function handleGenerate() {
    if (!topic.trim() || !selectedPlatforms.length) return;
    setIsGenerating(true);
    setError("");
    setPosts([]);

    try {
      const res = await fetch("/api/ai/generate-social-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, brand, platforms: selectedPlatforms, tone: tone.toLowerCase(), includeEmojis, hashtagCount, postLength }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json() as { posts?: SocialPost[]; error?: string };
      if (data.error) throw new Error(data.error);
      setPosts(data.posts ?? []);
      setActivePostIdx(0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleCopy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function copyAll() {
    const all = posts.map(p => `=== ${p.platform} ===\n${p.content}\n\n${p.hashtags.map(h => `#${h}`).join(" ")}`).join("\n\n---\n\n");
    navigator.clipboard.writeText(all);
    setCopied("all");
    setTimeout(() => setCopied(null), 2000);
  }

  const activePost = posts[activePostIdx];
  const platformInfo = PLATFORMS.find(p => p.id === activePost?.platform);

  return (
    <section id="social-media" className="py-24 relative overflow-hidden">
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="container px-4 mx-auto">
        <div className="flex flex-col lg:flex-row items-start gap-12">

          {/* Left: Generator */}
          <div className="lg:w-5/12 w-full space-y-4">
            <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
              <div className="flex items-center gap-3 p-5 border-b border-white/10">
                <Share2 className="w-5 h-5 text-pink-400" />
                <span className="text-white font-semibold text-sm">Social Media Post Generator</span>
                <button onClick={() => setShowSettings(s => !s)}
                  className="ml-auto text-xs text-white/40 hover:text-white/70 transition-colors">
                  {showSettings ? "Hide settings" : "More settings"}
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">What to post about? *</label>
                  <input className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-pink-500/50 transition-colors text-sm"
                    placeholder="e.g., We just launched our AI content platform — get early access for 50% off"
                    value={topic} onChange={e => setTopic(e.target.value)} />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">Brand / Company</label>
                  <input className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-pink-500/50 transition-colors text-sm"
                    placeholder="e.g., GravityWrite" value={brand} onChange={e => setBrand(e.target.value)} />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/60 mb-2">Platforms ({selectedPlatforms.length} selected)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PLATFORMS.map(p => (
                      <button key={p.id} onClick={() => togglePlatform(p.id)}
                        className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-xs font-medium transition-all ${selectedPlatforms.includes(p.id) ? "border border-pink-500/50 bg-pink-500/15 text-pink-400" : "border border-white/10 bg-white/5 text-white/40 hover:border-white/20 hover:text-white/60"}`}>
                        <span className="text-base">{p.emoji}</span>
                        <span>{p.id === "X (Twitter)" ? "Twitter" : p.id}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/60 mb-2">Tone</label>
                  <div className="flex flex-wrap gap-1.5">
                    {TONES.map(t => (
                      <button key={t} onClick={() => setTone(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tone === t ? "bg-pink-500/20 border border-pink-500/50 text-pink-400" : "bg-white/5 border border-white/10 text-white/40 hover:text-white/70"}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {showSettings && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-white/60 mb-2">Post Length</label>
                      <div className="flex gap-2">
                        {POST_LENGTHS.map(l => (
                          <button key={l.id} onClick={() => setPostLength(l.id)}
                            className={`flex-1 py-2 px-2 rounded-lg text-xs transition-all ${postLength === l.id ? "border border-pink-500/50 bg-pink-500/15 text-pink-400" : "border border-white/10 bg-white/5 text-white/40 hover:text-white/60"}`}>
                            <div className="font-medium">{l.label}</div>
                            <div className="text-white/30">{l.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-white/60">Include Emojis</label>
                      <button onClick={() => setIncludeEmojis(e => !e)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${includeEmojis ? "bg-pink-500" : "bg-white/20"}`}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${includeEmojis ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-white/60 mb-2">Hashtags per Post: {hashtagCount}</label>
                      <div className="flex gap-1.5 flex-wrap">
                        {HASHTAG_COUNTS.map(n => (
                          <button key={n} onClick={() => setHashtagCount(n)}
                            className={`px-2.5 py-1 rounded text-xs ${hashtagCount === n ? "bg-pink-500/20 border border-pink-500/50 text-pink-400" : "bg-white/5 border border-white/10 text-white/40"}`}>
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                <Button className="w-full bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-semibold h-11 text-sm"
                  onClick={handleGenerate} disabled={isGenerating || !topic.trim() || !selectedPlatforms.length}>
                  {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating posts...</> : `Generate ${selectedPlatforms.length} Platform Posts →`}
                </Button>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">{error}</div>
            )}
          </div>

          {/* Right: Posts preview */}
          <div className="lg:w-7/12 w-full">
            <div className="mb-6 lg:mt-0 mt-0">
              <div className="inline-flex items-center px-3 py-1.5 rounded-full border border-pink-500/30 bg-pink-500/10 text-pink-400 text-sm font-medium mb-6">
                AI Social Media Suite
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Dominate Every Platform <span className="text-pink-400">Effortlessly</span>
              </h2>
              <p className="text-base text-muted-foreground mb-6">
                One topic, six platform-native posts. Our AI understands each platform's algorithm, culture, and what drives engagement — so you never post the same generic content everywhere again.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { icon: CheckCircle2, text: "Platform-native copy" },
                  { icon: Hash, text: "Smart hashtag research" },
                  { icon: Clock, text: "Best time to post" },
                  { icon: Lightbulb, text: "Per-platform tips" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-white/60 text-sm">
                    <Icon className="w-4 h-4 text-pink-400 flex-shrink-0" />
                    {text}
                  </div>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {isGenerating && !posts.length && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="glass-card rounded-2xl border border-white/10 p-10 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
                  <p className="text-white/50 text-sm">Writing platform-optimized posts...</p>
                </motion.div>
              )}

              {posts.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  {/* Platform tabs */}
                  <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                    {posts.map((post, i) => {
                      const pInfo = PLATFORMS.find(p => p.id === post.platform);
                      return (
                        <button key={i} onClick={() => setActivePostIdx(i)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${activePostIdx === i ? "bg-pink-500/20 border border-pink-500/50 text-pink-400" : "bg-white/5 border border-white/10 text-white/50 hover:text-white/80"}`}>
                          <span>{pInfo?.emoji ?? "📱"}</span>
                          {post.platform === "X (Twitter)" ? "Twitter" : post.platform}
                        </button>
                      );
                    })}
                    <button onClick={copyAll}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap bg-white/5 border border-white/10 text-white/40 hover:text-white/70 transition-colors ml-auto flex-shrink-0">
                      {copied === "all" ? <><Check className="w-3 h-3" />Copied</> : <><Copy className="w-3 h-3" />Copy All</>}
                    </button>
                  </div>

                  {/* Active post */}
                  {activePost && (
                    <motion.div key={activePostIdx} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                      className="glass-card rounded-2xl border border-white/10 overflow-hidden">
                      {/* Platform header */}
                      <div className={`p-4 bg-gradient-to-r ${platformInfo?.color ?? "from-gray-800 to-gray-900"} flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{platformInfo?.emoji}</span>
                          <div>
                            <div className="text-white font-semibold text-sm">{activePost.platform === "X (Twitter)" ? "X (Twitter)" : activePost.platform}</div>
                            <div className="text-white/60 text-xs">{platformInfo?.desc}</div>
                          </div>
                        </div>
                        <button onClick={() => handleCopy(`${activePost.content}\n\n${activePost.hashtags.map(h => `#${h}`).join(" ")}`, `post-${activePostIdx}`)}
                          className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors">
                          {copied === `post-${activePostIdx}` ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
                        </button>
                      </div>

                      <div className="p-5 space-y-4">
                        {/* Content */}
                        <p className="text-white/85 leading-relaxed text-sm whitespace-pre-wrap">{activePost.content}</p>

                        {/* Hashtags */}
                        <div className="flex flex-wrap gap-1.5">
                          {activePost.hashtags.map(tag => (
                            <span key={tag} className="text-xs text-pink-400/80 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-full">
                              #{tag}
                            </span>
                          ))}
                        </div>

                        {/* Meta info */}
                        {(activePost.bestTime || activePost.tip) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
                            {activePost.bestTime && (
                              <div className="flex items-start gap-2">
                                <Clock className="w-4 h-4 text-pink-400 mt-0.5 flex-shrink-0" />
                                <div>
                                  <div className="text-xs font-medium text-white/50 mb-0.5">Best Time to Post</div>
                                  <div className="text-sm text-white/75">{activePost.bestTime}</div>
                                </div>
                              </div>
                            )}
                            {activePost.tip && (
                              <div className="flex items-start gap-2">
                                <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                                <div>
                                  <div className="text-xs font-medium text-white/50 mb-0.5">Platform Tip</div>
                                  <div className="text-sm text-white/75">{activePost.tip}</div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-1">
                          <Button size="sm" className="bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 border border-pink-500/30 text-xs h-8 rounded-lg">
                            <Calendar className="w-3.5 h-3.5 mr-1.5" /> Schedule
                          </Button>
                          <Button size="sm" variant="outline" className="border-white/10 text-white/40 hover:bg-white/5 text-xs h-8 rounded-lg" onClick={handleGenerate}>
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Regenerate All
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Char count hints */}
                  {activePost && activePost.platform === "X (Twitter)" && activePost.content.length > 280 && (
                    <div className="flex items-center gap-2 text-xs text-yellow-400/70">
                      <span>⚠</span>
                      <span>This post is {activePost.content.length} chars — consider a thread for Twitter/X</span>
                    </div>
                  )}
                </motion.div>
              )}

              {!posts.length && !isGenerating && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="glass-card rounded-2xl border border-white/10 p-10 flex flex-col items-center justify-center gap-4 text-center">
                  <div className="text-4xl">📱</div>
                  <p className="text-white/30 text-sm max-w-xs">Your platform-specific posts will appear here. Each one is crafted for that platform's unique culture and algorithm.</p>
                  <div className="flex gap-2 flex-wrap justify-center">
                    {PLATFORMS.map(p => (
                      <span key={p.id} className="text-xs text-white/20 bg-white/5 px-2 py-1 rounded">{p.emoji} {p.id === "X (Twitter)" ? "Twitter" : p.id}</span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
