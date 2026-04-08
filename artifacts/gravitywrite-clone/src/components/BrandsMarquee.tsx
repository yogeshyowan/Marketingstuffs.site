export default function BrandsMarquee() {
  const brands = [
    "Wipro", "Zoho", "Accenture", "Infosys", "Swiggy", "Comcast", 
    "Byju's", "PayPal", "Asian Paints", "Krispy Kreme", "Unacademy", "Zomato"
  ];

  return (
    <section className="py-12 border-y border-white/5 bg-white/[0.02]">
      <div className="container px-4 mx-auto mb-8 text-center">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
          Trusted by most popular brands
        </p>
      </div>
      
      <div className="relative w-full overflow-hidden flex flex-col gap-6">
        {/* Left/Right Gradients for smooth fade out */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
        
        {/* Marquee Container */}
        <div className="flex w-[200%] animate-marquee">
          <div className="flex w-1/2 justify-around items-center px-4">
            {brands.map((brand, i) => (
              <span key={i} className="text-xl md:text-2xl font-bold text-white/30 grayscale hover:text-white/60 hover:grayscale-0 transition-all cursor-default select-none">
                {brand}
              </span>
            ))}
          </div>
          <div className="flex w-1/2 justify-around items-center px-4">
            {brands.map((brand, i) => (
              <span key={`dup-${i}`} className="text-xl md:text-2xl font-bold text-white/30 grayscale hover:text-white/60 hover:grayscale-0 transition-all cursor-default select-none">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
