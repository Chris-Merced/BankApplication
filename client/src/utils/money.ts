// Balances are integer cents everywhere — dollars only exist at the edges,
// where a user reads or types them.

export function formatCurrency(amountCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amountCents / 100);
}

/**
 * Converts what a user typed into an amount field into integer cents.
 *
 * Returns null for anything that is not a well-formed positive amount, so a
 * half-typed value ("", "12.") is treated the same as an invalid one and the
 * caller can simply keep the submit button disabled. Parsing is done on the
 * digit string rather than by multiplying a float, so "0.29" cannot land on
 * 28 cents through binary rounding.
 */
export function parseDollarsToCents(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return null;
  }
  const [dollars, fraction = ''] = trimmed.split('.');
  const cents = Number(dollars) * 100 + Number(fraction.padEnd(2, '0'));
  return cents > 0 ? cents : null;
}
