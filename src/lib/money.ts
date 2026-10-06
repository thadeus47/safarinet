// Prices are stored and charged in KES. USD is display-only, converted at a
// daily rate. Until the FX job exists, the rate comes from the environment.

export const KES_PER_USD = Number(process.env.NEXT_PUBLIC_KES_PER_USD ?? 129);

export function formatKes(amountKes: number): string {
  return `KES ${Math.round(amountKes).toLocaleString("en-KE")}`;
}

export function formatUsd(amountKes: number, rate = KES_PER_USD): string {
  return `US$${Math.round(amountKes / rate).toLocaleString("en-US")}`;
}
