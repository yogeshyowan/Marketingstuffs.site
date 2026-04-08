import { Button } from "@/components/ui/button";
import { Star, PlayCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section className="relative pt-24 pb-32 overflow-hidden flex flex-col items-center justify-center min-h-[90vh]">
      {/* Background Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="container px-4 mx-auto text-center z-10 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-8"
        >
          <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-medium text-white/80">250+ Specialised AI Tools</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight text-white max-w-4xl mx-auto leading-tight mb-6"
        >
          The Only AI Content Platform That Actually <span className="gradient-text">Grows Your Business</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Stop juggling ChatGPT, Canva, scheduling tools, and analytics platforms just to create one piece of content. GravityWrite eliminates the chaos with 250+ specialized AI tools.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 text-white border-0 text-lg px-8 h-14 rounded-full">
            Start for Free →
          </Button>
          <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/20 text-white hover:bg-white/5 text-lg px-8 h-14 rounded-full bg-transparent backdrop-blur-sm">
            <PlayCircle className="w-5 h-5 mr-2" />
            Watch Demo
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-8 md:gap-16 text-sm font-medium text-muted-foreground"
        >
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-white mb-1">1M+</span>
            <span>Content Created</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-white mb-1">150K+</span>
            <span>Happy Users</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-2xl font-bold text-white">4.8/5</span>
              <div className="flex text-yellow-500">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
              </div>
            </div>
            <span>Rating</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-20 relative max-w-5xl mx-auto"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 h-full w-full pointer-events-none" />
          <div className="rounded-2xl border border-white/10 p-2 bg-white/5 backdrop-blur-sm shadow-[0_0_50px_rgba(124,58,237,0.2)]">
            <img 
              src="/images/hero-dashboard.png" 
              alt="GravityWrite Dashboard Mockup" 
              className="w-full h-auto rounded-xl object-cover"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
