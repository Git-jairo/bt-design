"use client";

import Script from "next/script";

/**
 * Mijn Omgeving — Contract Renewal
 *
 * This experiment is a self-contained, exported HTML/JS prototype (a
 * "bundled page" with its assets inlined) rather than a native React build.
 * It's served as a static file from `public/experiments/contract-renewal/`
 * and embedded here via iframe so its own script/manifest tags don't
 * collide with Next's hydration. If this concept graduates, it should be
 * rebuilt as real components against the Helix Design System.
 *
 * The Maze universal snippet lives HERE, on the real Next.js route, rather
 * than inside the iframed static HTML. Maze targets studies against the
 * URL of the top-level window it's loaded in — inside the iframe that URL
 * was `/experiments/contract-renewal/index.html` (the static asset path),
 * which never matched a `/experiments/contract-renewal` targeting rule.
 * Loading it on the page itself lets Maze see the real app route.
 */
export default function ContractRenewalPage() {
  return (
    <div className="fixed inset-0 bg-white">
      <iframe
        src="/experiments/contract-renewal/index.html"
        title="Mijn Omgeving — Contract Renewal"
        className="h-full w-full border-0"
      />
      <Script id="maze-universal-snippet" strategy="afterInteractive">
        {`(function (m, a, z, e) {
  var s, t, u, v;
  try {
    t = m.sessionStorage.getItem('maze-us');
  } catch (err) {}

  if (!t) {
    t = new Date().getTime();
    try {
      m.sessionStorage.setItem('maze-us', t);
    } catch (err) {}
  }

  u = document.currentScript || (function () {
    var w = document.getElementsByTagName('script');
    return w[w.length - 1];
  })();
  v = u && u.nonce;

  s = a.createElement('script');
  s.src = z + '?apiKey=' + e;
  s.async = true;
  if (v) s.setAttribute('nonce', v);
  a.getElementsByTagName('head')[0].appendChild(s);
  m.mazeUniversalSnippetApiKey = e;
})(window, document, 'https://snippet.maze.co/maze-universal-loader.js', '41b40a67-5c5c-408a-b71e-bfa249b1a596');`}
      </Script>
    </div>
  );
}
