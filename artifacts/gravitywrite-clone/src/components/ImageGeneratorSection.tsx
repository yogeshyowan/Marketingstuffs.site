import { ImageIcon, Video, BookOpen, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ImageGeneratorSection() {
  return (
    <section className="py-24 relative overflow-hidden bg-white/[0.01] border-y border-white/5">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center px-3 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-400 text-sm font-medium mb-6">
            AI-Image Generator
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            AI Images That <span className="text-teal-400">Stop the Scroll</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Tired of using boring stock photos or expensive design fees? Describe your vision and watch our AI create stunning, unique visuals that perfectly match your content. From blog headers to social media graphics - professional quality in seconds.
          </p>
          <div className="mt-8">
            <Button size="lg" className="bg-teal-500 hover:bg-teal-400 text-black font-semibold rounded-full px-8">
              Generate Images Now →
            </Button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto glass-card rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
          {/* Mockup Top Bar */}
          <div className="flex border-b border-white/10 p-4 gap-4 bg-black/40">
            <button className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-medium">Image Generation</button>
            <button className="px-4 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 text-sm font-medium transition-colors">Text/Images to Videos</button>
            <button className="px-4 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 text-sm font-medium transition-colors">StoryBook</button>
          </div>
          
          <div className="p-8 flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">What Image would you like to create today?</label>
                <textarea 
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/30 h-32 focus:outline-none focus:border-teal-500/50 resize-none"
                  placeholder="A futuristic city with flying cars at sunset, cyberpunk style, neon lights, 8k resolution..."
                  defaultValue="A futuristic city with flying cars at sunset, cyberpunk style, neon lights, 8k resolution"
                />
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-white/80 mb-2">Image Type</label>
                  <select className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none">
                    <option>Photorealistic</option>
                    <option>Digital Art</option>
                    <option>3D Render</option>
                    <option>Anime</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-white/80 mb-2">Aspect Ratio</label>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 rounded-lg border border-teal-500/50 bg-teal-500/10 text-teal-400 text-sm">16:9</button>
                    <button className="flex-1 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-white/80 text-sm">1:1</button>
                    <button className="flex-1 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-white/80 text-sm">9:16</button>
                  </div>
                </div>
              </div>
              
              <Button className="w-full bg-teal-500 hover:bg-teal-400 text-black font-semibold h-12 text-lg">
                Generate
              </Button>
            </div>
            
            <div className="md:w-5/12 flex flex-col gap-4">
              <img src="/images/ai-art-1.png" alt="Generated Art" className="w-full h-48 object-cover rounded-xl border border-white/10" />
              <div className="flex gap-4">
                <img src="/images/ai-art-2.png" alt="Generated Art" className="w-1/2 h-32 object-cover rounded-xl border border-white/10" />
                <img src="/images/ai-art-3.png" alt="Generated Art" className="w-1/2 h-32 object-cover rounded-xl border border-white/10" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
