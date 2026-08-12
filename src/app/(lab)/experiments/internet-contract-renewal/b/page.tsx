export const metadata = {
  title: "Internet Contract Renewal — Variant B",
};

/**
 * Internet Contract Renewal — Variant B.
 *
 * Sibling of variant A; see `../a/page.tsx` for the why behind the iframe
 * and the placement of the Maze snippet.
 */
export default function ContractRenewalVariantBPage() {
  return (
    <div className="fixed inset-0 bg-white">
      <iframe
        src="/experiments/internet-contract-renewal/b.html"
        title="Internet Contract Renewal — Variant B"
        className="h-full w-full border-0"
      />
    </div>
  );
}
