export const PLANS = {
  free: {
    name: "Free",
    maxReactionsPerDay: 3,
    maxVideoLength: 300, // 5 minutes
    watermark: true,
    linkLifespanDays: 7,
    dashboard: false,
    customBranding: false,
    layouts: ["pip-desktop"] as const,
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
    layouts: ["pip-desktop", "stacked-mobile"] as const,
    downloadBurnsAfterUse: false,
  },
} as const;

export type PlanType = keyof typeof PLANS;

export const LAYOUTS = {
  "pip-desktop": "Desktop (Picture in Picture)",
  "stacked-mobile": "Mobile (Stacked)",
} as const;

export type LayoutType = keyof typeof LAYOUTS;
