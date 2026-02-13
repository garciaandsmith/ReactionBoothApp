const rateMap = new Map<string, { count: number; resetAt: number }>();

const FREE_DAILY_LIMIT = 3;

export function checkRateLimit(
  key: string,
  plan: string
): { allowed: boolean; remaining: number } {
  if (plan === "pro") {
    return { allowed: true, remaining: Infinity };
  }

  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, {
      count: 1,
      resetAt: now + 24 * 60 * 60 * 1000,
    });
    return { allowed: true, remaining: FREE_DAILY_LIMIT - 1 };
  }

  if (entry.count >= FREE_DAILY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: FREE_DAILY_LIMIT - entry.count };
}
