export const plans = {
  FREE: { branches: 1, customers: 100, programs: 1, campaigns: 1, analytics: "basic" },
  STARTER: { branches: 2, customers: 1000, programs: 5, campaigns: 5, analytics: "basic" },
  PRO: { branches: 5, customers: 10000, programs: 20, campaigns: 20, analytics: "advanced" },
  BUSINESS: { branches: 25, customers: 100000, programs: 100, campaigns: 100, analytics: "advanced" }
};
export function can(plan, feature, current=0) {
  const p=plans[plan]||plans.FREE;
  if (!(feature in p)) return false;
  if (typeof p[feature] === "number") return current < p[feature];
  return true;
}
