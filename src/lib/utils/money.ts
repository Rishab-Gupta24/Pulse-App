// Money is summed in integer cents to avoid floating-point drift.

/** Largest value a NUMERIC(10, 2) column can hold, in cents. */
const MAX_CENTS = 9_999_999_999;
const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

const numberFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const toCents = (amount: number): number => Math.round(Number(amount) * 100);

export const sumAmounts = (amounts: number[]): number =>
  amounts.reduce((cents, amount) => cents + toCents(amount), 0) / 100;

/**
 * Parses user input like "12", "12.5" or "12,50" into a positive amount with at
 * most two decimals. Returns null when invalid.
 */
export function parseAmount(input: string, { allowZero = false } = {}): number | null {
  const normalized = input.trim().replace(",", ".");
  if (!AMOUNT_PATTERN.test(normalized)) return null;
  const cents = toCents(Number(normalized));
  if (cents > MAX_CENTS || cents < 0 || (!allowZero && cents === 0)) return null;
  return cents / 100;
}

export function formatMoney(amount: number, symbol: string): string {
  return `${symbol}${numberFormat.format(amount)}`;
}
