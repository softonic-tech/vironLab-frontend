import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv, type Plugin } from "vite"

/** SPA fallback for BrowserRouter deep links (dev + preview). Runs after Vite internals. */
function spaHtmlFallback(): Plugin {
  const shouldFallback = (pathname: string) => {
    if (!pathname || pathname === "/" || pathname === "/index.html") return false
    if (pathname.startsWith("/@") || pathname.startsWith("/src") || pathname.startsWith("/node_modules")) return false
    if (pathname.startsWith("/api") || pathname.startsWith("/assets")) return false
    const base = pathname.split("/").pop() ?? ""
    if (base.includes(".")) return false
    return true
  }
  const middleware = (
    req: { method?: string; url?: string; headers: Record<string, string | undefined> },
    _res: unknown,
    next: () => void,
  ) => {
    if (req.method !== "GET") return next()
    const raw = req.url ?? ""
    const pathname = raw.split("?")[0] ?? ""
    const accept = req.headers.accept ?? ""
    if (!accept.includes("text/html")) return next()
    // Prefer real navigations (avoids rewriting odd tool requests that still send text/html).
    const mode = req.headers["sec-fetch-mode"]
    if (mode && mode !== "navigate") return next()
    if (!shouldFallback(pathname)) return next()
    req.url = "/index.html"
    next()
  }
  return {
    name: "spa-html-fallback",
    configureServer(server) {
      return () => {
        server.middlewares.use(middleware)
      }
    },
    configurePreviewServer(server) {
      return () => {
        server.middlewares.use(middleware)
      }
    },
  }
}

function isReactCorePkg(id: string): boolean {
  // Rollup uses `/` in resolved ids even on Windows.
  return (
    id.includes("/node_modules/react-dom/") ||
    id.includes("/node_modules/react/") ||
    id.includes("/node_modules/scheduler/") ||
    id.endsWith("/node_modules/react-dom") ||
    id.endsWith("/node_modules/react") ||
    id.endsWith("/node_modules/scheduler")
  )
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  const devResendProxy =
    mode === "development" && env.VITE_RESEND_API_KEY
      ? {
          "/api/resend/emails": {
            target: "https://api.resend.com",
            changeOrigin: true,
            rewrite: () => "/emails",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            configure(proxy: any) {
              proxy.on("proxyReq", (proxyReq: { setHeader: (k: string, v: string) => void }) => {
                proxyReq.setHeader("Authorization", `Bearer ${env.VITE_RESEND_API_KEY}`)
              })
            },
          },
        }
      : undefined

  return {
    // `/` so JS/CSS resolve on deep routes (e.g. `/checkout/success`) with BrowserRouter.
    base: "/",
    plugins: [react(), spaHtmlFallback()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: devResendProxy ? { proxy: devResendProxy } : undefined,
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (!id.includes("node_modules")) return

            // Router stack — match before react substring checks.
            if (id.includes("react-router") || id.includes("/history")) return "router"

            /** React core only. Avoid `id.includes("react")`: it wrongly grabs `@radix-ui/react-*`,
             * `lucide-react`, `@stripe/react-stripe-js`, etc., which then pull `clsx`/others into the
             * same chunk while still importing them from `vendor` → circular chunk → `React` undefined at runtime.
             */
            if (isReactCorePkg(id)) return "react"

            if (id.includes("@supabase/supabase-js")) return "supabase"
            if (id.includes("@radix-ui")) return "radix"
            if (id.includes("lucide-react")) return "icons"
            if (id.includes("gsap")) return "gsap"
            if (id.includes("recharts")) return "charts"
            return "vendor"
          },
        },
      },
    },
  }
})
