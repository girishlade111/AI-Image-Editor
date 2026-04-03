import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[hsl(222,47%,11%)]">
      <h1 className="text-6xl font-bold text-white/10">404</h1>
      <p className="mt-4 text-xl text-white">Page not found</p>
      <Link
        href="/editor"
        className="mt-6 text-white/60 hover:text-white underline underline-offset-4 transition-colors"
      >
        Go back to editor
      </Link>
    </div>
  );
}