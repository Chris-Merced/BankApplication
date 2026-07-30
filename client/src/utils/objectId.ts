const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

export function isObjectId(value: string | undefined): value is string {
  return typeof value === 'string' && OBJECT_ID_PATTERN.test(value);
}

/** Shows the leading half of an account ID and dots the rest. */
export function maskAccountId(accountId: string): string {
  if (accountId.length <= 2) {
    return accountId;
  }

  const visibleDigits = Math.ceil(accountId.length / 2);
  return `${accountId.slice(0, visibleDigits)}${'•'.repeat(accountId.length - visibleDigits)}`;
}
