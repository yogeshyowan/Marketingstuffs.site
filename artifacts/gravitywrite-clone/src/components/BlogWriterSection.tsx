import { motion } from "framer-motion";
import { CheckCircle2, PenTool, Search, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BlogWriterSection() {
  const features = [
    "Create Outline Using Realtime Info",
    "Create Outline Using AI",
    "Get Outline from URL",
    "Choose preferred output language",
    "Edit outline options"
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          <div className="lg:w-1/2">
            <div className="inline-flex items-center px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-6">
              AI-Blog Writer
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              AI Blog Writer That <span className="gradient-text">Beats Your Competition</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Our AI doesn't just write - it strategically crafts blog posts that search engines love and readers actually finish. Input your topic - get a well-structured SEO optimized article with click-worthy headlines, captivating intros that drive organic traffic. While others research for hours, you publish and rank.
            </p>
            
            <ul className="space-y-4 mb-10">
              {features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-white/80">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            
            <Button size="lg" className="bg-white text-black hover:bg-white/90 rounded-full px-8">
              Create Your First Blog →
            </Button>
          </div>
          
          <div className="lg:w-1/2 w-full">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-2xl blur opacity-30"></div>
              <div className="relative rounded-xl border border-white/10 overflow-hidden bg-background">
                <img 
                  src="/images/blog-interface.png" 
                  alt="AI Blog Writer Interface" 
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
          
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <div className="glass-card p-8 rounded-2xl">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-6">
              <PenTool className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Intelligent Headlines</h3>
            <p className="text-muted-foreground">
              Stop guessing what works. Our AI analyzes trending topics and creates headlines that demand clicks and drive traffic.
            </p>
          </div>
          
          <div className="glass-card p-8 rounded-2xl">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-6">
              <Search className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Search Engine Mastery</h3>
            <p className="text-muted-foreground">
              Built-in SEO intelligence means your content doesn't just get written - it gets found by the right people.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-6">
              <LayoutTemplate className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Professional Structure</h3>
            <p className="text-muted-foreground">
              From compelling intros to persuasive conclusions, every article follows proven frameworks that keep readers engaged.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
