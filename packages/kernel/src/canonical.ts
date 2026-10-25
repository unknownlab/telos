export const sortKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value !== null && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const copy: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) {
      const member = source[key];
      if (member !== undefined) {
        copy[key] = sortKeys(member);
      }
    }
    return copy;
  }
  return value;
};

export const canonicalJson = (value: unknown): string =>
  String(JSON.stringify(sortKeys(value)));

export const jsonEqual = (a: unknown, b: unknown): boolean =>
  canonicalJson(a) === canonicalJson(b);
