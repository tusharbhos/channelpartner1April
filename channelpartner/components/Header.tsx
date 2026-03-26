// components/Header.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface HeaderProps {
  variant?: "landing" | "app" | "auth";
}

export default function Header({ variant = "landing" }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [dropOpen, setDropOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/");
    setMobileOpen(false);
    setDropOpen(false);
  };

  const navLinks = [
    { href: "/home",      label: "Projects",  icon: "🏠" },
    { href: "/dashboard", label: "Customers", icon: "👥" },
    { href: "/calendar",  label: "Calendar",  icon: "📅" },
    ...(user?.role === "admin" ? [{ href: "/admin", label: "Admin", icon: "⚙️" }] : []),
  ];

  // Determine which links to show based on variant
  const showAuthButtons = variant === "landing";
  const showAppNav = variant === "app" && user;

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center px-4 md:px-8 gap-4"
        style={{
          background: "var(--gradient-header)",
          height: "var(--header-height)",
          boxShadow: "0 2px 20px rgba(6,14,26,0.35)",
        }}
      >
        {/* Logo - Always visible */}
        <Link href={user ? "/home" : "/"} className="flex-shrink-0">
          <div className="h-9 w-40 md:w-48 flex items-center">
            {!logoError ? (
              <div className="relative w-full h-full">
                <Image 
                  src="/logo.png" 
                  alt="ChannelPartner.Network" 
                  fill
                  sizes="(max-width: 768px) 160px, 192px"
                  style={{ 
                    objectFit: "contain",
                    objectPosition: "left"
                  }} 
                  priority
                  onError={() => setLogoError(true)}
                />
              </div>
            ) : (
              <span className="text-white font-bold text-xl tracking-tight">
                ChannelPartner.Network
              </span>
            )}
          </div>
        </Link>

        {/* Desktop navigation for app variant */}
        {showAppNav && (
          <nav className="hidden md:flex items-center gap-1 ml-2">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link key={link.href} href={link.href}>
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                    style={{
                      background: active ? "rgba(255,255,255,0.18)" : "transparent",
                      color: active ? "#fff" : "rgba(255,255,255,0.72)",
                      border: active ? "1px solid rgba(255,255,255,0.25)" : "1px solid transparent",
                    }}
                  >
                    <span style={{ fontSize: 13 }}>{link.icon}</span>
                    {link.label}
                  </button>
                </Link>
              );
            })}
          </nav>
        )}

        <div className="flex-1" />

        {/* Auth buttons for landing page */}
        {showAuthButtons && (
          <nav className="flex items-center gap-2">
            <Link href="/login">
              <button className="btn btn-outline-white text-sm px-4 py-2">
                Log In
              </button>
            </Link>
            <Link href="/signup">
              <button className="btn btn-gold text-sm px-4 py-2">
                Sign Up
              </button>
            </Link>
          </nav>
        )}

        {/* Auth page buttons - simple navigation */}
        {variant === "auth" && (
          <nav className="flex items-center gap-2">
            <Link href="/">
              <button className="btn btn-outline-white text-sm px-4 py-2">
                Home
              </button>
            </Link>
            {pathname === "/login" ? (
              <Link href="/signup">
                <button className="btn btn-gold text-sm px-4 py-2">
                  Sign Up
                </button>
              </Link>
            ) : (
              <Link href="/login">
                <button className="btn btn-gold text-sm px-4 py-2">
                  Log In
                </button>
              </Link>
            )}
          </nav>
        )}

        {/* App user menu */}
        {variant === "app" && user && (
          <div className="flex items-center gap-2" ref={dropRef}>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-white hover:bg-white/15 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>

            {/* Avatar + dropdown trigger */}
            <button
              onClick={() => setDropOpen(!dropOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all hover:bg-white/12"
              style={{ border: "1px solid rgba(255,255,255,0.18)" }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: "var(--gold-500)", color: "var(--navy-900)" }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-white text-xs font-bold leading-tight max-w-[110px] truncate">{user.name}</p>
                {user.role === "admin" && (
                  <span className="text-[10px] font-bold px-1.5 rounded-full" style={{ background: "var(--gold-500)", color: "var(--navy-900)" }}>
                    ADMIN
                  </span>
                )}
              </div>
              <svg
                className={`w-3.5 h-3.5 text-white/60 transition-transform hidden sm:block ${dropOpen ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown */}
            {dropOpen && (
              <div
                className="absolute right-4 md:right-8 top-[72px] w-56 rounded-2xl shadow-xl overflow-hidden z-50 animate-scale-in"
                style={{ background: "#fff", border: "1px solid var(--slate-200)" }}
              >
                {/* User info */}
                <div className="px-4 py-3" style={{ background: "var(--navy-50)", borderBottom: "1px solid var(--slate-200)" }}>
                  <p className="text-xs text-gray-500 mb-0.5">Signed in as</p>
                  <p className="font-bold text-sm truncate" style={{ color: "var(--navy-900)" }}>{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>

                {/* Mobile nav links */}
                <div className="py-1 border-b border-gray-100 md:hidden">
                  {navLinks.map((link) => (
                    <Link key={link.href} href={link.href}>
                      <button
                        className="w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-2.5 transition-colors hover:bg-blue-50"
                        style={{ color: "var(--color-text-secondary)" }}
                        onClick={() => setDropOpen(false)}
                      >
                        <span>{link.icon}</span> {link.label}
                      </button>
                    </Link>
                  ))}
                </div>

                {/* Profile / Settings */}
                <div className="py-1 border-b border-gray-100">
                  {[
                    { icon: "👤", label: "My Profile" },
                    { icon: "⚙️", label: "Settings" },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => setDropOpen(false)}
                      className="w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-2.5 transition-colors hover:bg-blue-50"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <span>{item.icon}</span> {item.label}
                    </button>
                  ))}
                </div>

                {/* Logout */}
                <div className="py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-2.5 transition-colors hover:bg-red-50"
                    style={{ color: "var(--red-600)" }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Mobile drawer for app variant */}
      {variant === "app" && user && mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
          <aside
            className="fixed left-0 bottom-0 w-64 z-50 md:hidden animate-slide-left"
            style={{ top: "var(--header-height)", background: "#fff", boxShadow: "var(--shadow-sidebar)" }}
          >
            <nav className="p-3 space-y-1">
              {navLinks.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                    <button
                      className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 transition-colors"
                      style={{
                        background: active ? "var(--navy-50)" : "transparent",
                        color: active ? "var(--navy-700)" : "var(--color-text-secondary)",
                        borderLeft: active ? `3px solid var(--navy-600)` : "3px solid transparent",
                      }}
                    >
                      <span className="text-lg">{link.icon}</span> {link.label}
                    </button>
                  </Link>
                );
              })}
              <hr className="my-2" style={{ borderColor: "var(--slate-100)" }} />
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 transition-colors hover:bg-red-50"
                style={{ color: "var(--red-600)" }}
              >
                <span className="text-lg">🚪</span> Log Out
              </button>
            </nav>
          </aside>
        </>
      )}
    </>
  );
}