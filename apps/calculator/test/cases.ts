import type { CliResult } from "@telos/cli";
import {
  jsonEqual,
  type InvocationError,
  type InvocationOutcome,
} from "@telos/kernel";

export interface Case {
  readonly name: string;
  readonly capability: "add" | "subtract" | "multiply" | "divide";
  readonly text: Readonly<Record<string, string>>;
  readonly json: Readonly<Record<string, unknown>>;
  readonly expected:
    | { readonly ok: true; readonly output: { readonly result: number } }
    | {
        readonly ok: false;
        readonly tag: string;
        readonly paths: ReadonlyArray<string>;
      };
  readonly exitCode: 0 | 1 | 2;
}

export type Normalized =
  | { readonly ok: true; readonly output: unknown }
  | {
      readonly ok: false;
      readonly tag: string;
      readonly message: string;
      readonly paths: ReadonlyArray<string>;
    };

const byCodeUnit = (a: string, b: string): number =>
  a < b ? -1 : a > b ? 1 : 0;

const pathsOf = (error: InvocationError): ReadonlyArray<string> =>
  error.issues.map((issue) => issue.path.join(".")).sort(byCodeUnit);

export const CASES: ReadonlyArray<Case> = [
  {
    name: "add integers",
    capability: "add",
    text: { a: "2", b: "3" },
    json: { a: 2, b: 3 },
    expected: { ok: true, output: { result: 5 } },
    exitCode: 0,
  },
  {
    name: "subtract",
    capability: "subtract",
    text: { a: "5", b: "3" },
    json: { a: 5, b: 3 },
    expected: { ok: true, output: { result: 2 } },
    exitCode: 0,
  },
  {
    name: "multiply decimal",
    capability: "multiply",
    text: { a: "4", b: "2.5" },
    json: { a: 4, b: 2.5 },
    expected: { ok: true, output: { result: 10 } },
    exitCode: 0,
  },
  {
    name: "divide",
    capability: "divide",
    text: { a: "7", b: "2" },
    json: { a: 7, b: 2 },
    expected: { ok: true, output: { result: 3.5 } },
    exitCode: 0,
  },
  {
    name: "add negatives",
    capability: "add",
    text: { a: "-1.5", b: "0.5" },
    json: { a: -1.5, b: 0.5 },
    expected: { ok: true, output: { result: -1 } },
    exitCode: 0,
  },
  {
    name: "divide negative",
    capability: "divide",
    text: { a: "-6", b: "3" },
    json: { a: -6, b: 3 },
    expected: { ok: true, output: { result: -2 } },
    exitCode: 0,
  },
  {
    name: "subtract zeros",
    capability: "subtract",
    text: { a: "0", b: "0" },
    json: { a: 0, b: 0 },
    expected: { ok: true, output: { result: 0 } },
    exitCode: 0,
  },
  {
    name: "divide by zero",
    capability: "divide",
    text: { a: "1", b: "0" },
    json: { a: 1, b: 0 },
    expected: { ok: false, tag: "DivisionByZero", paths: [] },
    exitCode: 1,
  },
  {
    name: "zero by zero",
    capability: "divide",
    text: { a: "0", b: "0" },
    json: { a: 0, b: 0 },
    expected: { ok: false, tag: "DivisionByZero", paths: [] },
    exitCode: 1,
  },
  {
    name: "overflow",
    capability: "multiply",
    text: { a: "1e308", b: "10" },
    json: { a: 1e308, b: 10 },
    expected: { ok: false, tag: "NonFiniteResult", paths: [] },
    exitCode: 1,
  },
  {
    name: "non-numeric",
    capability: "add",
    text: { a: "x", b: "1" },
    json: { a: "x", b: 1 },
    expected: { ok: false, tag: "InvalidInput", paths: ["a"] },
    exitCode: 2,
  },
  {
    name: "missing operand",
    capability: "add",
    text: { a: "1" },
    json: { a: 1 },
    expected: { ok: false, tag: "InvalidInput", paths: ["b"] },
    exitCode: 2,
  },
  {
    name: "empty operand",
    capability: "subtract",
    text: { a: "", b: "1" },
    json: { a: "", b: 1 },
    expected: { ok: false, tag: "InvalidInput", paths: ["a"] },
    exitCode: 2,
  },
  {
    name: "divide quarter",
    capability: "divide",
    text: { a: "10", b: "4" },
    json: { a: 10, b: 4 },
    expected: { ok: true, output: { result: 2.5 } },
    exitCode: 0,
  },
];

export function argvOf(c: Case): ReadonlyArray<string> {
  return [
    c.capability,
    ...Object.entries(c.text).flatMap(([k, v]) => ["--" + k, v]),
  ];
}

export function normalizeOutcome(outcome: InvocationOutcome): Normalized {
  if (outcome.ok) return { ok: true, output: outcome.output };
  return {
    ok: false,
    tag: outcome.error.tag,
    message: outcome.error.message,
    paths: pathsOf(outcome.error),
  };
}

export function normalizeCli(result: CliResult): Normalized {
  if (result.exitCode === 0) {
    return { ok: true, output: JSON.parse(result.stdout) as unknown };
  }
  const error = JSON.parse(result.stderr) as InvocationError;
  return normalizeOutcome({ ok: false, error });
}

export function normalizeTool(
  result:
    { readonly structured: unknown } | { readonly structuredContent: unknown },
): Normalized {
  const structured =
    "structured" in result ? result.structured : result.structuredContent;
  return normalizeOutcome(structured as InvocationOutcome);
}

export function matchesExpected(n: Normalized, c: Case): boolean {
  if (c.expected.ok) {
    return n.ok && jsonEqual(n.output, c.expected.output);
  }
  return (
    !n.ok && n.tag === c.expected.tag && jsonEqual(n.paths, c.expected.paths)
  );
}
