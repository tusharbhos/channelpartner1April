// app/page.tsx
import React from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function LandingPage() {
  const features = [
    { icon: "🏗️", title: "Verified Projects",       desc: "All listings are RERA-verified with complete documentation and developer credentials." },
    { icon: "🔍", title: "Smart Filters",            desc: "Advanced search with 15+ filter parameters to find the perfect project instantly." },
    { icon: "💰", title: "Best Brokerage",           desc: "Access exclusive brokerage plans and incentives directly from top developers." },
    { icon: "📊", title: "Market Intelligence",      desc: "Real-time price trends, availability, and market insights at your fingertips." },
    { icon: "🤝", title: "Direct Developer Connect", desc: "Communicate directly with sales teams and get priority project support." },
    { icon: "📱", title: "Mobile Ready",             desc: "Fully responsive — work from anywhere on any device, anytime." },
  ];

  const stats = [
    { value: "5,000+",  label: "Projects Listed" },
    { value: "1,200+",  label: "Developers" },
    { value: "50,000+", label: "Partners" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header variant="landing" />

      {/* ── Hero ── */}
      <main className="relative flex-1 flex items-center justify-center" style={{ minHeight: "100vh" }}>
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <Image src="/bg.webp" alt="Real Estate Background" fill style={{ objectFit: "cover" }} priority quality={90} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(10,22,40,0.88) 0%, rgba(30,69,128,0.70) 55%, rgba(249,115,22,0.18) 100%)" }} />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 text-center stagger pt-16 sm:pt-20 pb-10">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full text-white text-xs font-semibold mb-5 animate-fade-in-up"
            style={{ background: "rgba(249,115,22,0.22)", border: "1px solid rgba(249,115,22,0.55)", backdropFilter: "blur(8px)" }}
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "var(--orange-400)", boxShadow: "0 0 7px var(--orange-400)" }} />
            India's #1 Channel Partner Network
          </div>

          {/* Heading */}
          <h1
            className="text-white font-bold leading-tight mb-4 animate-fade-in-up"
            style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem, 5vw, 3.6rem)" }}
          >
            Connect. Discover.{" "}
            <span style={{ color: "var(--orange-400)" }}>Close Deals.</span>
          </h1>

          <p className="text-white/85 text-sm sm:text-base md:text-lg mb-8 max-w-xl mx-auto leading-relaxed animate-fade-in-up">
            The ultimate platform for real estate channel partners to explore
            projects, connect with developers, and grow your portfolio.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col xs:flex-row sm:flex-row items-center justify-center gap-3 animate-fade-in-up">
            <Link href="/signup" className="w-full sm:w-auto">
              <button
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 rounded-xl font-bold text-white text-sm sm:text-base transition-all hover:scale-105 active:scale-95"
                style={{ background: "var(--gradient-btn-orange)", boxShadow: "var(--shadow-btn-orange)", fontFamily: "var(--font-display)" }}
              >
                Get Started Free →
              </button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <button
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 rounded-xl font-semibold text-white text-sm sm:text-base transition-all hover:scale-105 active:scale-95"
                style={{ background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.5)", backdropFilter: "blur(10px)", fontFamily: "var(--font-display)" }}
              >
                Login to Account
              </button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-10 sm:mt-14 grid grid-cols-3 gap-2 sm:gap-4 max-w-sm sm:max-w-lg mx-auto animate-fade-in-up">
            {stats.map((s) => (
              <div
                key={s.label}
                className="text-center px-2 py-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.09)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.16)" }}
              >
                <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{ color: "var(--orange-300)", fontFamily: "var(--font-display)" }}>
                  {s.value}
                </p>
                <p className="text-white/65 text-[10px] sm:text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ── Features ── */}
      <section className="py-12 sm:py-16 px-4 sm:px-6" style={{ background: "#ffffff" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 sm:mb-10">
            <h2
              className="font-bold text-xl sm:text-2xl md:text-3xl mb-2"
              style={{ fontFamily: "var(--font-display)", color: "var(--primary-blue-dark)" }}
            >
              Why Channel Partners Choose Us
            </h2>
            <p className="text-gray-500 text-sm">Everything you need to grow your real estate business.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 stagger">
            {features.map((f) => (
              <div key={f.title} className="card p-5 sm:p-6 rounded-xl group">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3"
                  style={{ background: "var(--orange-50)", border: "1px solid var(--orange-100)" }}
                >
                  {f.icon}
                </div>
                <h3 className="font-bold text-sm sm:text-base mb-1" style={{ color: "var(--primary-blue-dark)", fontFamily: "var(--font-display)" }}>
                  {f.title}
                </h3>
                <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <section className="py-8 px-4" style={{ background: "var(--navy-50)", borderTop: "1px solid var(--navy-100)", borderBottom: "1px solid var(--navy-100)" }}>
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-4 sm:gap-8">
          {["RERA Verified", "ISO Certified", "50K+ Partners", "Pan India"].map((t) => (
            <div key={t} className="flex items-center gap-2 text-xs sm:text-sm font-semibold" style={{ color: "var(--navy-700)" }}>
              <span className="text-orange-500">✓</span> {t}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-12 sm:py-16 px-4 text-center" style={{ background: "var(--gradient-primary)" }}>
        <h2 className="text-white font-bold text-xl sm:text-2xl md:text-3xl mb-3" style={{ fontFamily: "var(--font-display)" }}>
          Ready to Grow Your Business?
        </h2>
        <p className="text-white/80 text-xs sm:text-sm mb-6 max-w-md mx-auto">
          Join over 50,000 channel partners already using our platform.
        </p>
        <Link href="/signup">
          <button
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm sm:text-base transition-all hover:scale-105 active:scale-95"
            style={{ background: "var(--gradient-btn-orange)", color: "#fff", boxShadow: "var(--shadow-btn-orange)", fontFamily: "var(--font-display)" }}
          >
            Create Free Account →
          </button>
        </Link>
      </section>

      <Footer />
    </div>
  );
}