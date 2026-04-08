import { Button } from "@/components/ui/button";
import { Star, ArrowRight, Zap, Globe, Share2, PenTool } from "lucide-react";
import { motion } from "framer-motion";

const TOOLS = [
  { icon: PenTool, label: "Blog Writer", color: "text-violet-400", bg: "bg-violet-400/10" },
  { icon: Globe, label: "Website Builder", color: "text-cyan-400", bg: "bg-cyan-400/10" },
  { icon: Share2, label: "Social Media", color: "text-pink-400", bg: "bg-pink-400/10" },
  { icon: Zap, label: "AI Images", color: "text-emerald-400", bg: "bg-emerald-400/10" },
];

export default function HeroSection() {
  function scrollTo(id: string) {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section className="relative pt-20 pb-28 overflow-hidden flex flex-col items-center justify-center min-h-[90vh]">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-primary/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-500/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="container px-4 mx-auto text-center z-10 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-sm mb-8">
          <Zap className="w-4 h-4 text-emerald-400" fill="currentColor" />
          <span className="text-sm font-semibold text-emerald-400">100% Free AI Tools — No Card Required</span>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight text-white max-w-4xl mx-auto leading-tight mb-6">
          Grow Your Business With <span className="gradient-text">AI That Works</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
          Write blogs, build websites, and dominate social media — all guided by AI, all completely free.
          GrowBiz turns your ideas into professional content in minutes, not hours.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Button size="lg" onClick={() => scrollTo("#blog-writer")}
            className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-primary hover:from-emerald-400 hover:to-primary/90 text-white border-0 text-lg px-8 h-14 rounded-2xl font-semibold shadow-[0_0_30px_rgba(52,211,153,0.3)]">
            Start Creating Free <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => scrollTo("#website-developer")}
            className="w-full sm:w-auto border-white/15 text-white hover:bg-white/5 text-lg px-8 h-14 rounded-2xl bg-transparent backdrop-blur-sm">
            Build a Website →
          </Button>
        </motion.div>

        {/* Tool chips */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }}
          className="flex flex-wrap items-center justify-center gap-3 mb-16">
          {TOOLS.map(({ icon: Icon, label, color, bg }) => (
            <div key={label} className={`flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 ${bg} backdrop-blur-sm`}>
              <Icon className={`w-4 h-4 ${color}`} />
              <span className={`text-sm font-medium ${color}`}>{label}</span>
            </div>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-8 md:gap-16 text-sm font-medium text-white/40">
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-white mb-1">3</span>
            <span>Powerful AI Tools</span>
          </div>
          <div className="w-px h-10 bg-white/10 hidden md:block" />
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-white mb-1">6+</span>
            <span>Social Platforms</span>
          </div>
          <div className="w-px h-10 bg-white/10 hidden md:block" />
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-3xl font-bold text-white">Free</span>
              <div className="flex text-emerald-400 ml-1">
                {Array(5).fill(0).map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
            </div>
            <span>Always free AI</span>
          </div>
        </motion.div>

        {/* Dashboard mockup */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-20 relative max-w-5xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 h-full w-full pointer-events-none" />
          <div className="rounded-2xl border border-white/10 p-2 bg-white/[0.03] backdrop-blur-sm shadow-[0_0_80px_rgba(124,58,237,0.15)]">
            {/* Fake dashboard UI */}
            <div className="rounded-xl bg-[#0d0d20] p-6 min-h-64 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5" />
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  </div>
                  <div className="flex-1 bg-white/5 rounded-lg h-7 max-w-sm" />
                </div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {TOOLS.slice(0,3).map(({ icon: Icon, label, color, bg }) => (
                    <div key={label} className="glass-card rounded-xl p-4 border border-white/5">
                      <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                        <Icon className={`w-4 h-4 ${color}`} />
                      </div>
                      <div className="text-sm font-medium text-white/80 mb-1">{label}</div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r ${color.replace('text','from')}-500 to-transparent`} style={{ width: "70%" }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {["Generating SEO-optimized blog post...", "Building responsive website...", "Creating platform-specific social posts..."].map((t, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-sm text-white/50">{t}</span>
                      <div className="ml-auto text-xs text-emerald-400 font-medium">Free AI ✓</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
