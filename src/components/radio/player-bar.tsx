import { Heart, Pause, Play, SkipBack, SkipForward, Loader2 } from "lucide-react";
import { usePlayer } from "./use-radio-player";
import { cn } from "@/lib/utils";

export function PlayerBar() {
  const { current, isPlaying, isLoading, toggle, next, prev, toggleFavorite, isFavorite } =
    usePlayer();

  if (!current) {
    return (
      <div className="rounded-2xl border border-border bg-card/80 backdrop-blur px-4 py-3 text-sm text-muted-foreground">
        Pick a station on the map to start listening
      </div>
    );
  }

  const fav = isFavorite(current.id);

  return (
    <div className="rounded-2xl border border-border bg-card/90 backdrop-blur shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between px-4 pt-3">
        <div className="min-w-0">
          <div className="truncate font-semibold tracking-tight text-foreground">
            {current.title}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {current.placeTitle}
            {current.country && `, ${current.country}`}
          </div>
        </div>
        <button
          onClick={() => toggleFavorite(current)}
          aria-label="Favorite"
          className={cn(
            "rounded-full p-2 transition-colors hover:bg-secondary",
            fav && "text-primary",
          )}
        >
          <Heart className={cn("h-4 w-4", fav && "fill-current")} />
        </button>
      </div>
      <div className="flex items-center justify-center gap-2 px-4 pb-3 pt-2">
        <button
          onClick={prev}
          aria-label="Previous"
          className="rounded-full p-2 text-foreground/80 hover:bg-secondary hover:text-foreground"
        >
          <SkipBack className="h-4 w-4" />
        </button>
        <button
          onClick={toggle}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_0_24px_oklch(0.86_0.24_145/0.55)] transition-transform hover:scale-105"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="ml-0.5 h-5 w-5" />
          )}
        </button>
        <button
          onClick={next}
          aria-label="Next"
          className="rounded-full p-2 text-foreground/80 hover:bg-secondary hover:text-foreground"
        >
          <SkipForward className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}