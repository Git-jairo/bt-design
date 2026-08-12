"use client";

import Script from "next/script";

/**
 * Maze universal snippet.
 *
 * Drop `<MazeSnippet />` into any page that should be reachable by a Maze
 * study. It's a client component so it can be used from server pages too.
 *
 * Two things to know:
 *
 *  1. Maze targets studies against the URL of the **top-level window** it's
 *     loaded in. Never put this inside an iframed static prototype — from
 *     there the URL is the asset path (e.g.
 *     `/experiments/foo/index.html`) and no `/experiments/foo` targeting
 *     rule will ever match. Mount it on the real Next.js route instead.
 *  2. It must be mounted per-page rather than once in the root layout,
 *     because Maze reads the URL at load time; keeping it explicit makes it
 *     obvious which routes are instrumented.
 */
const MAZE_API_KEY = "10378d98-15ab-41cf-aac4-32036fea7bef";

export function MazeSnippet() {
  return (
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
})(window, document, 'https://snippet.maze.co/maze-universal-loader.js', '${MAZE_API_KEY}');`}
    </Script>
  );
}
