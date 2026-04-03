import Link from "next/link";
import { Sparkles, ArrowRight, Layers, Wand2, Zap } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LadeStack Editor — Free AI Image Editor",
  description:
    "Professional browser-based AI-powered image editor. Edit photos with layers, filters, brushes, and smart AI tools — all in your browser.",
};

export default function Home() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-metal-900">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-[#e94560]/8 via-transparent to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: "4s" }} />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-[#e94560]/5 via-transparent to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: "6s" }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0d0f17_70%)]" />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl">
        {/* Logo */}
        <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#e94560] to-[#ff6b6b] shadow-[0_4px_24px_rgba(233,69,96,0.3)]">
          <Sparkles className="w-8 h-8 text-white" strokeWidth={2} />
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-3 tracking-tight">
          <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
            LadeStack
          </span>{" "}
          <span className="bg-gradient-to-r from-[#e94560] to-[#ff6b6b] bg-clip-text text-transparent">
            Editor
          </span>
        </h1>

        <p className="text-base text-white/40 mb-8 max-w-md leading-relaxed">
          Professional AI-powered image editor. Layers, filters, brushes — all in your browser. No login required.
        </p>

        {/* CTA Button */}
        <Link
          href="/editor"
          className="group inline-flex items-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white font-semibold rounded-xl shadow-[0_4px_20px_rgba(233,69,96,0.3)] hover:shadow-[0_8px_32px_rgba(233,69,96,0.4)] hover:from-[#f05a73] hover:to-[#ff8080] transition-all duration-200"
        >
          Start Editing
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>

        {/* Feature pills */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {[
            { icon: Layers, label: "Layers" },
            { icon: Wand2, label: "AI Tools" },
            { icon: Zap, label: "Real-time" },
          ].map((feature) => (
            <div
              key={feature.label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] text-white/30 text-xs"
            >
              <feature.icon className="w-3 h-3" />
              {feature.label}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
