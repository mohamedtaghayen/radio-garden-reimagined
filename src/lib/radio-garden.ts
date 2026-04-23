import { createServerFn } from "@tanstack/react-start";

/**
 * Server-side fetch wrapper that adds a browser User-Agent so we can bypass
 * Cloudflare's bot challenge on radio.garden's public API.
 */
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

async function rgFetch(path: string): Promise<unknown> {
  const url = `https://radio.garden/api/ara/content/${path}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "application/json",
      Referer: "https://radio.garden/",
    },
  });
  if (!res.ok) {
    throw new Error(`Radio Garden API ${res.status} for ${path}`);
  }
  return res.json();
}

export type Place = {
  id: string;
  title: string;
  country: string;
  geo: [number, number]; // [lon, lat]
  size: number;
  url: string;
};

export type Channel = {
  id: string;
  title: string;
  placeTitle: string;
  placeId: string;
  country: string;
  website?: string;
};

function pickChannelId(url: string): string {
  // url looks like "/listen/<slug>/<id>"
  const parts = url.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? url;
}

export const fetchPlaces = createServerFn({ method: "GET" }).handler(
  async (): Promise<Place[]> => {
    const json = (await rgFetch("places")) as {
      data?: { list?: Array<Record<string, unknown>> };
    };
    const list = json?.data?.list ?? [];
    return list.map((p) => ({
      id: String(p.id),
      title: String(p.title),
      country: String(p.country ?? ""),
      geo: p.geo as [number, number],
      size: Number(p.size ?? 1),
      url: String(p.url ?? ""),
    }));
  },
);

export const fetchPlaceChannels = createServerFn({ method: "GET" })
  .inputValidator((d: { placeId: string }) => d)
  .handler(async ({ data }): Promise<Channel[]> => {
    const json = (await rgFetch(`page/${data.placeId}/channels`)) as {
      data?: {
        title?: string;
        content?: Array<{ items?: Array<{ page?: Record<string, unknown> }> }>;
      };
    };
    const placeTitle = json?.data?.title ?? "";
    const items =
      json?.data?.content?.flatMap((b) => b.items ?? []).map((i) => i.page) ??
      [];
    return items
      .filter(Boolean)
      .map((p) => {
        const page = p as Record<string, unknown>;
        const placeBlock = page.place as { id?: string; title?: string };
        const country = page.country as { title?: string };
        return {
          id: pickChannelId(String(page.url ?? "")),
          title: String(page.title ?? "Untitled"),
          placeId: String(placeBlock?.id ?? data.placeId),
          placeTitle: String(placeBlock?.title ?? placeTitle),
          country: String(country?.title ?? ""),
          website: page.website ? String(page.website) : undefined,
        };
      });
  });

export type SearchHit = Channel;

export const searchStations = createServerFn({ method: "GET" })
  .inputValidator((d: { q: string }) => d)
  .handler(async ({ data }): Promise<SearchHit[]> => {
    if (!data.q.trim()) return [];
    const json = (await rgFetch(
      `secure/search?q=${encodeURIComponent(data.q)}`,
    )) as {
      data?: {
        content?: Array<{
          itemsType?: string;
          items?: Array<{ page?: Record<string, unknown> }>;
        }>;
      };
    };
    const blocks = json?.data?.content ?? [];
    const channelBlocks = blocks.filter((b) => b.itemsType === "channel");
    const items = channelBlocks
      .flatMap((b) => b.items ?? [])
      .map((i) => i.page);
    return items.filter(Boolean).map((p) => {
      const page = p as Record<string, unknown>;
      const placeBlock = page.place as { id?: string; title?: string };
      const country = page.country as { title?: string };
      return {
        id: pickChannelId(String(page.url ?? "")),
        title: String(page.title ?? "Untitled"),
        placeId: String(placeBlock?.id ?? ""),
        placeTitle: String(placeBlock?.title ?? ""),
        country: String(country?.title ?? ""),
        website: page.website ? String(page.website) : undefined,
      };
    });
  });

/**
 * Same-origin stream URL. We proxy through our own server route so the browser
 * isn't blocked by Cloudflare/CORS on the upstream audio.
 */
export function streamUrl(channelId: string): string {
  return `/api/stream/${channelId}`;
}