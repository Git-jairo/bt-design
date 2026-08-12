import { MazeSnippet } from "@/components/MazeSnippet";

export const metadata = {
  title: "Internet Contract Renewal — Variant A",
};

/**
 * Internet Contract Renewal — Variant A.
 *
 * Shell around a self-contained, exported HTML/JS prototype served as a
 * static file from `public/experiments/internet-contract-renewal/a.html`.
 * It's iframed so the prototype's own script/manifest tags don't collide
 * with Next's hydration. If a variant wins, rebuild it as real components
 * against the Helix Design System.
 *
 * The Maze snippet is mounted here, on the real route, not inside the
 * iframe — see the note in `MazeSnippet`.
 */
export default function ContractRenewalVariantAPage() {
  return (
    <div className="fixed inset-0 bg-white">
      <iframe
        src="/experiments/internet-contract-renewal/a.html"
        title="Internet Contract Renewal — Variant A"
        className="h-full w-full border-0"
      />
      <MazeSnippet />
    </div>
  );
}
