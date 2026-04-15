export default function BrandsMarquee() {
  const row1 = [
    "Freshworks", "Zoho", "Kissflow", "Chargebee", "Razorpay",
    "Ather Energy", "Groww", "Kovai.co", "Dunzo", "Spinny",
  ];
  const row2 = [
    "Urban Company", "OkCredit", "Ketto", "Matrimony.com", "GoKwik",
    "Meesho", "ShareChat", "mFine", "BrowserStack", "Perfios",
  ];

  const Row = ({ items, reverse }: { items: string[]; reverse?: boolean }) => (
    <div className={`flex w-[200%] ${reverse ? "animate-marquee-reverse" : "animate-marquee"}`}>
      {[0, 1].map(n => (
        <div key={n} className="flex w-1/2 justify-around items-center px-4">
          {items.map((brand, i) => (
            <span key={`${n}-${i}`}
              className="text-lg md:text-xl font-bold text-white/25 hover:text-white/60 transition-all cursor-default select-none whitespace-nowrap px-2">
              {brand}
            </span>
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <section className="py-12 border-y border-white/5 bg-white/[0.02]">
      <div className="container px-4 mx-auto mb-8 text-center">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
          Trusted by startups &amp; brands across South India
        </p>
        <p className="text-[11px] text-slate-600">Chennai · Bangalore · Coimbatore · Hyderabad</p>
      </div>

      <div className="relative w-full overflow-hidden flex flex-col gap-5">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        <Row items={row1} />
        <Row items={row2} reverse />
      </div>
    </section>
  );
}
