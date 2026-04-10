export default function TestimonialsSection() {
  const testimonials = [
    { name: "Rachel Lewis", text: "Since switching to Marketingstuffs, I've seen higher engagement, better SEO, and a consistent brand voice. Its writing, image, and social tools work together effortlessly." },
    { name: "Mark Thompson", text: "Marketingstuffs blends writing, visuals, and social content seamlessly. From content creation to image generation and scheduling—it saves hours and powers my entire workflow." },
    { name: "Emily Chen", text: "The AI Humanizer transforms robotic text into natural, emotional, on-brand writing. My content feels authentic—and clients noticed the difference instantly." },
    { name: "James Cooper", text: "From rewriting to idea generation, Marketingstuffs offers powerful, beginner-friendly tools for daily tasks like emails, ad copy, and content summaries. A true creative companion." },
    { name: "Priya Sharma", text: "Gravity Social streamlines content creation, platform-specific scheduling, and caption tailoring — all in one place. It's a huge time-saver for digital marketers and creators." },
    { name: "Daniel Rivera", text: "The AI Image Generator instantly delivers stunning banners, thumbnails, and blog headers—no delays, just fast, eye-catching visuals on demand." },
    { name: "Sarah Mitchell", text: "Marketingstuffs boosts engagement, SEO, and brand consistency with powerful tools like the blog writer, image generator, and Gravity Social - all working seamlessly to drive growth." },
    { name: "Mishack Iheagwu", text: "Marketingstuffs simplifies work with title and blog outline generation, fast, clean article writing, allowing focus on research and editing. Great for efficiency." },
    { name: "Esther Jesudasan", text: "Marketingstuffs enhances writing with smart suggestions, saves time, works on various devices, offers reliable customer support, and is valuable for ed-tech content creation." }
  ];

  // Duplicate for seamless infinite scroll
  const scrollItems = [...testimonials, ...testimonials];

  return (
    <section className="py-24 bg-white/[0.02] border-y border-white/5 overflow-hidden">
      <div className="container px-4 mx-auto text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Hear from Our Users</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Discover how content creators, marketers, and business owners are achieving breakthrough results with Marketingstuffs's intelligent content creation platform.
        </p>
      </div>

      <div className="relative w-full">
        {/* Gradients to hide edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0b0c1b] to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0b0c1b] to-transparent z-10" />

        <div className="flex animate-marquee-slow hover:pause gap-6 px-4">
          {scrollItems.map((item, idx) => (
            <div 
              key={idx} 
              className="glass-card rounded-2xl p-6 min-w-[350px] max-w-[350px] border border-white/10 flex flex-col justify-between"
            >
              <div className="flex gap-1 mb-4 text-yellow-500">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                  </svg>
                ))}
              </div>
              <p className="text-white/80 text-sm leading-relaxed mb-6 italic">"{item.text}"</p>
              <div className="flex items-center gap-3 mt-auto">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center text-white font-bold">
                  {item.name.charAt(0)}
                </div>
                <div className="font-semibold text-white">{item.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}