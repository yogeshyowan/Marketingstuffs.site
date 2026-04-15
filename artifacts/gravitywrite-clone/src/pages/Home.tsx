import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import BrandsMarquee from "@/components/BrandsMarquee";
import BlogWriterSection from "@/components/BlogWriterSection";
import WebsiteDeveloperSection from "@/components/WebsiteDeveloperSection";
import SocialMediaSection from "@/components/SocialMediaSection";
import YTGrowstuffsSection from "@/components/YTGrowstuffsSection";
import AdCampaignSection from "@/components/AdCampaignSection";
import EmailMarketingSection from "@/components/EmailMarketingSection";
import SMSMarketingSection from "@/components/SMSMarketingSection";
import AIToolsHub from "@/components/AIToolsHub";
import WritingToolsSection from "@/components/WritingToolsSection";
import ImageGeneratorSection from "@/components/ImageGeneratorSection";
import VideoGeneratorSection from "@/components/VideoGeneratorSection";
import VoiceGeneratorSection from "@/components/VoiceGeneratorSection";
import ResourcesSection from "@/components/ResourcesSection";
import ToolsSection from "@/components/ToolsSection";
import WhyGravityWrite from "@/components/WhyGravityWrite";
import PricingSection from "@/components/PricingSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import BlogsSection from "@/components/BlogsSection";
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
        <YTGrowstuffsSection />
        <AdCampaignSection />
        <EmailMarketingSection />
        <SMSMarketingSection />
        <AIToolsHub />
        <WritingToolsSection />
        <ImageGeneratorSection />
        <VideoGeneratorSection />
        <VoiceGeneratorSection />
        <ResourcesSection />
        <ToolsSection />
        <BlogsSection />
        <WhyGravityWrite />
        <PricingSection />
        <TestimonialsSection />
        <CTASection />
        <Footer />
      </main>
    </GenerationGateProvider>
  );
}
