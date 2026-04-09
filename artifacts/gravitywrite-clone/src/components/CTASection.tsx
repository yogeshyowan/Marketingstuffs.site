import { Button } from "@/components/ui/button";

export default function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/10 pointer-events-none" />
      <div className="glow-bg bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 scale-x-[2]"></div>
      
      <div className="container px-4 mx-auto text-center relative z-10">
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
          Start Creating Content <br/>That <span className="gradient-text">Actually Works</span>
        </h2>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          Join 150,000+ creators and businesses using GrowBiz
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 text-white rounded-full px-10 h-14 text-lg">
            Start for Free
          </Button>
          <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/20 text-white hover:bg-white/5 rounded-full px-10 h-14 text-lg bg-white/5 backdrop-blur-sm">
            View Pricing
          </Button>
        </div>
      </div>
    </section>
  );
}
