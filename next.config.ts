import type { NextConfig } from "next";
import { SupabasePaths } from "./lib/constants/supabase-storage";

// Dynamically construct an allow‑list of origins for Server Actions so that
// development inside GitHub Codespaces (or other remote containers) where the
// browser Origin might be `localhost:3000` while the forwarded host is
// `<workspace>-3000.app.github.dev` does not trigger the host / origin mismatch
// protection. In production you should replace this with your real public
// domains only.
const codespacesDomain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;
const codespaceName = process.env.CODESPACE_NAME;
const codespaceForwardedHost =
  codespacesDomain && codespaceName
    ? `${codespaceName}-3000.${codespacesDomain}`
    : undefined; // e.g. animated-fishstick-5xrvgv5r7vvh4pxp-3000.app.github.dev

// Optionally allow explicit host override via env (set NEXT_PUBLIC_SITE_HOST to e.g. "my-custom.dev.local:3000")
const extraHost = process.env.NEXT_PUBLIC_SITE_HOST;

// Build allow list (wildcards supported). Use "*" only for local dev when necessary.
const devAllowedOrigins = [
  "localhost:3000",
  "localhost:3001",
  "127.0.0.1:3000",
  "[::1]:3000",
  "*.app.github.dev",
];
if (codespaceForwardedHost) devAllowedOrigins.push(codespaceForwardedHost);
if (extraHost) devAllowedOrigins.push(extraHost);

// If explicitly opted in to permissive mode (e.g. set ALLOW_ALL_ORIGINS=1) keep simple.
const allowAll = process.env.ALLOW_ALL_ORIGINS === "1";

const nextConfig: NextConfig = {
  serverActions: {
    // For development we relax to "*" to avoid host/origin mismatch headaches in
    // Codespaces / remote dev. In production tighten this via env or explicit list.
    allowedOrigins:
      process.env.NODE_ENV !== "production" || allowAll
        ? ["*"]
        : devAllowedOrigins,
  },
  images: {
    remotePatterns: [
      new URL(`${SupabasePaths.IMAGES}/**`),
      new URL(`https://lh3.googleusercontent.com/**`),
      new URL(`https://avatars.githubusercontent.com/**`),
    ],
  },
};

export default nextConfig;
