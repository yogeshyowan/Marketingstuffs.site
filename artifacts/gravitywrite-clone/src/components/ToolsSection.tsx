import { Button } from "@/components/ui/button";

export default function ToolsSection() {
  const tools = [
    "Blog Workflow", "Blog Tools", "Youtube Tools", "Rewriting Tools", 
    "SEO Tools", "Writing Assistant", "Social Media Tools", "Image Prompt", 
    "E-commerce Tools", "Advertising Tools", "Code Tools", "Marketing Tools", 
    "E-mail Tools", "HR Tools", "Support Tools"
  ];

  return (
    <section className="py-32 relative overflow-hidden flex flex-col items-center">
      <div className="glow-bg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[1.5]"></div>
      
      <div className="container px-4 mx-auto text-center relative z-10">
        <div className="inline-flex items-center px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-6">
          250+ Specialised AI Tools
        </div>
        
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-16 max-w-3xl mx-auto leading-tight">
          Only AI Content Platform That Actually <span className="gradient-text">Grows Your Business</span>
        </h2>
        
        {/* Scrolling text effect */}
        <div className="relative w-full overflow-hidden mb-16 py-4">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
          
          <div className="flex whitespace-nowrap animate-marquee-slow font-bold text-[80px] md:text-[120px] text-white/[0.03] uppercase leading-none tracking-tighter">
            <span>STOP JUGGLING CHATGPT CANVA SCHEDULING TOOLS ANALYTICS SEO TOOLS </span>
            <span>STOP JUGGLING CHATGPT CANVA SCHEDULING TOOLS ANALYTICS SEO TOOLS </span>
          </div>
        </div>

        {/* Tools Chips */}
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {tools.map((tool, i) => (
              <div 
                key={i} 
                className="px-5 py-2.5 rounded-full border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white transition-colors cursor-pointer text-sm font-medium"
              >
                {tool}
              </div>
            ))}
          </div>
          
          <Button size="lg" className="bg-white text-black hover:bg-white/90 rounded-full px-8 h-12 text-base font-semibold">
            Explore our AI Tools →
          </Button>
        </div>
      </div>
    </section>
  );
}
