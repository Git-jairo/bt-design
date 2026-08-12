/**
 * Maze universal snippet — loaded site-wide from the root layout's `<head>`.
 *
 * Three things to know before you move this:
 *
 *  1. It renders a plain `<script>` inside the root layout's `<head>`, NOT
 *     `next/script`. Maze's installation check fetches the raw HTML and
 *     looks for the snippet in the head. `next/script` can't satisfy that:
 *     `afterInteractive` injects the tag client-side after hydration, and
 *     even `beforeInteractive` — which does land in the server HTML — emits
 *     at the top of `<body>`, so the check still reports it missing.
 *  2. Maze targets studies against the URL of the **top-level window**.
 *     Never inline this into an iframed static prototype: from in there the
 *     URL is the asset path (e.g. `/experiments/foo/a.html`), which no
 *     `/experiments/foo/a` targeting rule will ever match. Loading it on
 *     the real Next route lets Maze see the real app route.
 *  3. Because it lives in the root layout it covers every page — site and
 *     Lab alike. No page should render `<MazeSnippet />` itself.
 */
const MAZE_API_KEY = "10378d98-15ab-41cf-aac4-32036fea7bef";

const MAZE_SNIPPET = `(function (m, a, z, e) {
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
})(window, document, 'https://snippet.maze.co/maze-universal-loader.js', '${MAZE_API_KEY}');`;

export function MazeSnippet() {
  return <script dangerouslySetInnerHTML={{ __html: MAZE_SNIPPET }} />;
}
