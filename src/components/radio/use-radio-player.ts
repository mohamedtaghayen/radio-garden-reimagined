import { create } from "zustand";
import type { Channel } from "@/lib/radio-garden";
import { streamUrl } from "@/lib/radio-garden";

type PlayerStore = {
  current: Channel | null;
  queue: Channel[];
  isPlaying: boolean;
  isLoading: boolean;
  favorites: Channel[];
  audio: HTMLAudioElement | null;

  init: () => void;
  setQueue: (queue: Channel[], startId?: string) => void;
  play: (channel: Channel, queue?: Channel[]) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  toggleFavorite: (channel: Channel) => void;
  isFavorite: (id: string) => boolean;
};

const FAV_KEY = "rg.favorites.v1";

function loadFavorites(): Channel[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FAV_KEY);
    return raw ? (JSON.parse(raw) as Channel[]) : [];
  } catch {
    return [];
  }
}

function saveFavorites(favs: Channel[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FAV_KEY, JSON.stringify(favs));
  } catch {
    /* ignore */
  }
}

export const usePlayer = create<PlayerStore>((set, get) => ({
  current: null,
  queue: [],
  isPlaying: false,
  isLoading: false,
  favorites: [],
  audio: null,

  init: () => {
    if (typeof window === "undefined") return;
    if (get().audio) return;
    const audio = new Audio();
    audio.preload = "none";
    audio.crossOrigin = "anonymous";
    audio.addEventListener("playing", () =>
      set({ isPlaying: true, isLoading: false }),
    );
    audio.addEventListener("waiting", () => set({ isLoading: true }));
    audio.addEventListener("pause", () => set({ isPlaying: false }));
    audio.addEventListener("error", () =>
      set({ isLoading: false, isPlaying: false }),
    );
    set({ audio, favorites: loadFavorites() });
  },

  setQueue: (queue, startId) => {
    const start = startId ? queue.find((c) => c.id === startId) ?? null : null;
    set({ queue, current: start ?? get().current });
  },

  play: (channel, queue) => {
    const { audio } = get();
    if (!audio) return;
    set({
      current: channel,
      queue: queue ?? get().queue.length ? get().queue : [channel],
      isLoading: true,
    });
    audio.src = streamUrl(channel.id);
    audio.play().catch(() => set({ isLoading: false, isPlaying: false }));
  },

  toggle: () => {
    const { audio, current, isPlaying } = get();
    if (!audio || !current) return;
    if (isPlaying) {
      audio.pause();
    } else {
      if (!audio.src) audio.src = streamUrl(current.id);
      audio.play().catch(() => set({ isLoading: false, isPlaying: false }));
    }
  },

  next: () => {
    const { queue, current, play } = get();
    if (!current || queue.length === 0) return;
    const idx = queue.findIndex((c) => c.id === current.id);
    const nxt = queue[(idx + 1) % queue.length];
    play(nxt, queue);
  },

  prev: () => {
    const { queue, current, play } = get();
    if (!current || queue.length === 0) return;
    const idx = queue.findIndex((c) => c.id === current.id);
    const prv = queue[(idx - 1 + queue.length) % queue.length];
    play(prv, queue);
  },

  toggleFavorite: (channel) => {
    const favs = get().favorites;
    const exists = favs.some((f) => f.id === channel.id);
    const next = exists
      ? favs.filter((f) => f.id !== channel.id)
      : [channel, ...favs];
    saveFavorites(next);
    set({ favorites: next });
  },

  isFavorite: (id) => get().favorites.some((f) => f.id === id),
}));