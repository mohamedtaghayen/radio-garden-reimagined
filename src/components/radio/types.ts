import type { Channel } from "@/lib/radio-garden";

export type Favorite = Channel;

export type PlayerState = {
  current: Channel | null;
  queue: Channel[];
  isPlaying: boolean;
};