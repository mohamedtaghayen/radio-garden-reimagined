import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Compass,
  Heart,
  LayoutList,
  Search as SearchIcon,
  Settings as SettingsIcon,
  X,
  Loader2,
  Play,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  fetchPlaceChannels,
  searchStations,
  type Channel,
  type Place,
} from "@/lib/radio-garden";
import { usePlayer } from "./use-radio-player";
import { cn } from "@/lib/utils";

type Tab = "explore" | "favorites" | "browse" | "search" | "settings";

const tabs: { id: Tab; label: string; icon: typeof Compass }[] = [
  { id: "explore", label: "Explore", icon: Compass },
  { id: "favorites", label: "Favorites", icon: Heart },
  { id: "browse", label: "Browse", icon: LayoutList },
  { id: "search", label: "Search", icon: SearchIcon },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export function SidePanel({
  places,
  selectedPlace,
  onSelectPlace,
  onClearPlace,
  collapsed,
  onToggleCollapsed,
}: {
  places: Place[];
  selectedPlace: Place | null;
  onSelectPlace: (place: Place) => void;
  onClearPlace: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const [tab, setTab] = useState<Tab>("explore");

  // When a place is picked, snap to Explore so the user sees its stations
  useEffect(() => {
    if (selectedPlace) {
      setTab("explore");
    }
  }, [selectedPlace]);

  if (collapsed) {
    return (
      <button
        onClick={onToggleCollapsed}
        className="flex h-full w-10 flex-col items-center justify-center gap-2 border-r border-border bg-card text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground"
        aria-label="Open stations panel"
      >
        <ChevronRight className="h-4 w-4" />
        <span className="rotate-180 text-[10px] font-semibold uppercase tracking-[0.3em] [writing-mode:vertical-rl]">
          Stations
        </span>
      </button>
    );
  }

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-r border-border bg-card shadow-[4px_0_24px_rgba(15,23,42,0.06)] sm:w-96">
      <Header onCollapse={onToggleCollapsed} />
      <Tabs tab={tab} onChange={setTab} />
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="p-3"
                >
                  {tab === "explore" && (
                    <ExploreTab
                      place={selectedPlace}
                      onClearPlace={onClearPlace}
                      places={places}
                      onSelectPlace={onSelectPlace}
                    />
                  )}
                  {tab === "favorites" && <FavoritesTab />}
                  {tab === "browse" && (
                    <BrowseTab places={places} onSelectPlace={onSelectPlace} />
                  )}
                  {tab === "search" && <SearchTab />}
                  {tab === "settings" && <SettingsTab />}
                </motion.div>
        </AnimatePresence>
      </div>
    </aside>
  );
}

function Header({
  onCollapse,
}: {
  onCollapse: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground shadow-md">
          <Play className="ml-0.5 h-3.5 w-3.5" />
        </span>
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-tight">Radio Garden</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Listen to the world
          </div>
        </div>
      </div>
      <button
        onClick={onCollapse}
        className="rounded-full p-1.5 text-foreground/70 hover:bg-secondary hover:text-foreground"
        aria-label="Collapse panel"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
    </div>
  );
}

function Tabs({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="flex items-stretch border-b border-border">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={cn(
            "flex-1 px-2 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground transition-colors",
            "hover:text-foreground",
            tab === id &&
              "text-primary border-b-2 border-primary -mb-px",
          )}
        >
          <Icon className="mx-auto mb-0.5 h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}

function StationRow({
  channel,
  queue,
}: {
  channel: Channel;
  queue: Channel[];
}) {
  const { play, current, isPlaying, toggleFavorite, isFavorite } = usePlayer();
  const isCurrent = current?.id === channel.id;
  const fav = isFavorite(channel.id);

  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-lg px-2 py-2 transition-colors",
        isCurrent ? "bg-secondary" : "hover:bg-secondary/60",
      )}
    >
      <button
        onClick={() => play(channel, queue)}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/15 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
        aria-label={`Play ${channel.title}`}
      >
        <Play className="ml-0.5 h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => play(channel, queue)}
        className="min-w-0 flex-1 text-left"
      >
        <div
          className={cn(
            "truncate text-sm",
            isCurrent ? "font-semibold text-primary" : "font-medium",
          )}
        >
          {channel.title}
          {isCurrent && isPlaying && (
            <span className="ml-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary align-middle" />
          )}
        </div>
        {channel.placeTitle && (
          <div className="truncate text-[11px] text-muted-foreground">
            {channel.placeTitle}
            {channel.country && `, ${channel.country}`}
          </div>
        )}
      </button>
      <button
        onClick={() => toggleFavorite(channel)}
        className={cn(
          "rounded-full p-1.5 text-muted-foreground hover:text-primary",
          fav && "text-primary",
        )}
        aria-label="Favorite"
      >
        <Heart className={cn("h-3.5 w-3.5", fav && "fill-current")} />
      </button>
    </div>
  );
}

function ExploreTab({
  place,
  onClearPlace,
  places,
  onSelectPlace,
}: {
  place: Place | null;
  onClearPlace: () => void;
  places: Place[];
  onSelectPlace: (place: Place) => void;
}) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const setQueue = usePlayer((s) => s.setQueue);

  useEffect(() => {
    if (!place) {
      setChannels([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchPlaceChannels({ data: { placeId: place.id } })
      .then((res) => {
        if (cancelled) return;
        setChannels(res);
        setQueue(res);
      })
      .catch(() => !cancelled && setChannels([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [place, setQueue]);

  if (!place) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Tap a glowing dot on the map to explore stations from that city.
        </p>
        <div>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Popular places
          </h3>
          <div className="space-y-1">
            {[...places]
              .sort((a, b) => b.size - a.size)
              .slice(0, 12)
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => onSelectPlace(p)}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left hover:bg-secondary/60"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    {p.title}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {p.size} {p.size === 1 ? "station" : "stations"}
                  </span>
                </button>
              ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Stations in
          </div>
          <h2 className="text-lg font-bold tracking-tight">{place.title}</h2>
          <div className="text-xs text-muted-foreground">{place.country}</div>
        </div>
        <button
          onClick={onClearPlace}
          className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label="Back"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : channels.length === 0 ? (
        <div className="py-6 text-center text-sm text-muted-foreground">
          No stations found.
        </div>
      ) : (
        <div className="space-y-1">
          {channels.map((c) => (
            <StationRow key={c.id} channel={c} queue={channels} />
          ))}
        </div>
      )}
    </div>
  );
}

function FavoritesTab() {
  const favorites = usePlayer((s) => s.favorites);
  if (favorites.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        <Heart className="mx-auto mb-2 h-5 w-5 opacity-60" />
        Your favorites live here. Tap the heart on any station.
      </div>
    );
  }
  return (
    <div className="space-y-1">
      {favorites.map((c) => (
        <StationRow key={c.id} channel={c} queue={favorites} />
      ))}
    </div>
  );
}

function BrowseTab({
  places,
  onSelectPlace,
}: {
  places: Place[];
  onSelectPlace: (place: Place) => void;
}) {
  const [country, setCountry] = useState<string | null>(null);

  const countries = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of places) {
      if (!p.country) continue;
      m.set(p.country, (m.get(p.country) ?? 0) + p.size);
    }
    return [...m.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [places]);

  const cities = useMemo(() => {
    if (!country) return [];
    return places
      .filter((p) => p.country === country)
      .sort((a, b) => b.size - a.size);
  }, [places, country]);

  if (country) {
    return (
      <div>
        <button
          onClick={() => setCountry(null)}
          className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          ← All countries
        </button>
        <h3 className="mb-2 text-base font-bold">{country}</h3>
        <div className="space-y-1">
          {cities.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectPlace(p)}
              className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left hover:bg-secondary/60"
            >
              <span className="text-sm">{p.title}</span>
              <span className="text-[11px] text-muted-foreground">
                {p.size}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Countries
      </h3>
      <div className="space-y-1">
        {countries.map((c) => (
          <button
            key={c.name}
            onClick={() => setCountry(c.name)}
            className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left hover:bg-secondary/60"
          >
            <span className="text-sm">{c.name}</span>
            <span className="text-[11px] text-muted-foreground">{c.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SearchTab() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(() => {
      searchStations({ data: { q } })
        .then((res) => !cancelled && setResults(res))
        .catch(() => !cancelled && setResults([]))
        .finally(() => !cancelled && setLoading(false));
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search stations, cities, genres…"
          className="w-full rounded-full border border-border bg-input/40 py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>
      {loading && (
        <div className="flex justify-center py-4 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      )}
      {!loading && results.length === 0 && q.trim() && (
        <div className="py-4 text-center text-sm text-muted-foreground">
          No matches.
        </div>
      )}
      <div className="space-y-1">
        {results.map((c) => (
          <StationRow key={c.id} channel={c} queue={results} />
        ))}
      </div>
    </div>
  );
}

function SettingsTab() {
  return (
    <div className="space-y-4 text-sm">
      <div>
        <h3 className="mb-1 font-semibold">About</h3>
        <p className="text-muted-foreground">
          A loving clone of Radio Garden — tune in to live radio from every
          corner of the world. Stations and metadata are powered by the public
          radio.garden API.
        </p>
      </div>
      <div className="rounded-lg border border-border bg-secondary/40 p-3">
        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Tip
        </h4>
        <p className="text-muted-foreground">
          Use <span className="text-foreground">Browse</span> to dive in by
          country, or <span className="text-foreground">Search</span> by name.
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        Built with TanStack Start · React Leaflet · Framer Motion
      </p>
    </div>
  );
}