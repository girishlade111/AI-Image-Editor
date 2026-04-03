import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LadeStack Editor - Free AI Image Editor",
  description:
    "Professional browser-based AI-powered image editor. Edit photos with layers, filters, brushes, and smart AI tools — all in your browser.",
};

export default function Home() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#0f0f1a]">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-[#e94560]/10 via-transparent to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: "4s" }} />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-[#e94560]/5 via-transparent to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: "6s" }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0f0f1a_70%)]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 flex items-center gap-3">
          <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-[#e94560]" />
          <span className="bg-gradient-to-r from-white via-white to-[#e94560] bg-clip-text text-transparent">
            LadeStack Editor
          </span>
        </h1>

        <p className="text-lg text-white/60 mb-8 max-w-md">
          Free AI-powered image editor. No login required.
        </p>

        <Link
          href="/editor"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#e94560] text-white font-medium rounded-lg hover:bg-[#d63d56] transition-colors duration-200 text-lg"
        >
          Start Editing →
        </Link>
      </div>
    </main>
  );
}