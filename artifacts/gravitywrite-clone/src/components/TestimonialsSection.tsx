export default function TestimonialsSection() {
  const testimonials = [
    {
      name: "Karthik Sundar",
      role: "Growth Marketing Lead, Freshworks · Chennai",
      avatar: "K",
      color: "from-blue-500 to-indigo-600",
      text: "We run 50+ blog posts a month for different product lines. With Marketingstuffs' Blog Writer, the team cuts research and drafting time by 70%. SEO structure comes built-in — we just edit, publish, and rank."
    },
    {
      name: "Priya Raghavan",
      role: "Co-founder, Kissflow · Chennai",
      avatar: "P",
      color: "from-violet-500 to-purple-600",
      text: "The Growth Hub's Content Machine is exactly what we needed. One input — niche, product, audience — and it maps out YouTube, email sequences, blog, and social content in one go. Our full-funnel took 2 days, not 2 weeks."
    },
    {
      name: "Deepa Krishnamurthy",
      role: "Head of Marketing, Chargebee · Chennai",
      avatar: "D",
      color: "from-emerald-500 to-teal-600",
      text: "Email is our biggest retention channel. Marketingstuffs' Email Marketing tool generates sequences that actually convert — product adoption emails, win-back campaigns, renewal nudges. Our open rates went up 34% within the first month."
    },
    {
      name: "Arjun Rajendran",
      role: "Digital Marketing Manager, Ather Energy · Bangalore",
      avatar: "A",
      color: "from-amber-500 to-orange-600",
      text: "We were spending ₹2L/month on ad agency fees just for copy. Marketingstuffs' Ad Campaigns tool generates Google and Instagram ads in minutes. We tested 8 variations in a week — something that used to take a month."
    },
    {
      name: "Suresh Murugan",
      role: "Founder, Kovai.co · Coimbatore",
      avatar: "S",
      color: "from-pink-500 to-rose-600",
      text: "Building a SaaS from Coimbatore, I don't have a big marketing team. The Growth Hub's AI Coach and Revenue Scale Plan gave me a clear phase-by-phase roadmap — from free content to paid acquisition. It thinks like a CMO."
    },
    {
      name: "Ramya Natarajan",
      role: "Brand Manager, Groww · Bangalore",
      avatar: "R",
      color: "from-cyan-500 to-blue-600",
      text: "Financial content has to be accurate and engaging — a tough balance. Marketingstuffs' Writing Tools give us 100+ templates for explainers, comparison posts, FAQs. We publish 3x more content without adding headcount."
    },
    {
      name: "Vijay Anand",
      role: "YouTube Creator (180K subs) · Coimbatore",
      avatar: "V",
      color: "from-red-500 to-orange-500",
      text: "The Growth Hub's Channel Analyzer is brilliant. I fed in my CTR, watch time, and subscriber stats — it told me exactly what was hurting growth and pointed me to the right tool for each fix. Grew 22K subs in 3 months after."
    },
    {
      name: "Annamalai Selvam",
      role: "Founder, Nimble Naturals (D2C brand) · Coimbatore",
      avatar: "A",
      color: "from-green-500 to-emerald-600",
      text: "As a small D2C brand from Coimbatore, we can't afford a design agency. The AI Image Studio gives us stunning product banners and ad creatives on demand. Our Instagram ROAS improved 2.8x since we switched to Marketingstuffs."
    },
    {
      name: "Kavitha Ramasamy",
      role: "Freelance Digital Marketer · Chennai",
      avatar: "K",
      color: "from-indigo-500 to-violet-600",
      text: "I manage digital marketing for 9 SME clients across Chennai. Marketingstuffs lets me run Blog, Social, Email, SMS, and Ads from a single platform. I've doubled my client list without hiring anyone — it's like an entire agency in one tab."
    },
    {
      name: "Siddharth Rao",
      role: "Co-founder, Flexiwork · Bangalore",
      avatar: "S",
      color: "from-teal-500 to-cyan-600",
      text: "We're a 3-person startup. The Webinar Funnel tool built our entire launch plan — landing page copy, email sequence, SMS reminders, social posts, and even the pitch script. We did ₹4L in sales from our first webinar."
    },
    {
      name: "Meenakshi Pillai",
      role: "Content Head, mFine · Bangalore",
      avatar: "M",
      color: "from-rose-500 to-pink-600",
      text: "Healthcare content has strict compliance needs. Marketingstuffs' Writing Tools and AI Humanizer help us write empathetic, accurate, and engaging articles fast. Our health blog now gets 1.2L organic visits monthly."
    },
    {
      name: "Balamurugan S",
      role: "Founder, Laundrokar · Coimbatore",
      avatar: "B",
      color: "from-orange-500 to-amber-600",
      text: "I started with zero social following. The Shorts Planner gave me a 30-day daily content plan — simple, beginner-friendly topics that build up week by week. After 45 days, we had 8,000 YouTube subscribers and 2 franchise inquiries."
    },
  ];

  const scrollItems = [...testimonials, ...testimonials];

  return (
    <section className="py-24 bg-white/[0.02] border-y border-white/5 overflow-hidden">
      <div className="container px-4 mx-auto text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Loved by Indian Startups
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-3">
          From Chennai SaaS companies to Coimbatore D2C brands and Bangalore scale-ups — here's what real teams say after switching to Marketingstuffs.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {["Chennai", "Bangalore", "Coimbatore"].map(city => (
            <span key={city}
              className="text-xs bg-slate-800 border border-slate-700 text-slate-400 px-3 py-1 rounded-full">
              📍 {city}
            </span>
          ))}
        </div>
      </div>

      <div className="relative w-full">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0b0c1b] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0b0c1b] to-transparent z-10 pointer-events-none" />

        <div className="flex animate-marquee-slow hover:pause gap-6 px-4">
          {scrollItems.map((item, idx) => (
            <div key={idx}
              className="glass-card rounded-2xl p-6 min-w-[360px] max-w-[360px] border border-white/10 flex flex-col justify-between flex-shrink-0">
              <div className="flex gap-1 mb-4 text-yellow-400">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                  </svg>
                ))}
              </div>
              <p className="text-white/80 text-sm leading-relaxed mb-6 italic">"{item.text}"</p>
              <div className="flex items-center gap-3 mt-auto">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                  {item.avatar}
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">{item.name}</div>
                  <div className="text-slate-500 text-xs">{item.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
