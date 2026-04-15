import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import BrandsMarquee from "@/components/BrandsMarquee";
import BlogWriterSection from "@/components/BlogWriterSection";
import WebsiteDeveloperSection from "@/components/WebsiteDeveloperSection";
import SocialMediaSection from "@/components/SocialMediaSection";
import AIToolsHub from "@/components/AIToolsHub";
import WritingToolsSection from "@/components/WritingToolsSection";
import ToolsSection from "@/components/ToolsSection";
import WhyGravityWrite from "@/components/WhyGravityWrite";
import PricingSection from "@/components/PricingSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import { GenerationGateProvider } from "@/components/GenerationGate";

export default function Home() {
  return (
    <GenerationGateProvider>
      <main className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
        <Navbar />
        <HeroSection />
        <BrandsMarquee />
        <BlogWriterSection />
        <section id="website-developer"><WebsiteDeveloperSection /></section>
        <section id="social-media-section"><SocialMediaSection /></section>
        <AIToolsHub />
        <WritingToolsSection />
        <ToolsSection />
        <WhyGravityWrite />
        <PricingSection />
        <TestimonialsSection />
        <CTASection />
        <Footer />
      </main>
    </GenerationGateProvider>
  );
}
