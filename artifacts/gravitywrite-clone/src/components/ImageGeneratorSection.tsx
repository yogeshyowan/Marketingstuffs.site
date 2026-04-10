import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, Video, BookOpen, Settings2, Loader2, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const styles = [
  "Photorealistic", "Digital Art", "3D Render", "Anime", "Oil Painting",
  "Watercolor", "Minimalist", "Cinematic", "Cyberpunk", "Fantasy"
];

const tabs = [
  { id: "generate", label: "Image Generation", icon: ImageIcon },
  { id: "video", label: "Text/Images to Videos", icon: Video },
  { id: "storybook", label: "StoryBook", icon: BookOpen },
  { id: "smart", label: "Smart Controls", icon: Settings2 },
];

type AspectRatio = "1:1" | "16:9" | "9:16";

export default function ImageGeneratorSection() {
  const [activeTab, setActiveTab] = useState("generate");
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Photorealistic");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError("");
    setGeneratedImage(null);

    try {
      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style, aspectRatio }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Generation failed");
      }

      const data = await res.json() as { b64_json: string };
      setGeneratedImage(`data:image/png;base64,${data.b64_json}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleDownload() {
    if (!generatedImage) return;
    const a = document.createElement("a");
    a.href = generatedImage;
    a.download = `marketingstuffs-${Date.now()}.png`;
    a.click();
  }

  const aspectClasses: Record<AspectRatio, string> = {
    "1:1": "aspect-square",
    "16:9": "aspect-video",
    "9:16": "aspect-[9/16] max-h-96",
  };

  return (
    <section className="py-24 relative overflow-hidden bg-white/[0.01] border-y border-white/5">
      <div className="absolute right-0 top-1/3 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center px-3 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-400 text-sm font-medium mb-6">
            AI-Image Generator
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            AI Images That <span className="text-teal-400">Stop the Scroll</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Describe your vision and watch our AI create stunning, unique visuals that perfectly match your content. Professional quality in seconds.
          </p>
          <div className="mt-8">
            <Button size="lg" className="bg-teal-500 hover:bg-teal-400 text-black font-semibold rounded-full px-8">
              Generate Images Now →
            </Button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto glass-card rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="flex border-b border-white/10 p-2 gap-1 bg-black/40 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6 flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">What image would you like to create?</label>
                <textarea
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/30 h-28 focus:outline-none focus:border-teal-500/50 resize-none transition-colors"
                  placeholder="A futuristic city skyline at sunset with flying cars, neon lights reflecting on rain-soaked streets, cyberpunk aesthetic..."
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-white/80 mb-2">Style</label>
                  <select
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-teal-500/50 transition-colors"
                    value={style}
                    onChange={e => setStyle(e.target.value)}
                  >
                    {styles.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-white/80 mb-2">Aspect Ratio</label>
                  <div className="flex gap-2">
                    {(["1:1", "16:9", "9:16"] as AspectRatio[]).map(r => (
                      <button
                        key={r}
                        onClick={() => setAspectRatio(r)}
                        className={`flex-1 py-3 rounded-lg text-sm transition-colors ${
                          aspectRatio === r
                            ? "border border-teal-500/50 bg-teal-500/10 text-teal-400"
                            : "border border-white/10 hover:bg-white/5 text-white/80"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                className="w-full bg-teal-500 hover:bg-teal-400 text-black font-semibold h-12 text-base rounded-xl"
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
              >
                {isGenerating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating image...</>
                ) : "Generate Image →"}
              </Button>

              {error && (
                <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>

            <div className="md:w-5/12">
              <div className="relative">
                <AnimatePresence mode="wait">
                  {isGenerating ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`${aspectClasses[aspectRatio]} w-full rounded-xl border border-white/10 bg-black/40 flex flex-col items-center justify-center gap-3`}
                    >
                      <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
                      <p className="text-white/50 text-sm">Creating your image...</p>
                    </motion.div>
                  ) : generatedImage ? (
                    <motion.div
                      key="image"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group"
                    >
                      <img
                        src={generatedImage}
                        alt="AI Generated"
                        className={`w-full ${aspectClasses[aspectRatio]} object-cover rounded-xl border border-white/10 shadow-2xl`}
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
                        <Button
                          size="sm"
                          onClick={handleDownload}
                          className="bg-white text-black hover:bg-white/90"
                        >
                          <Download className="w-4 h-4 mr-1" /> Download
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleGenerate}
                          className="border-white/30 text-white hover:bg-white/10"
                        >
                          <RefreshCw className="w-4 h-4 mr-1" /> Regenerate
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="aspect-square w-full rounded-xl border border-dashed border-white/20 bg-white/[0.02] flex flex-col items-center justify-center gap-3"
                    >
                      <ImageIcon className="w-10 h-10 text-white/20" />
                      <p className="text-white/30 text-sm text-center px-4">Your generated image will appear here</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
