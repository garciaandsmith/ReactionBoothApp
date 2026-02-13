export const PLANS = {
  free: {
    name: "Free",
    maxReactionsPerDay: 3,
    maxVideoLength: 300, // 5 minutes
    watermark: true,
    linkLifespanDays: 7,
    dashboard: false,
    customBranding: false,
    layouts: ["side-by-side"],
  },
  pro: {
    name: "Pro",
    maxReactionsPerDay: Infinity,
    maxVideoLength: 1800, // 30 minutes
    watermark: false,
    linkLifespanDays: 30,
    dashboard: true,
    customBranding: true,
    layouts: ["side-by-side", "pip", "reaction-only"],
  },
} as const;

export type PlanType = keyof typeof PLANS;

export const LAYOUTS = {
  "side-by-side": "Side by Side",
  pip: "Picture in Picture",
  "reaction-only": "Reaction Only",
} as const;

export type LayoutType = keyof typeof LAYOUTS;
