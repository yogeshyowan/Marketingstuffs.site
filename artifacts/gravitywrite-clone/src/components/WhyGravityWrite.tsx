import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function WhyGravityWrite() {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      id: 0,
      title: "Advanced AI Writing Engine",
      desc: "Our specialized AI understands ROI, not just writing - it creates content that's factually accurate, SEO-optimized, and designed to outperform your competition.",
      img: "/images/why-1.png"
    },
    {
      id: 1,
      title: "Complete Workflow Solution",
      desc: "From market research to content creation, editing, optimization, and publishing - manage your entire content workflow in one place.",
      img: "/images/why-2.png"
    },
    {
      id: 2,
      title: "Multiple AI Models",
      desc: "Access ChatGPT-4, Claude, and other premium AI models through one interface - all optimized specifically for content creation.",
      img: "/images/why-3.png"
    },
    {
      id: 3,
      title: "Brand Voice Mastery",
      desc: "Train our AI on your best content once, and it will perfectly match your brand voice in every piece it creates forever.",
      img: "/images/why-4.png"
    },
    {
      id: 4,
      title: "Seamless Integrations",
      desc: "Unlike basic AI tools, GrowBiz integrates with Ahrefs, Google Analytics, WordPress to make data-driven content decisions.",
      img: "/images/why-5.png"
    },
    {
      id: 5,
      title: "Intelligent Data Analysis",
      desc: "Upload any document or data file and get strategic marketing recommendations that actually move your business forward.",
      img: "/images/why-1.png" // Reusing an image
    }
  ];

  return (
    <section className="py-24 bg-white/[0.02] border-y border-white/5">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Why Smart Creators Choose GrowBiz
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            GrowBiz brings everything together in one intelligent platform that understands ROI, not just writing.
          </p>
          <Button size="lg" className="bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 text-white rounded-full px-8">
            Get Started →
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
          {/* Tabs */}
          <div className="lg:w-1/3 flex flex-col gap-2">
            {tabs.map((tab, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab(idx)}
                className={`text-left p-4 rounded-xl transition-all duration-200 border ${
                  activeTab === idx 
                    ? "bg-white/10 border-white/20 shadow-lg" 
                    : "bg-transparent border-transparent hover:bg-white/5 text-white/60 hover:text-white/90"
                }`}
              >
                <h3 className={`font-semibold text-lg mb-2 ${activeTab === idx ? "text-white" : ""}`}>
                  {tab.title}
                </h3>
                {activeTab === idx && (
                  <p className="text-sm text-white/70 leading-relaxed">
                    {tab.desc}
                  </p>
                )}
              </button>
            ))}
          </div>

          {/* Screenshot display */}
          <div className="lg:w-2/3">
            <div className="glass-card rounded-2xl border border-white/10 p-2 h-full min-h-[400px] flex items-center justify-center">
              <img 
                src={tabs[activeTab].img} 
                alt={tabs[activeTab].title} 
                className="w-full h-auto rounded-xl object-cover border border-white/5 shadow-2xl transition-opacity duration-300"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
