import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-metal-900 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#e94560]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="text-8xl font-bold bg-gradient-to-b from-white/10 to-white/[0.02] bg-clip-text text-transparent">
          404
        </div>
        <p className="mt-4 text-lg text-white/40 font-medium">Page not found</p>
        <p className="mt-1 text-sm text-white/20">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/editor"
          className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02] text-white/50 text-sm hover:bg-white/[0.04] hover:text-white/70 hover:border-white/[0.1] transition-all duration-150"
        >
          Go back to editor
        </Link>
      </div>
    </div>
  );
}
