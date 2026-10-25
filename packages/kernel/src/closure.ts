// START_MODULE_CONTRACT
//   PURPOSE: Check the Semantic Closure of a repository: every managed file has exactly one owning Locus, every cross-Locus import follows a declared relation, and every third-party import is declared by an External Locus.
//   SCOPE: checkClosure, hasClosureErrors, CLOSURE_LIMITS and the closure report shapes. Out: archetype rules, model building and running the check from the command line.
//   DEPENDS: M-KERNEL-MODEL, M-KERNEL-IDENTITY
//   LINKS: M-KERNEL-CLOSURE, V-M-KERNEL-CLOSURE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   ClosureCode - the eight closure finding codes
//   ClosureFinding - one closure finding with its file, Loci, detail, message and knowledge
//   ClosureOptions - the repository root, managed globs, exclusions, workspace packages and path aliases
//   ClosureReport - the scope, file owners, sorted findings, limits and knowledge of one check
//   CLOSURE_LIMITS - the four limits of the closure check, as sentences
//   checkClosure - checks the closure of a model against a repository and returns the frozen report
//   hasClosureErrors - true when the report has at least one error finding
// END_MODULE_MAP

import { readFileSync, statSync } from "node:fs";
import { posix } from "node:path";
import { Effect } from "effect";
import { deepFreeze } from "./freeze";
import { ancestors, outgoing, type SemanticModel } from "./model";

export type ClosureCode =
  | "closure.unowned"
  | "closure.ambiguous"
  | "closure.empty-claim"
  | "closure.undeclared-dependency"
  | "closure.unknown-external"
  | "closure.unresolved-import"
  | "closure.dynamic-import"
  | "closure.unparsable";

export interface ClosureFinding {
  readonly code: ClosureCode;
  readonly severity: "error" | "warning";
  readonly file: string | null;
  readonly loci: ReadonlyArray<string>;
  readonly detail: string;
  readonly message: string;
  readonly knowledge: "derived" | "unknown";
}

export interface ClosureOptions {
  readonly root: string;
  readonly include: ReadonlyArray<string>;
  readonly exclude?: ReadonlyArray<string>;
  readonly packages?: ReadonlyArray<{
    readonly name: string;
    readonly dir: string;
  }>;
  readonly aliases?: ReadonlyArray<{
    readonly prefix: string;
    readonly dir: string;
  }>;
}

export interface ClosureReport {
  readonly scope: {
    readonly include: ReadonlyArray<string>;
    readonly exclude: ReadonlyArray<string>;
  };
  readonly files: ReadonlyArray<{
    readonly file: string;
    readonly owner: string | null;
  }>;
  readonly findings: ReadonlyArray<ClosureFinding>;
  readonly limits: ReadonlyArray<string>;
  readonly knowledge: "derived";
}

// START_CONTRACT: CLOSURE_LIMITS
//   PURPOSE: State the four limits of the closure check so every report carries them.
//   INPUTS: none
//   OUTPUTS: { ReadonlyArray<string> - the four limit sentences in order, frozen }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-CLOSURE
// END_CONTRACT: CLOSURE_LIMITS
export const CLOSURE_LIMITS: ReadonlyArray<string> = Object.freeze([
  "Ownership is checked per file; code inside a file is not attributed to a narrower Locus.",
  "Type-only imports are not seen, so type-only dependencies are not checked.",
  "A computed import(...) is found by a text scan and reported as an unknown dependency (closure.dynamic-import).",
  "Generated files, node_modules and files outside the include globs are not checked.",
]);

const CODE_EXTENSIONS = [".ts", ".tsx", ".js"];

// Orders strings by UTF-16 code unit, never by locale.
function byCodeUnit(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function toPosix(path: string): string {
  return path.replace(/\\/g, "/");
}

function isFile(absolute: string): boolean {
  try {
    return statSync(absolute).isFile();
  } catch {
    return false;
  }
}

function readManifestExports(
  absolute: string,
): Readonly<Record<string, unknown>> | null {
  try {
    const parsed = JSON.parse(readFileSync(absolute, "utf8")) as {
      exports?: Record<string, unknown>;
    };
    return parsed.exports ?? null;
  } catch {
    return null;
  }
}

// Returns the first existing code file for a repository-relative path, or null.
function resolveCodePath(root: string, path: string): string | null {
  const candidates = [
    path,
    `${path}.ts`,
    `${path}.tsx`,
    `${path}/index.ts`,
    `${path}/index.tsx`,
  ];
  if (path.endsWith(".js")) {
    candidates.push(`${path.slice(0, -3)}.ts`);
  }
  for (const candidate of candidates) {
    if (isFile(posix.join(root, candidate))) return candidate;
  }
  return null;
}

// Returns the first existing code file named by a repository-relative path plus a
// code suffix, or null. Used when the last segment of the path has a non-code
// extension but no such file exists, such as "./routeTree.gen" for routeTree.gen.ts.
function resolveSuffixedCodePath(root: string, path: string): string | null {
  const candidates = [
    `${path}.ts`,
    `${path}.tsx`,
    `${path}/index.ts`,
    `${path}/index.tsx`,
  ];
  for (const candidate of candidates) {
    if (isFile(posix.join(root, candidate))) return candidate;
  }
  return null;
}

function isAssetPath(path: string): boolean {
  const ext = posix.extname(path);
  return ext !== "" && !CODE_EXTENSIONS.includes(ext);
}

function packageNameOf(specifier: string): string {
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0]!;
}

function hasExtension(
  definition: {
    readonly kind: {
      readonly extensions: ReadonlyArray<{ readonly id: string }>;
    };
  },
  id: string,
): boolean {
  return definition.kind.extensions.some((e) => e.id === id);
}

function stringArrayProperty(
  definition: { readonly properties: Readonly<Record<string, unknown>> },
  name: string,
): ReadonlyArray<string> {
  const value = definition.properties[name];
  return Array.isArray(value) ? (value as string[]) : [];
}

// The dependency rule: same Locus, an ancestor or a descendant, or a valid relation
// (any type) from the importer or one of its ancestors to the target Locus.
function allowedDependency(
  model: SemanticModel,
  from: string,
  to: string,
): boolean {
  if (from === to) return true;
  if (ancestors(model, from).includes(to)) return true;
  if (ancestors(model, to).includes(from)) return true;
  return [from, ...ancestors(model, from)].some((id) =>
    outgoing(model, id).some((r) => r.valid && r.target.locus === to),
  );
}

interface FileContext {
  readonly model: SemanticModel;
  readonly root: string;
  readonly file: string;
  readonly owner: string;
  readonly owners: ReadonlyMap<string, string>;
  readonly ambiguous: ReadonlySet<string>;
  readonly packages: ReadonlyArray<{
    readonly name: string;
    readonly dir: string;
  }>;
  readonly aliases: ReadonlyArray<{
    readonly prefix: string;
    readonly dir: string;
  }>;
  readonly findings: ClosureFinding[];
}

function unresolved(ctx: FileContext, raw: string, message: string): void {
  ctx.findings.push({
    code: "closure.unresolved-import",
    severity: "error",
    file: ctx.file,
    loci: [ctx.owner],
    detail: raw,
    message,
    knowledge: "derived",
  });
}

// Checks one owned target file: an owned file follows the dependency rule, an unowned
// file is unresolved, and an ambiguous file is already reported as closure.ambiguous.
function checkTarget(ctx: FileContext, raw: string, target: string): void {
  const targetOwner = ctx.owners.get(target);
  if (targetOwner === undefined) {
    if (!ctx.ambiguous.has(target)) {
      unresolved(
        ctx,
        raw,
        `${raw} resolves to ${target}, which no Locus owns.`,
      );
    }
    return;
  }
  if (!allowedDependency(ctx.model, ctx.owner, targetOwner)) {
    ctx.findings.push({
      code: "closure.undeclared-dependency",
      severity: "error",
      file: ctx.file,
      loci: [ctx.owner, targetOwner],
      detail: raw,
      message: `${ctx.owner} imports ${targetOwner} through ${raw} without a declared relation.`,
      knowledge: "derived",
    });
  }
}

// Resolves a repository-relative path that came from a relative or alias specifier.
function checkLocalPath(ctx: FileContext, raw: string, path: string): void {
  if (path.startsWith("../") || path === "..") {
    unresolved(ctx, raw, `${raw} does not resolve to a file.`);
    return;
  }
  if (isAssetPath(path)) {
    // An existing file with a non-code extension is an asset. Otherwise the last
    // segment is a dotted module name, such as "./routeTree.gen", and the code
    // suffixes are tried before the import is reported as unresolved.
    if (isFile(posix.join(ctx.root, path))) return;
    const target = resolveSuffixedCodePath(ctx.root, path);
    if (target === null) {
      unresolved(ctx, raw, `${raw} does not resolve to a file.`);
      return;
    }
    checkTarget(ctx, raw, target);
    return;
  }
  const target = resolveCodePath(ctx.root, path);
  if (target === null) {
    unresolved(ctx, raw, `${raw} does not resolve to a file.`);
    return;
  }
  checkTarget(ctx, raw, target);
}

function checkImport(ctx: FileContext, raw: string): void {
  const queryAt = raw.indexOf("?");
  const specifier = queryAt >= 0 ? raw.slice(0, queryAt) : raw;

  // Platform imports are always allowed.
  if (
    specifier.startsWith("node:") ||
    specifier === "bun" ||
    specifier.startsWith("bun:")
  ) {
    return;
  }

  // Workspace packages, by exact name or name/<subpath>.
  const pkg = ctx.packages.find(
    (p) => specifier === p.name || specifier.startsWith(`${p.name}/`),
  );
  if (pkg !== undefined) {
    const sub = specifier.slice(pkg.name.length);
    if (sub.endsWith("/package.json")) {
      if (!isFile(posix.join(ctx.root, pkg.dir, "package.json"))) {
        unresolved(ctx, raw, `${raw} does not resolve to a file.`);
      }
      return;
    }
    const exports = readManifestExports(
      posix.join(ctx.root, pkg.dir, "package.json"),
    );
    const exportKey = sub === "" ? "." : `.${sub}`;
    const exported = exports?.[exportKey];
    if (typeof exported !== "string") {
      unresolved(ctx, raw, `${raw} does not resolve to a file.`);
      return;
    }
    const target = resolveCodePath(
      ctx.root,
      posix.normalize(posix.join(pkg.dir, exported)),
    );
    if (target === null) {
      unresolved(ctx, raw, `${raw} does not resolve to a file.`);
      return;
    }
    checkTarget(ctx, raw, target);
    return;
  }

  // Path aliases, only for files under the alias app directory (its first two segments).
  const alias = ctx.aliases.find(
    (a) =>
      specifier.startsWith(a.prefix) &&
      ctx.file.startsWith(`${a.dir.split("/").slice(0, 2).join("/")}/`),
  );
  if (alias !== undefined) {
    checkLocalPath(
      ctx,
      raw,
      posix.normalize(
        posix.join(alias.dir, specifier.slice(alias.prefix.length)),
      ),
    );
    return;
  }

  // Relative imports, resolved from the importing file's directory.
  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    checkLocalPath(
      ctx,
      raw,
      posix.normalize(posix.join(posix.dirname(ctx.file), specifier)),
    );
    return;
  }

  // Bare packages must be listed by an External of the owner or its containers.
  const name = packageNameOf(specifier);
  const declared = [ctx.owner, ...ancestors(ctx.model, ctx.owner)].some(
    (id) => {
      const definition = ctx.model.loci.get(id)!.definition;
      return (
        hasExtension(definition, "telos.external") &&
        stringArrayProperty(definition, "packages").includes(name)
      );
    },
  );
  if (!declared) {
    ctx.findings.push({
      code: "closure.unknown-external",
      severity: "error",
      file: ctx.file,
      loci: [ctx.owner],
      detail: name,
      message: `${ctx.owner} imports ${name}, which no External declaration of ${ctx.owner} or its containers lists.`,
      knowledge: "derived",
    });
  }
}

// Reads a file as UTF-8, or returns null when it cannot be read.
function readText(absolute: string): string | null {
  try {
    return readFileSync(absolute, "utf8");
  } catch {
    return null;
  }
}

// Lists the import specifiers of a file, or returns null when the file does not parse.
function scanSpecifiers(
  file: string,
  text: string,
): ReadonlyArray<string> | null {
  const transpiler = new Bun.Transpiler({
    loader: file.endsWith(".tsx") ? "tsx" : "ts",
  });
  try {
    return transpiler.scanImports(text).map((entry) => entry.path);
  } catch {
    return null;
  }
}

function unparsable(file: string, owner: string): ClosureFinding {
  return {
    code: "closure.unparsable",
    severity: "error",
    file,
    loci: [owner],
    detail: "parse",
    message: `${file} could not be parsed, so its imports were not checked.`,
    knowledge: "derived",
  };
}

// START_CONTRACT: checkClosure
//   PURPOSE: Check the closure of a semantic model against a repository and return a frozen report with every closure finding sorted and de-duplicated.
//   INPUTS: { model: SemanticModel - a built model; options: ClosureOptions - the root, include and exclude globs, workspace packages and aliases }
//   OUTPUTS: { Effect<ClosureReport> - the frozen report with scope, files, findings, limits and knowledge; a file that cannot be read or parsed becomes a closure.unparsable finding, never a failure }
//   SIDE_EFFECTS: Reads the files of the repository under the root; writes nothing
//   LINKS: M-KERNEL-CLOSURE
// END_CONTRACT: checkClosure
/** Checks the Semantic Closure of a model against the files of a repository. */
export const checkClosure = (
  model: SemanticModel,
  options: ClosureOptions,
): Effect.Effect<ClosureReport> =>
  Effect.sync(() => computeClosure(model, options));

function computeClosure(
  model: SemanticModel,
  options: ClosureOptions,
): ClosureReport {
  const { root } = options;
  const exclude = options.exclude ?? [];
  const packages = options.packages ?? [];
  const aliases = options.aliases ?? [];
  const findings: ClosureFinding[] = [];

  // Step 1: scope, the union of the include globs minus the exclude globs.
  const scanned = new Set<string>();
  for (const glob of options.include) {
    for (const file of new Bun.Glob(glob).scanSync({
      cwd: root,
      onlyFiles: true,
    })) {
      scanned.add(toPosix(file));
    }
  }
  const excludeGlobs = exclude.map((glob) => new Bun.Glob(glob));
  const scope = [...scanned]
    .filter((file) => !excludeGlobs.some((glob) => glob.match(file)))
    .sort(byCodeUnit);

  // Step 2: claims, each Source glob of each Locus claims the in-scope files it matches.
  const claimants = new Map<string, string[]>();
  const locusIds = [...model.loci.keys()].sort(byCodeUnit);
  for (const id of locusIds) {
    const definition = model.loci.get(id)!.definition;
    if (!hasExtension(definition, "telos.source")) continue;
    for (const glob of stringArrayProperty(definition, "sources")) {
      const matcher = new Bun.Glob(glob);
      const matched = scope.filter((file) => matcher.match(file));
      if (matched.length === 0) {
        findings.push({
          code: "closure.empty-claim",
          severity: "warning",
          file: null,
          loci: [id],
          detail: glob,
          message: `Source glob ${glob} of ${id} matches no file.`,
          knowledge: "derived",
        });
      }
      for (const file of matched) {
        const list = claimants.get(file) ?? [];
        list.push(id);
        claimants.set(file, list);
      }
    }
  }

  // Step 3: owners, the claimants minus those that contain another claimant.
  const owners = new Map<string, string>();
  const ambiguous = new Set<string>();
  const files: Array<{ file: string; owner: string | null }> = [];
  for (const file of scope) {
    const claims = [...new Set(claimants.get(file) ?? [])];
    const reduced = claims.filter(
      (c) =>
        !claims.some(
          (other) => other !== c && ancestors(model, other).includes(c),
        ),
    );
    if (reduced.length === 0) {
      findings.push({
        code: "closure.unowned",
        severity: "error",
        file,
        loci: [],
        detail: file,
        message: `${file} is not claimed by any Locus.`,
        knowledge: "derived",
      });
      files.push({ file, owner: null });
    } else if (reduced.length > 1) {
      const sorted = reduced.slice().sort(byCodeUnit);
      findings.push({
        code: "closure.ambiguous",
        severity: "error",
        file,
        loci: sorted,
        detail: file,
        message: `${file} is claimed by unrelated Loci ${sorted.join(", ")}.`,
        knowledge: "derived",
      });
      ambiguous.add(file);
      files.push({ file, owner: null });
    } else {
      owners.set(file, reduced[0]!);
      files.push({ file, owner: reduced[0]! });
    }
  }

  // Step 4 and 5: imports and dynamic imports of owned files.
  for (const [file, owner] of [...owners].sort(([a], [b]) =>
    byCodeUnit(a, b),
  )) {
    const text = readText(posix.join(root, file));
    if (text === null) {
      findings.push(unparsable(file, owner));
      continue;
    }
    if (
      /\bimport\s*\(\s*(?!["'`])/.test(text) ||
      /\bimport\s*\(\s*`[^`]*\$\{/.test(text)
    ) {
      findings.push({
        code: "closure.dynamic-import",
        severity: "warning",
        file,
        loci: [owner],
        detail: "import(",
        message: `${file} contains a computed import(...); its dependency is unknown.`,
        knowledge: "unknown",
      });
    }
    const specifiers = scanSpecifiers(file, text);
    if (specifiers === null) {
      findings.push(unparsable(file, owner));
      continue;
    }
    const ctx: FileContext = {
      model,
      root,
      file,
      owner,
      owners,
      ambiguous,
      packages,
      aliases,
      findings,
    };
    for (const specifier of specifiers) {
      checkImport(ctx, specifier);
    }
  }

  const report: ClosureReport = {
    scope: { include: [...options.include], exclude: [...exclude] },
    files,
    findings: dedupeAndSort(findings),
    limits: CLOSURE_LIMITS,
    knowledge: "derived",
  };
  return deepFreeze(report);
}

function dedupeAndSort(
  findings: ReadonlyArray<ClosureFinding>,
): ClosureFinding[] {
  const seen = new Set<string>();
  const unique: ClosureFinding[] = [];
  for (const finding of findings) {
    const key = [
      finding.code,
      finding.file ?? "",
      finding.loci.join("\u0000"),
      finding.detail,
    ].join("\u0001");
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(finding);
  }
  return unique.sort(
    (a, b) =>
      byCodeUnit(a.code, b.code) ||
      byCodeUnit(a.file ?? "", b.file ?? "") ||
      byCodeUnit(a.detail, b.detail) ||
      byCodeUnit(a.message, b.message),
  );
}

// START_CONTRACT: hasClosureErrors
//   PURPOSE: Tell whether a closure report has at least one error finding.
//   INPUTS: { report: ClosureReport - a closure report }
//   OUTPUTS: { boolean - true when some finding has severity error }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-CLOSURE
// END_CONTRACT: hasClosureErrors
/** True when any finding of the report has severity "error". Warnings do not count. */
export function hasClosureErrors(report: ClosureReport): boolean {
  return report.findings.some((f) => f.severity === "error");
}
