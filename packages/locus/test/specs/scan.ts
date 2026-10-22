// START_MODULE_CONTRACT
//   PURPOSE: Scan TypeScript source text and package manifests for imports and uses that the core and portability rules forbid.
//   SCOPE: Pure text functions used by core-independence.test.ts and portability.test.ts. Out: full TypeScript parsing; the scan is a deliberate approximation.
//   DEPENDS: none
//   LINKS: M-LOCUS-SPECS
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   forbiddenCoreImports - module specifiers that the core package may not import
//   forbiddenRuntimeUses - runtime-specific module specifiers and identifiers that the portable source may not use
//   forbiddenDependencies - package names in a manifest that the core package may not depend on
//   forbiddenBundleReferences - node: and bun: module references left in built browser output
//   stringEnd - index just after a string literal, so quotes inside strings are not read as code
//   stripText - removes comments, and optionally string contents, without parsing TypeScript
//   SPECIFIER_PATTERNS - import, export-from, dynamic import and require forms
//   moduleSpecifiers - module specifiers in source order
//   isForbiddenPackage - the spec package, bun:test, Playwright and test runners
//   isRuntimeSpecifier - bun, bun:* and node:* specifiers
//   RUNTIME_IDENTIFIERS - process., Buffer and Bun. identifiers
//   BUNDLE_MODULE_REFERENCE - import, require and dynamic import of node: or bun: in built output
// END_MODULE_MAP

// START_CONTRACT: stringEnd
//   PURPOSE: Find where a string literal ends so that quote characters inside it are not read as code.
//   INPUTS: { source: string - the text; start: number - index of the opening quote }
//   OUTPUTS: { number - index just after the closing quote; the line break for an unterminated " or ' string; the end of text otherwise }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-SPECS
// END_CONTRACT: stringEnd
/** Index just after a string literal. Single-line strings end at the line break. */
const stringEnd = (source: string, start: number): number => {
  const quote = source.charAt(start);
  let i = start + 1;
  while (i < source.length) {
    const ch = source.charAt(i);
    if (ch === "\\") {
      i += 2;
      continue;
    }
    if (ch === quote) {
      return i + 1;
    }
    if (ch === "\n" && quote !== "`") {
      return i;
    }
    i += 1;
  }
  return source.length;
};

// START_CONTRACT: stripText
//   PURPOSE: Remove comments from source text, and optionally the contents of string literals, without parsing TypeScript.
//   INPUTS: { source: string - TypeScript text; strings: "keep" | "blank" - keep string literals as written, or empty them to quotes }
//   OUTPUTS: { string - the text with every comment replaced by spaces and line breaks kept }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-SPECS
// END_CONTRACT: stripText
/** Removes `//` and block comments. Quotes inside strings are never read as comments. */
const stripText = (source: string, strings: "keep" | "blank"): string => {
  let out = "";
  let i = 0;
  while (i < source.length) {
    const ch = source.charAt(i);
    const next = source.charAt(i + 1);
    if (ch === "/" && next === "/") {
      const end = source.indexOf("\n", i);
      i = end === -1 ? source.length : end;
      out += " ";
    } else if (ch === "/" && next === "*") {
      const end = source.indexOf("*/", i + 2);
      const stop = end === -1 ? source.length : end + 2;
      out += source.slice(i, stop).replace(/[^\n]/g, " ");
      i = stop;
    } else if (ch === '"' || ch === "'" || ch === "`") {
      const stop = stringEnd(source, i);
      out += strings === "keep" ? source.slice(i, stop) : `${ch}${ch}`;
      i = stop;
    } else {
      out += ch;
      i += 1;
    }
  }
  return out;
};

// Import, export-from, dynamic import and require forms. Group 1 is the specifier.
// A specifier may be quoted with ", ' or a template literal (backtick), since
// import(`node:fs`) and require(`node:fs`) are valid JavaScript.
const SPECIFIER_PATTERNS: ReadonlyArray<RegExp> = [
  /\b(?:import|export)\b[^;"'`]*?\bfrom\s*["'`]([^"'`\n]+)["'`]/g,
  /\bimport\s*\(?\s*["'`]([^"'`\n]+)["'`]/g,
  /\brequire\s*\(\s*["'`]([^"'`\n]+)["'`]\s*\)/g,
];

// START_CONTRACT: moduleSpecifiers
//   PURPOSE: List the module specifiers that code imports, re-exports or requires, in source order.
//   INPUTS: { code: string - text with comments removed and string contents kept }
//   OUTPUTS: { string[] - each specifier once per occurrence, in the order it appears }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-SPECS
// END_CONTRACT: moduleSpecifiers
/** The module specifiers of every import, re-export and require, in source order. */
const moduleSpecifiers = (code: string): string[] => {
  const found: Array<{ at: number; name: string }> = [];
  for (const pattern of SPECIFIER_PATTERNS) {
    for (const match of code.matchAll(pattern)) {
      found.push({ at: match.index ?? 0, name: match[1] ?? "" });
    }
  }
  return found.sort((a, b) => a.at - b.at).map((f) => f.name);
};

// START_CONTRACT: isForbiddenPackage
//   PURPOSE: Decide whether a package name is one the core package may not depend on or import.
//   INPUTS: { name: string - a package name or module specifier }
//   OUTPUTS: { boolean - true for the spec package, bun:test, playwright, vitest, jest, mocha and their scoped forms }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-SPECS
// END_CONTRACT: isForbiddenPackage
/** The spec package, Bun's test module, Playwright, and common test runners. */
const isForbiddenPackage = (name: string): boolean =>
  name === "@telos/locus-specs" ||
  name.startsWith("@telos/locus-specs/") ||
  name === "bun:test" ||
  name === "playwright" ||
  name.startsWith("@playwright/") ||
  name === "vitest" ||
  name === "jest" ||
  name.startsWith("@jest/") ||
  name === "mocha";

// START_CONTRACT: isRuntimeSpecifier
//   PURPOSE: Decide whether a module specifier names a runtime that is not portable.
//   INPUTS: { name: string - a module specifier }
//   OUTPUTS: { boolean - true for "bun", "bun:*" and "node:*" }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-SPECS
// END_CONTRACT: isRuntimeSpecifier
/** Bun or Node built-in specifiers, which a browser bundle cannot use. */
const isRuntimeSpecifier = (name: string): boolean =>
  name === "bun" || name.startsWith("bun:") || name.startsWith("node:");

// Identifiers that only a server runtime provides. Each pattern matches one use.
const RUNTIME_IDENTIFIERS: ReadonlyArray<{ name: string; pattern: RegExp }> = [
  { name: "process", pattern: /\bprocess\./g },
  { name: "Buffer", pattern: /\bBuffer\b/g },
  { name: "Bun", pattern: /\bBun\./g },
];

// START_CONTRACT: forbiddenCoreImports
//   PURPOSE: Report the module specifiers of a source file that the core package may not import.
//   INPUTS: { source: string - the text of one TypeScript file }
//   OUTPUTS: { string[] - each forbidden specifier, in source order; empty when none }
//   SIDE_EFFECTS: none. Comments are ignored.
//   LINKS: M-LOCUS-SPECS
// END_CONTRACT: forbiddenCoreImports
/** Specifiers of imports, re-exports, dynamic imports and requires that the core package must not use. */
export const forbiddenCoreImports = (source: string): string[] =>
  moduleSpecifiers(stripText(source, "keep")).filter(isForbiddenPackage);

// START_CONTRACT: forbiddenRuntimeUses
//   PURPOSE: Report the runtime-specific specifiers and identifiers that the portable source may not use.
//   INPUTS: { source: string - the text of one TypeScript file }
//   OUTPUTS: { string[] - each forbidden specifier, then each forbidden identifier (process, Buffer, Bun); empty when none }
//   SIDE_EFFECTS: none. Comments and string contents are ignored for identifiers.
//   LINKS: M-LOCUS-SPECS
// END_CONTRACT: forbiddenRuntimeUses
/** Bun and Node specifiers, plus identifiers `process.`, `Buffer` and `Bun.` outside comments and strings. */
export const forbiddenRuntimeUses = (source: string): string[] => {
  const specifiers = moduleSpecifiers(stripText(source, "keep")).filter(
    isRuntimeSpecifier,
  );
  const code = stripText(source, "blank");
  const identifiers: string[] = [];
  for (const { name, pattern } of RUNTIME_IDENTIFIERS) {
    identifiers.push(...[...code.matchAll(pattern)].map(() => name));
  }
  return [...specifiers, ...identifiers];
};

// START_CONTRACT: forbiddenDependencies
//   PURPOSE: Report the packages in a manifest that the core package may not depend on.
//   INPUTS: { manifest: object - dependencies, devDependencies and peerDependencies maps, each optional }
//   OUTPUTS: { string[] - each forbidden package name, in the order the maps list them; empty when none }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-SPECS
// END_CONTRACT: forbiddenDependencies
/** Forbidden package names across the three dependency maps of a manifest. */
export const forbiddenDependencies = (manifest: {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}): string[] =>
  [
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
  ].filter(isForbiddenPackage);

// Module references in built output: an import, a require or a dynamic import of a node: or bun: specifier.
const BUNDLE_MODULE_REFERENCE =
  /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)["'`]((?:node|bun):[^"'`\s]*)["'`]/g;

// START_CONTRACT: forbiddenBundleReferences
//   PURPOSE: Report node: and bun: module references that remain in built browser output.
//   INPUTS: { output: string - the text of one built file }
//   OUTPUTS: { string[] - each referenced specifier, in order; empty when none }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-SPECS
// END_CONTRACT: forbiddenBundleReferences
/** node: and bun: specifiers that are imported, required or dynamically imported. Object keys and runtime lookups are not references. */
export const forbiddenBundleReferences = (output: string): string[] =>
  [...output.matchAll(BUNDLE_MODULE_REFERENCE)].map((match) => match[1] ?? "");
