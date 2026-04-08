import { CheckCircle2, Calendar, BarChart2, Share2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SocialMediaSection() {
  const features = [
    {
      title: "AI Assist for Effortless Content",
      desc: "Get AI-powered content for titles, captions, tone, and length of your posts - tailored to each platform as you create content, instantly."
    },
    {
      title: "Smart Scheduling",
      desc: "Schedule posts at optimal times for your audience."
    },
    {
      title: "Growth Analytics",
      desc: "Track your performance across all platforms."
    },
    {
      title: "Intelligent Queue System",
      desc: "Manage multiple platform queues seamlessly."
    }
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="container px-4 mx-auto">
        <div className="flex flex-col-reverse lg:flex-row items-center gap-16">
          
          <div className="lg:w-1/2 w-full">
            <div className="glass-card rounded-2xl border border-white/10 p-6 overflow-hidden relative">
              <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-4">
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">IG</div>
                  <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-bold">FB</div>
                  <div className="w-8 h-8 rounded bg-sky-500 flex items-center justify-center text-white text-xs font-bold">IN</div>
                  <div className="w-8 h-8 rounded bg-black border border-white/20 flex items-center justify-center text-white text-xs font-bold">X</div>
                </div>
                <div className="ml-auto text-sm text-white/50">Schedule Post Queue</div>
              </div>
              
              <div className="bg-black/40 rounded-xl p-4 border border-white/5 mb-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-indigo-600 p-0.5">
                      <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-xs font-bold">GW</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">GravityWrite</div>
                      <div className="text-xs text-white/50">Scheduled for Tomorrow, 10:00 AM</div>
                    </div>
                  </div>
                  <div className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs">Ready</div>
                </div>
                <p className="text-sm text-white/80 mb-3">
                  🚀 Exciting news! We've just added 50 new templates to the AI Image Generator. Stop struggling with prompts and start creating stunning visuals instantly. 🎨✨
                  <br/><br/>
                  #AIArt #ContentCreation #GravityWrite #Marketing
                </p>
                <div className="h-32 rounded-lg bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-white/5 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-white/30" />
                </div>
              </div>
              
              <div className="bg-black/40 rounded-xl p-4 border border-white/5 opacity-50">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10" />
                    <div>
                      <div className="w-24 h-4 bg-white/10 rounded mb-2" />
                      <div className="w-32 h-3 bg-white/10 rounded" />
                    </div>
                  </div>
                </div>
              </div>
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
              Stop scrambling for content ideas. Generate scroll-stopping social media posts and let our intelligent scheduler handle the rest. Our AI creates a month's worth of engaging posts, schedules them across all your platforms when your audience is most active, and grows your following while you sleep.
            </p>
            
            <div className="space-y-6 mb-10">
              {features.map((feature, i) => (
                <div key={i} className="flex gap-4">
                  <div className="mt-1">
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
