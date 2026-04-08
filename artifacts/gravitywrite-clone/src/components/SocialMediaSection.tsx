import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, Copy, Check, Calendar, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLATFORMS = [
  { id: "Instagram", label: "Instagram", color: "from-purple-500 to-pink-500" },
  { id: "Facebook", label: "Facebook", color: "from-blue-600 to-blue-700" },
  { id: "LinkedIn", label: "LinkedIn", color: "from-sky-600 to-blue-700" },
  { id: "X (Twitter)", label: "X/Twitter", color: "from-gray-900 to-black border border-white/20" },
  { id: "Pinterest", label: "Pinterest", color: "from-red-600 to-red-700" },
];

const tones = ["Engaging", "Professional", "Humorous", "Inspirational", "Educational", "Promotional"];

interface SocialPost {
  platform: string;
  content: string;
  hashtags: string[];
}

export default function SocialMediaSection() {
  const [topic, setTopic] = useState("");
  const [brand, setBrand] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["Instagram", "LinkedIn"]);
  const [tone, setTone] = useState("Engaging");
  const [isGenerating, setIsGenerating] = useState(false);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [activePost, setActivePost] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState("");

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
        body: JSON.stringify({ topic, brand, platforms: selectedPlatforms, tone: tone.toLowerCase() }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Generation failed");
      }

      const data = await res.json() as { posts: SocialPost[] };
      setPosts(data.posts ?? []);
      setActivePost(0);
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

  const features = [
    { title: "AI Assist for Effortless Content", desc: "Get AI-powered content tailored to each platform's best practices instantly." },
    { title: "Smart Scheduling", desc: "Schedule posts at optimal times for your audience across all platforms." },
    { title: "Growth Analytics", desc: "Track your performance and engagement across all connected platforms." },
    { title: "Intelligent Queue System", desc: "Manage multiple platform queues and never run out of content." },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="container px-4 mx-auto">
        <div className="flex flex-col lg:flex-row items-start gap-16">

          <div className="lg:w-1/2 w-full">
            <div className="glass-card rounded-2xl border border-white/10 p-6 overflow-hidden">
              <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                <Share2 className="w-5 h-5 text-pink-400" />
                <span className="text-white font-semibold">Social Media Post Generator</span>
              </div>

              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">What to post about? *</label>
                  <input
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-pink-500/50 transition-colors text-sm"
                    placeholder="e.g., Launching our new AI blog writing feature this week"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Brand / Company (optional)</label>
                  <input
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-pink-500/50 transition-colors text-sm"
                    placeholder="e.g., GravityWrite"
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Platforms</label>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map(p => (
                      <button
                        key={p.id}
                        onClick={() => togglePlatform(p.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          selectedPlatforms.includes(p.id)
                            ? "bg-pink-500/20 border border-pink-500/50 text-pink-400"
                            : "bg-white/5 border border-white/10 text-white/50 hover:text-white/80"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Tone</label>
                  <div className="flex flex-wrap gap-2">
                    {tones.map(t => (
                      <button
                        key={t}
                        onClick={() => setTone(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          tone === t
                            ? "bg-pink-500/20 border border-pink-500/50 text-pink-400"
                            : "bg-white/5 border border-white/10 text-white/50 hover:text-white/80"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                className="w-full bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-semibold h-11"
                onClick={handleGenerate}
                disabled={isGenerating || !topic.trim() || !selectedPlatforms.length}
              >
                {isGenerating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating posts...</>
                ) : "Generate Social Posts →"}
              </Button>

              {error && (
                <div className="mt-3 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <AnimatePresence>
                {posts.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 space-y-3"
                  >
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {posts.map((post, i) => (
                        <button
                          key={i}
                          onClick={() => setActivePost(i)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                            activePost === i
                              ? "bg-pink-500/20 border border-pink-500/50 text-pink-400"
                              : "bg-white/5 border border-white/10 text-white/50 hover:text-white/80"
                          }`}
                        >
                          {post.platform}
                        </button>
                      ))}
                    </div>

                    {posts[activePost] && (
                      <motion.div
                        key={activePost}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-black/40 rounded-xl p-4 border border-white/5"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-xs text-pink-400 font-medium">{posts[activePost].platform}</span>
                          <button
                            onClick={() => handleCopy(
                              `${posts[activePost].content}\n\n${posts[activePost].hashtags.map(h => `#${h}`).join(" ")}`,
                              `post-${activePost}`
                            )}
                            className="text-white/40 hover:text-white transition-colors"
                          >
                            {copied === `post-${activePost}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-sm text-white/80 leading-relaxed mb-3">{posts[activePost].content}</p>
                        <div className="flex flex-wrap gap-1">
                          {posts[activePost].hashtags.map(tag => (
                            <span key={tag} className="text-xs text-pink-400/70 bg-pink-500/10 px-2 py-0.5 rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <div className="flex items-center gap-1 text-xs text-white/30">
                            <Calendar className="w-3 h-3" />
                            <span>Schedule post</span>
                          </div>
                          <Button size="sm" variant="outline" className="ml-auto border-pink-500/30 text-pink-400 hover:bg-pink-500/10 text-xs h-7">
                            Schedule
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {isGenerating && !posts.length && (
                <div className="mt-4 bg-black/40 rounded-xl p-8 border border-white/5 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-pink-400 animate-spin" />
                </div>
              )}
            </div>
          </div>

          <div className="lg:w-1/2">
            <div className="inline-flex items-center px-3 py-1.5 rounded-full border border-pink-500/30 bg-pink-500/10 text-pink-400 text-sm font-medium mb-6">
              AI-Social Media Post
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              AI Social Media That <span className="text-pink-400">Runs Itself</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Stop scrambling for content ideas. Generate scroll-stopping social media posts tailored to each platform. Our AI creates a month's worth of engaging content while you focus on growing your business.
            </p>

            <div className="space-y-5 mb-10">
              {features.map((feature, i) => (
                <div key={i} className="flex gap-4">
                  <div className="mt-1 flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-pink-500" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">{feature.title}</h4>
                    <p className="text-sm text-white/60">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button size="lg" className="bg-pink-600 hover:bg-pink-500 text-white rounded-full px-8">
              Automate My Social Media →
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
