/** Simulated network latency so loading states are visible in the demo. */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function jitter(base: number, spread = 0.4): number {
  return Math.round(base * (1 - spread / 2 + Math.random() * spread));
}
