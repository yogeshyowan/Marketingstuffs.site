import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            One subscription. Every AI tool you need.
          </h2>
          <p className="text-lg text-muted-foreground">
            Generate stunning images, produce videos, write blogs, build websites, and schedule social media — all from one platform.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto items-start">
          
          {/* Plus Plan (Highlighted) */}
          <div className="relative glass-card rounded-3xl p-8 border border-primary/50 shadow-[0_0_40px_rgba(124,58,237,0.15)] order-1 lg:order-2 lg:-mt-4 bg-background z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-primary to-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Most Popular
            </div>
            
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Plus</h3>
              <p className="text-sm text-white/60">For creators who mean business</p>
              <div className="mt-4 inline-block bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-semibold">
                Save 84%
              </div>
            </div>
            
            <div className="mb-6 pb-6 border-b border-white/10">
              <div className="flex items-end gap-2 mb-1">
                <span className="text-5xl font-bold text-white">$8</span>
                <span className="text-muted-foreground mb-1">/month</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-white/40 line-through">$49</span>
                <span className="text-white/60">Billed as $97/yr</span>
              </div>
            </div>
            
            <Button className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 text-white rounded-full h-12 mb-8 text-base">
              Get Started
            </Button>
            
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-white/80 font-medium">500 AI Credits/mo</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-white/80 text-sm">AI Blog Generator (~15 blogs/mo)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-white/80 text-sm">Image Generator (~83 images/mo)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-white/80 text-sm">Video Generator (~25 videos/mo)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-white/80 text-sm">AI Audio & Video Summariser (~100/mo)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-white/80 text-sm">Social Media Scheduler (5 accts, 50 posts)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-white/80 text-sm">AI Website Builder, Text Humanizer</span>
              </li>
            </ul>
          </div>

          {/* Pro Plan */}
          <div className="glass-card rounded-3xl p-8 border border-white/10 order-2 lg:order-1">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
              <p className="text-sm text-white/60">For teams & brands scaling content</p>
              <div className="mt-4 inline-block bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-semibold">
                Save 38%
              </div>
            </div>
            
            <div className="mb-6 pb-6 border-b border-white/10">
              <div className="flex items-end gap-2 mb-1">
                <span className="text-5xl font-bold text-white">$49</span>
                <span className="text-muted-foreground mb-1">/month</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-white/40 line-through">$79</span>
                <span className="text-white/60">Billed as $599/yr</span>
              </div>
            </div>
            
            <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/5 rounded-full h-12 mb-8 text-base">
              Get Started
            </Button>
            
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-white/40 shrink-0 mt-0.5" />
                <span className="text-white/80 font-medium">2500 AI Credits/mo</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-white/40 shrink-0 mt-0.5" />
                <span className="text-white/80 text-sm">AI Blog Generator (~70 blogs/mo)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-white/40 shrink-0 mt-0.5" />
                <span className="text-white/80 text-sm">Image Generator (~416 images/mo)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-white/40 shrink-0 mt-0.5" />
                <span className="text-white/80 text-sm">Video Generator (~125 videos/mo)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-white/40 shrink-0 mt-0.5" />
                <span className="text-white/80 text-sm">Social Media Scheduler (30 accts, 250 posts)</span>
              </li>
            </ul>
          </div>

          {/* Bundle Plan */}
          <div className="glass-card rounded-3xl p-8 border border-white/10 order-3">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Bundle</h3>
              <p className="text-sm text-white/60">GrowBiz + n8n + WordPress</p>
              <div className="mt-4 inline-block bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-semibold">
                Save 80%
              </div>
            </div>
            
            <div className="mb-6 pb-6 border-b border-white/10">
              <div className="flex items-end gap-2 mb-1">
                <span className="text-5xl font-bold text-white">$139</span>
                <span className="text-muted-foreground mb-1">/month</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-white/40 line-through">$709</span>
                <span className="text-white/60">Annual plan only</span>
              </div>
            </div>
            
            <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/5 rounded-full h-12 mb-8 text-base">
              Get Started
            </Button>
            
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-white/40 shrink-0 mt-0.5" />
                <span className="text-white/80 text-sm"><strong className="text-white">GrowBiz</strong> (Plus Plan Included)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-white/40 shrink-0 mt-0.5" />
                <span className="text-white/80 text-sm"><strong className="text-white">Wordpress Hosting</strong> (Starter Plan, Free .xyz Domain, Free SSL)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-white/40 shrink-0 mt-0.5" />
                <span className="text-white/80 text-sm"><strong className="text-white">n8n Automation</strong> (Self-Hosted, Unlimited Workflows)</span>
              </li>
            </ul>
          </div>

        </div>

        <p className="text-center text-sm text-white/40 mt-12 max-w-2xl mx-auto">
          * Credits are shared across all features. These numbers are conservative estimates based on using all credits on that feature alone.
        </p>
      </div>
    </section>
  );
}
