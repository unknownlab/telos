const PART = "[a-z][a-z0-9]*(?:-[a-z0-9]+)*";

export const LOCUS_ID_PATTERN: RegExp = new RegExp(`^${PART}:${PART}$`);

export const EXTENSION_ID_PATTERN: RegExp = new RegExp(
  `^${PART}(?:\\.${PART})*$`,
);

export const CAPABILITY_NAME_PATTERN: RegExp = /^[a-z][a-zA-Z0-9]*$/;

export function isLocusId(value: string): boolean {
  return value.length <= 128 && LOCUS_ID_PATTERN.test(value);
}

export function isExtensionId(value: string): boolean {
  return value.length <= 128 && EXTENSION_ID_PATTERN.test(value);
}

export function isCapabilityName(value: string): boolean {
  return value.length <= 64 && CAPABILITY_NAME_PATTERN.test(value);
}

export function capabilityKey(locus: string, capability: string): string {
  return `${locus}#${capability}`;
}

export function parseCapabilityKey(
  key: string,
): { readonly locus: string; readonly capability: string } | null {
  const at = key.lastIndexOf("#");
  if (at <= 0 || at === key.length - 1) return null;
  return { locus: key.slice(0, at), capability: key.slice(at + 1) };
}
