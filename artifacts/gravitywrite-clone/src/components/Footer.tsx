import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-background pt-20 pb-10">
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center font-bold text-lg text-white">
                G
              </div>
              <span className="font-bold text-2xl tracking-tight text-white">GravityWrite</span>
            </Link>
            <p className="text-muted-foreground mb-6 max-w-xs">
              The AI content platform that grows your business.
            </p>
            {/* Social Icons Placeholder */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-primary/20 transition-colors cursor-pointer">X</div>
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-primary/20 transition-colors cursor-pointer">In</div>
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-primary/20 transition-colors cursor-pointer">Ig</div>
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-primary/20 transition-colors cursor-pointer">Yt</div>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              <li><Link href="#" className="text-muted-foreground hover:text-white transition-colors">Blog Writer</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-white transition-colors">Image Generator</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-white transition-colors">Social Media</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-white transition-colors">AI Video</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-white transition-colors">AI Website Builder</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-white transition-colors">AI Humanizer</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-3">
              <li><Link href="#" className="text-muted-foreground hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-white transition-colors">Tutorials</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-white transition-colors">Webinars</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-white transition-colors">Changelog</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-white transition-colors">API Docs</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              <li><Link href="#" className="text-muted-foreground hover:text-white transition-colors">About</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-white transition-colors">Press</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-white transition-colors">Affiliate Program</Link></li>
            </ul>
          </div>

        </div>
        
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/40">
          <p>© 2025 GravityWrite. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-white transition-colors">Cookie Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">GDPR</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
