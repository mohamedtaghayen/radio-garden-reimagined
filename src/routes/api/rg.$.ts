import { createFileRoute } from "@tanstack/react-router";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

/**
 * Proxies requests to https://radio.garden/api/ara/content/<splat>
 * Bypasses Cloudflare's UA check and CORS for browser-side fetches.
 */
export const Route = createFileRoute("/api/rg/$")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const splat = params._splat ?? "";
        const url = new URL(request.url);
        const target = `https://radio.garden/api/ara/content/${splat}${url.search}`;
        try {
          const upstream = await fetch(target, {
            headers: {
              "User-Agent": UA,
              Accept: "application/json,*/*",
              Referer: "https://radio.garden/",
            },
            redirect: "follow",
          });
          const body = await upstream.text();
          return new Response(body, {
            status: upstream.status,
            headers: {
              "Content-Type":
                upstream.headers.get("content-type") ?? "application/json",
              "Cache-Control": "public, max-age=300",
              "Access-Control-Allow-Origin": "*",
            },
          });
        } catch (err) {
          return new Response(
            JSON.stringify({ error: "proxy_failed", message: String(err) }),
            { status: 502, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});