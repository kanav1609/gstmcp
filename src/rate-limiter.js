import { getRateLimit, upsertRateLimit, resetRateLimit } from './db.js';

const PLAN_LIMITS = {
  free: { count: 10, period: 'day' },
  pro: { count: 1000, period: 'month' },
  business: { count: 5000, period: 'month' }
};

function getPeriodKey(period) {
  const now = new Date();
  if (period === 'day') {
    return now.toISOString().slice(0, 10); // YYYY-MM-DD
  }
  // month
  return now.toISOString().slice(0, 7); // YYYY-MM
}

function getResetAt(period) {
  const now = new Date();
  if (period === 'day') {
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    return tomorrow.toISOString();
  }
  // month: first day of next month
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return nextMonth.toISOString();
}

export function checkRateLimit(apiKey, plan) {
  const planConfig = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  const periodKey = getPeriodKey(planConfig.period);
  const fullPeriodKey = `${planConfig.period}:${periodKey}`;

  const existing = getRateLimit(apiKey, fullPeriodKey);

  if (existing) {
    const resetAt = new Date(existing.reset_at);
    const now = new Date();

    if (now > resetAt) {
      // Period expired, reset
      const newResetAt = getResetAt(planConfig.period);
      resetRateLimit(apiKey, fullPeriodKey, newResetAt);
      return { allowed: true, remaining: planConfig.count - 1, limit: planConfig.count };
    }

    if (existing.call_count >= planConfig.limit) {
      return {
        allowed: false,
        remaining: 0,
        limit: planConfig.count,
        resetAt: existing.reset_at
      };
    }

    upsertRateLimit(apiKey, fullPeriodKey, existing.reset_at);
    return {
      allowed: true,
      remaining: planConfig.count - existing.call_count - 1,
      limit: planConfig.count
    };
  }

  // First call in this period
  const resetAt = getResetAt(planConfig.period);
  upsertRateLimit(apiKey, fullPeriodKey, resetAt);
  return { allowed: true, remaining: planConfig.count - 1, limit: planConfig.count };
}
