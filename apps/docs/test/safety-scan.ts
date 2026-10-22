// START_MODULE_CONTRACT
//   PURPOSE: Find the constructs that C-002 forbids in the docs site sources, so that the playground safety test can prove that user text never runs as code and never becomes raw HTML.
//   SCOPE: stripComments, siteViolations and playgroundViolations, pure text functions. Out: full TypeScript parsing; the scan is a deliberate approximation that is proven by playground-safety.test.ts.
//   DEPENDS: none
//   LINKS: V-M-DOCS-PLAYGROUND
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   stripComments - removes // and /* */ comments outside string literals
//   stringEnd - index just after a string or template literal, so that comment marks inside it are not read as comments
//   stripComments - removes // and /* */ comments outside string literals
//   SITE_PATTERNS - the constructs forbidden anywhere in apps/docs/src
//   PLAYGROUND_PATTERNS - the constructs forbidden additionally in apps/docs/src/playground
//   namesFound - the names of the constructs in a pattern list that a source text uses, without comments
//   siteViolations - the names of the site constructs found in a source text
//   playgroundViolations - the site constructs plus the playground constructs found in a source text
// END_MODULE_MAP

// START_CONTRACT: stringEnd
//   PURPOSE: Find where a string literal ends, so that a comment mark inside a string is not treated as a comment.
//   INPUTS: { source: string - the text; start: number - the index of the opening quote }
//   OUTPUTS: { number - the index just after the closing quote; the line break for an unterminated " or ' string; the end of text when a template literal is unterminated }
//   SIDE_EFFECTS: none
//   LINKS: V-M-DOCS-PLAYGROUND
// END_CONTRACT: stringEnd
function stringEnd(source: string, start: number): number {
  const quote = source[start];
  let i = start + 1;
  while (i < source.length) {
    const ch = source[i];
    if (ch === "\\") {
      i += 2;
      continue;
    }
    if (ch === quote) return i + 1;
    if (ch === "\n" && quote !== "`") return i;
    i += 1;
  }
  return source.length;
}

// START_CONTRACT: stripComments
//   PURPOSE: Remove comments so that a construct named in a comment is not reported as code; string contents are kept, so that a construct inside a string still counts.
//   INPUTS: { source: string - TypeScript or TSX source text }
//   OUTPUTS: { string - the source with // and /* */ comments removed; a line comment keeps its line break }
//   SIDE_EFFECTS: none
//   LINKS: V-M-DOCS-PLAYGROUND
// END_CONTRACT: stripComments
export function stripComments(source: string): string {
  let out = "";
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    const next = source[i + 1];
    if (ch === '"' || ch === "'" || ch === "`") {
      const end = stringEnd(source, i);
      out += source.slice(i, end);
      i = end;
    } else if (ch === "/" && next === "/") {
      const newline = source.indexOf("\n", i);
      i = newline === -1 ? source.length : newline;
    } else if (ch === "/" && next === "*") {
      const close = source.indexOf("*/", i + 2);
      i = close === -1 ? source.length : close + 2;
    } else {
      out += ch;
      i += 1;
    }
  }
  return out;
}

const SITE_PATTERNS: ReadonlyArray<readonly [string, RegExp]> = [
  ["eval(", /\beval\s*\(/],
  ["new Function", /\bnew\s+Function\b/],
  ["Function(", /\bFunction\s*\(/],
  [
    "setTimeout or setInterval with a string",
    /\bset(?:Timeout|Interval)\s*\(\s*["'`]/,
  ],
  ["import() of a non-literal module name", /\bimport\s*\((?!\s*["'])/],
];

const PLAYGROUND_PATTERNS: ReadonlyArray<readonly [string, RegExp]> = [
  ["innerHTML", /\binnerHTML\b/],
  ["outerHTML", /\bouterHTML\b/],
  ["insertAdjacentHTML", /\binsertAdjacentHTML\b/],
  ["dangerouslySetInnerHTML", /\bdangerouslySetInnerHTML\b/],
  ["document.write", /\bdocument\.write\b/],
  [
    "createElement of a script or iframe",
    /\bcreateElement\(\s*["'](?:script|iframe)/,
  ],
  ["a script tag", /<script\b/i],
  ["srcdoc", /\bsrcdoc\b/],
  ["import()", /\bimport\s*\(/],
];

function namesFound(
  source: string,
  patterns: ReadonlyArray<readonly [string, RegExp]>,
): string[] {
  const code = stripComments(source);
  return patterns
    .filter(([, pattern]) => pattern.test(code))
    .map(([name]) => name);
}

// START_CONTRACT: siteViolations
//   PURPOSE: Name each construct forbidden anywhere in the docs site that the source text uses, so that a violation fails the build's tests.
//   INPUTS: { source: string - the text of one source file }
//   OUTPUTS: { string[] - the names of the forbidden constructs found, empty when none }
//   SIDE_EFFECTS: none
//   LINKS: V-M-DOCS-PLAYGROUND
// END_CONTRACT: siteViolations
export function siteViolations(source: string): string[] {
  return namesFound(source, SITE_PATTERNS);
}

// START_CONTRACT: playgroundViolations
//   PURPOSE: Name each construct forbidden in the playground, which is the site rule plus the rules for raw HTML, script injection and dynamic import.
//   INPUTS: { source: string - the text of one playground source file }
//   OUTPUTS: { string[] - the names of the forbidden constructs found, empty when none }
//   SIDE_EFFECTS: none
//   LINKS: V-M-DOCS-PLAYGROUND
// END_CONTRACT: playgroundViolations
export function playgroundViolations(source: string): string[] {
  return [
    ...siteViolations(source),
    ...namesFound(source, PLAYGROUND_PATTERNS),
  ];
}
