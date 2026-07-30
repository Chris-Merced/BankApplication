const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

export function isObjectId(value: string | undefined): value is string {
  return typeof value === 'string' && OBJECT_ID_PATTERN.test(value);
}
