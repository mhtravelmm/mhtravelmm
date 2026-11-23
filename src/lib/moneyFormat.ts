/**
 * Plan §16B.5 and decision 33: USD keeps 2 decimals, MMK is shown rounded to
 * the nearest 100. One formatter so a rate change never leaves two pages
 * disagreeing about the same amount.
 */

const MMK_STEP = 100;

export function mmkFromUsd(usd: number, mmkPerUsd: number): number {
  return usd * mmkPerUsd;
}

/** Nearest 100 MMK, which is the unit the rate itself is quoted in. */
export function roundMmk(amount: number): number {
  return Math.round(amount / MMK_STEP) * MMK_STEP;
}

export function formatUsd(usd: number): string {
  return `$ ${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatMmk(amount: number): string {
  return `${roundMmk(amount).toLocaleString('en-US')} Ks`;
}

export function formatMoney(usd: number, currency: 'USD' | 'MMK', mmkPerUsd: number): string {
  return currency === 'USD' ? formatUsd(usd) : formatMmk(mmkFromUsd(usd, mmkPerUsd));
}
