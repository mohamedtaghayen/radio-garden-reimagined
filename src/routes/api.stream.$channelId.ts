import { createFileRoute } from "@tanstack/react-router";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

/**
 * Proxies the Radio Garden audio stream so the browser can play it without
 * being blocked by Cloudflare's bot challenge or CORS.
 *
 * Radio Garden's `/listen/<id>/channel.mp3` returns a 302 to the upstream
 * stream. We follow it server-side and pipe the bytes back to the client.
 */
export const Route = createFileRoute("/api/stream/$channelId")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const { channelId } = params;
        if (!/^[a-zA-Z0-9_-]{4,32}$/.test(channelId)) {
          return new Response("Bad channel id", { status: 400 });
        }

        const upstreamUrl = `https://radio.garden/api/ara/content/listen/${channelId}/channel.mp3`;

        const range = request.headers.get("range");
        const headers: Record<string, string> = {
          "User-Agent": UA,
          Accept: "*/*",
          Referer: "https://radio.garden/",
        };
        if (range) headers["Range"] = range;

        let res: Response;
        try {
          res = await fetch(upstreamUrl, {
            method: "GET",
            headers,
            redirect: "follow",
          });
        } catch {
          return new Response("Upstream unreachable", { status: 502 });
        }

        if (!res.ok && res.status !== 206) {
          return new Response(`Upstream ${res.status}`, { status: 502 });
        }

        const out = new Headers();
        const passthrough = [
          "content-type",
          "content-length",
          "accept-ranges",
          "content-range",
          "cache-control",
        ];
        for (const k of passthrough) {
          const v = res.headers.get(k);
          if (v) out.set(k, v);
        }
        if (!out.has("content-type")) out.set("content-type", "audio/mpeg");
        out.set("access-control-allow-origin", "*");

        return new Response(res.body, {
          status: res.status,
          headers: out,
        });
      },
    },
  },
});