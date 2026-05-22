/**
 * Some browsers cache an old index.html that loads /src/main.jsx.
 * The real entry is main.tsx — this file forwards so the app still boots.
 */
import "./main.tsx";
