import type { Metadata } from "next";
import EditorShell from "@/components/editor/EditorShell";

export const metadata: Metadata = {
  title: "LadeStack Editor - Free AI Image Editor",
  description:
    "Professional browser-based AI-powered image editor. Edit photos with layers, filters, brushes, and smart AI tools — all in your browser.",
};

export default function EditorPage() {
  return (
    <main className="h-screen w-screen overflow-hidden p-0">
      <EditorShell />
    </main>
  );
}
