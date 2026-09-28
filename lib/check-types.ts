export type CheckState = "reachable" | "restricted" | "failed" | "error" | "review";
export type CheckResult = {
  id: string; state: CheckState; reason: string; checkedAt: string;
  durationMs: number; statusCode?: number; finalUrl: string; location: string; cached?: boolean;
};
