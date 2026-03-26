// app/page.tsx
import React from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header variant="landing" />

      {/* Hero Section */}
      <main
        className="relative flex-1 flex items-center justify-center"
        style={{ minHeight: "100vh" }}
      >
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/bg.webp"
            alt="Real Estate Background"
            fill
            style={{ objectFit: "cover" }}
            priority
            quality={90}
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Hero content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto stagger pt-16">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-white text-xs font-semibold mb-6 animate-fade-in-up"
            style={{
              background: "rgba(247,147,30,0.25)",
              border: "1px solid rgba(247,147,30,0.5)",
              backdropFilter: "blur(8px)",
            }}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{
                background: "var(--color-secondary)",
                boxShadow: "0 0 6px var(--color-secondary)",
              }}
            />
            India's #1 Channel Partner Network
          </div>

          {/* Heading */}
          <h1
            className="text-white font-bold leading-tight mb-4 animate-fade-in-up"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 5vw, 3.8rem)",
            }}
          >
            Connect. Discover.{" "}
            <span style={{ color: "var(--color-secondary)" }}>
              Close Deals.
            </span>
          </h1>

          <p className="text-white/90 text-base md:text-lg mb-8 max-w-xl mx-auto leading-relaxed animate-fade-in-up">
            The ultimate platform for real estate channel partners to explore
            projects, connect with developers, and grow your portfolio.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-up">
            <Link href="/signup">
              <button
                className="px-8 py-3.5 rounded-xl font-bold text-white text-base transition-all hover:scale-105"
                style={{
                  background: "var(--gradient-btn-orange)",
                  boxShadow: "0 4px 20px rgba(247,147,30,0.5)",
                  fontFamily: "var(--font-display)",
                }}
              >
                Get Started Free
              </button>
            </Link>
            <Link href="/login">
              <button
                className="px-8 py-3.5 rounded-xl font-semibold text-white text-base transition-all hover:scale-105"
                style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "1.5px solid rgba(255,255,255,0.5)",
                  backdropFilter: "blur(10px)",
                  fontFamily: "var(--font-display)",
                }}
              >
                Login to Account
              </button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-14 grid grid-cols-3 gap-4 max-w-lg mx-auto animate-fade-in-up">
            {[
              { value: "5,000+", label: "Projects Listed" },
              { value: "1,200+", label: "Developers" },
              { value: "50,000+", label: "Partners" },
            ].map((s) => (
              <div
                key={s.label}
                className="text-center px-2 py-3 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                <p
                  className="text-xl md:text-2xl font-bold"
                  style={{
                    color: "var(--color-secondary)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {s.value}
                </p>
                <p className="text-white/70 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-16 px-4" style={{ background: "white" }}>
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-center font-bold text-2xl md:text-3xl mb-2"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--primary-blue-dark)",
            }}
          >
            Why Channel Partners Choose Us
          </h2>
          <p className="text-center text-gray-500 text-sm mb-10">
            Everything you need to grow your real estate business.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
            {[
              {
                icon: "🏗️",
                title: "Verified Projects",
                desc: "All listings are RERA-verified with complete documentation and developer credentials.",
              },
              {
                icon: "🔍",
                title: "Smart Filters",
                desc: "Advanced search with 15+ filter parameters to find the perfect project instantly.",
              },
              {
                icon: "💰",
                title: "Best Brokerage",
                desc: "Access exclusive brokerage plans and incentives directly from developers.",
              },
              {
                icon: "📊",
                title: "Market Intelligence",
                desc: "Real-time price trends, availability, and market insights at your fingertips.",
              },
              {
                icon: "🤝",
                title: "Direct Developer Connect",
                desc: "Communicate directly with sales teams and get priority support.",
              },
              {
                icon: "📱",
                title: "Mobile Ready",
                desc: "Fully responsive platform — work from anywhere, any device.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="card p-6 rounded-xl animate-fade-in-up hover:scale-[1.02] transition-transform"
              >
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3
                  className="font-bold text-base mb-1"
                  style={{
                    color: "var(--primary-blue-dark)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {f.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section
        className="py-14 px-4 text-center"
        style={{ background: "var(--gradient-primary)" }}
      >
        <h2
          className="text-white font-bold text-2xl md:text-3xl mb-3"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Ready to Grow Your Business?
        </h2>
        <p className="text-white/80 text-sm mb-6 max-w-md mx-auto">
          Join over 50,000 channel partners already using our platform.
        </p>
        <Link href="/signup">
          <button
            className="px-8 py-3.5 rounded-xl font-bold text-white text-base transition-all hover:scale-105"
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "2px solid white",
              fontFamily: "var(--font-display)",
            }}
          >
            Create Free Account →
          </button>
        </Link>
      </section>

      <Footer />
    </div>
  );
}