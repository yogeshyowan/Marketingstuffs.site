import { Link } from "wouter";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <>
      {/* Top Announcement Bar */}
      <div className="bg-primary/20 border-b border-primary/20 text-center py-2 px-4 text-sm text-primary-foreground font-medium w-full z-50 relative">
        <span>🔥 24-Hour Flash Sale — Claim today</span>
        <Link href="#" className="ml-2 underline underline-offset-2 hover:text-primary transition-colors">
          Grab the deal
        </Link>
      </div>

      {/* Main Navbar */}
      <nav className="sticky top-0 z-40 w-full border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-[0_0_15px_rgba(124,58,237,0.5)] group-hover:scale-105 transition-transform">
                G
              </div>
              <span className="font-bold text-xl tracking-tight text-white">GravityWrite</span>
            </Link>

            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
              <Link href="#" className="hover:text-white transition-colors">Features</Link>
              <Link href="#" className="hover:text-white transition-colors">Blog Writer</Link>
              <Link href="#" className="hover:text-white transition-colors">Image Generator</Link>
              <Link href="#" className="hover:text-white transition-colors">Social Media</Link>
              <Link href="#" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="#" className="hover:text-white transition-colors">Blog</Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="#" className="hidden sm:block text-sm font-medium text-white hover:text-primary transition-colors">
              Login
            </Link>
            <Button className="bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 text-white border-0 hidden sm:flex">
              Start for Free
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden text-white">
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </nav>
    </>
  );
}
