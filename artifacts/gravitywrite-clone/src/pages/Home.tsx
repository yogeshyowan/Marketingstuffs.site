import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import BrandsMarquee from "@/components/BrandsMarquee";
import BlogWriterSection from "@/components/BlogWriterSection";
import ImageGeneratorSection from "@/components/ImageGeneratorSection";
import SocialMediaSection from "@/components/SocialMediaSection";
import ToolsSection from "@/components/ToolsSection";
import WhyGravityWrite from "@/components/WhyGravityWrite";
import PricingSection from "@/components/PricingSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <Navbar />
      <HeroSection />
      <BrandsMarquee />
      <BlogWriterSection />
      <ImageGeneratorSection />
      <SocialMediaSection />
      <ToolsSection />
      <WhyGravityWrite />
      <PricingSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </main>
  );
}
