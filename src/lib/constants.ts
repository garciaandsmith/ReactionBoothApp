import type { WatchLayout } from "./types";

export const PLANS = {
  free: {
    name: "Free",
    maxReactionsPerDay: 3,
    maxVideoLength: 300, // 5 minutes
    watermark: true,
    linkLifespanDays: 7,
    dashboard: false,
    customBranding: false,
    layouts: ["pip-bottom-right", "side-by-side", "stacked"] as WatchLayout[],
    downloadBurnsAfterUse: true,
  },
  pro: {
    name: "Pro",
    maxReactionsPerDay: Infinity,
    maxVideoLength: 1800, // 30 minutes
    watermark: false,
    linkLifespanDays: 30,
    dashboard: true,
    customBranding: true,
    layouts: [
      "pip-bottom-right",
      "pip-bottom-left",
      "pip-top-right",
      "pip-top-left",
      "side-by-side",
      "stacked",
    ] as WatchLayout[],
    downloadBurnsAfterUse: false,
  },
} as const;

export type PlanType = keyof typeof PLANS;

export const LAYOUTS: Record<WatchLayout, string> = {
  "pip-bottom-right": "PiP Bottom Right",
  "pip-bottom-left": "PiP Bottom Left",
  "pip-top-right": "PiP Top Right",
  "pip-top-left": "PiP Top Left",
  "side-by-side": "Side by Side",
  "stacked": "Stacked",
};

export const ALL_LAYOUTS = Object.keys(LAYOUTS) as WatchLayout[];

export type LayoutType = keyof typeof LAYOUTS;
