import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { classify, lex, normalizedTokens, ownerNotes, strip } from "./lex";

const ROOT = resolve(import.meta.dir, "../../..");
const BASELINE = resolve(import.meta.dir, "../baseline");
const BUN = process.execPath;

const CODE_PARITY_PREFIXES = ["packages/", "apps/calculator/"];
const COMMENT_SCOPE = ["packages", "apps/calculator", "scripts", "telos.ts"];
const NOTE_FILES_PREFIX = "apps/calculator/src/";
const ALLOWED_REMOVALS = new Set(["apps/calculator/test/ergonomics.test.ts"]);
const EXPECTED = { ownerNotes: 34, directives: 7, other: 0 };

const CLI = "apps/calculator/bin/cli.ts";
const COMMANDS: ReadonlyArray<{ readonly name: string; readonly argv: ReadonlyArray<string> }> = [
  { name: "cli add", argv: [CLI, "add", "--a", "2", "--b", "3"] },
  { name: "cli subtract", argv: [CLI, "subtract", "--a", "7", "--b", "2"] },
  { name: "cli multiply", argv: [CLI, "multiply", "--a", "4", "--b", "2.5"] },
  { name: "cli divide", argv: [CLI, "divide", "--a", "9", "--b", "3"] },
  { name: "cli divide by zero", argv: [CLI, "divide", "--a", "1", "--b", "0"] },
  { name: "cli non-finite", argv: [CLI, "multiply", "--a", "1e308", "--b", "10"] },
  { name: "cli invalid input", argv: [CLI, "add", "--a", "x", "--b", "1"] },
  { name: "cli missing flag", argv: [CLI, "add", "--a", "1"] },
  { name: "cli unknown command", argv: [CLI, "nope"] },
  { name: "cli help", argv: [CLI, "--help"] },
  { name: "cli add help", argv: [CLI, "add", "--help"] },
  { name: "cli version", argv: [CLI, "--version"] },
  { name: "agent demo", argv: ["apps/calculator/bin/agent-demo.ts"] },
];

type Json = unknown;

const git = (args: ReadonlyArray<string>): string => {
  const result = Bun.spawnSync(["git", ...args], { cwd: ROOT });
  if (result.exitCode !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${result.stderr.toString()}`);
  }
  return result.stdout.toString();
};

const tracked = (paths: ReadonlyArray<string>): string[] =>
  git(["ls-files", "--", ...paths])
    .split("\n")
    .filter((f) => f.endsWith(".ts") && existsSync(join(ROOT, f)))
    .sort();

const runCommands = (): Record<string, Json> => {
  const out: Record<string, Json> = {};
  for (const command of COMMANDS) {
    const result = Bun.spawnSync([BUN, ...command.argv], { cwd: ROOT });
    out[command.name] = {
      exitCode: result.exitCode,
      stdout: result.stdout.toString(),
      stderr: result.stderr.toString(),
    };
  }
  return out;
};

const mcpToolList = async (): Promise<Json> => {
  const { McpStdioClient } = await import(join(ROOT, "packages/agent/src/client.ts"));
  const client = await McpStdioClient.spawn([BUN, "apps/calculator/bin/mcp.ts"], { cwd: ROOT });
  try {
    return { server: client.server, tools: await client.listTools() };
  } finally {
    await client.close();
  }
};

const entryPoints = (): Array<{ readonly id: string; readonly file: string }> => {
  const found: Array<{ readonly id: string; readonly file: string }> = [];
  for (const manifest of new Bun.Glob("{packages,apps}/*/package.json").scanSync({ cwd: ROOT })) {
    if (!git(["ls-files", "--", manifest]).trim()) continue;
    const pkg = JSON.parse(readFileSync(join(ROOT, manifest), "utf8")) as {
      readonly name: string;
      readonly exports?: Record<string, string>;
    };
    const dir = manifest.slice(0, -"/package.json".length);
    for (const [key, target] of Object.entries(pkg.exports ?? {})) {
      if (!target.endsWith(".ts")) continue;
      found.push({ id: key === "." ? pkg.name : `${pkg.name}${key.slice(1)}`, file: join(ROOT, dir, target) });
    }
  }
  return found.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
};

const KEPT_ENTRY_PREFIXES = ["@telos/kernel", "@telos/agent", "@telos/cli", "@telos/web", "@telos/calculator"];

const exportsOf = async (): Promise<Record<string, Json>> => {
  const out: Record<string, Json> = {};
  for (const entry of entryPoints()) {
    if (!KEPT_ENTRY_PREFIXES.some((p) => entry.id === p || entry.id.startsWith(`${p}/`))) continue;
    const mod = (await import(entry.file)) as Record<string, unknown>;
    out[entry.id] = Object.keys(mod).sort();
  }
  return out;
};

const modelOutputs = async (): Promise<Record<string, Json>> => {
  const { Effect } = await import("effect");
  const kernel = await import(join(ROOT, "packages/kernel/src/index.ts"));
  const web = await import(join(ROOT, "packages/web/src/index.ts"));
  const calc = await import(join(ROOT, "apps/calculator/src/index.ts"));
  const model = calc.calculatorModel;
  const run = <A>(effect: unknown): Promise<A> => Effect.runPromise(effect as never) as Promise<A>;
  return {
    ids: [...model.ids],
    diagnostics: model.diagnostics,
    describe: await run(kernel.describeModel(model)),
    verify: await run(kernel.verify(model, { runner: "parity", now: () => new Date(0) })),
    webForms: await run(web.formModel(model, "calculator:web")),
  };
};

const noteMap = (read: (file: string) => string | null, files: ReadonlyArray<string>): Record<string, Json> => {
  const out: Record<string, Json> = {};
  for (const file of files) {
    const src = read(file);
    if (src === null) continue;
    const notes = ownerNotes(src);
    if (notes.length > 0) out[file] = notes;
  }
  return out;
};

const stable = (value: Json): string => JSON.stringify(value, null, 2);

const writeJson = (name: string, value: Json): void => {
  writeFileSync(join(BASELINE, name), `${stable(value)}\n`);
};

const readJson = (name: string): Json => JSON.parse(readFileSync(join(BASELINE, name), "utf8"));

async function capture(): Promise<number> {
  const status = git(["status", "--porcelain", "--", ...COMMENT_SCOPE]).trim();
  if (status !== "") {
    console.error(`capture: the code scope has uncommitted changes:\n${status}`);
    return 1;
  }
  mkdirSync(BASELINE, { recursive: true });
  const commit = git(["rev-parse", "HEAD"]).trim();
  const codeFiles = tracked(["packages", "apps/calculator"]);
  writeJson("meta.json", { commit, bun: Bun.version, codeFiles });
  writeJson("commands.json", { ...runCommands(), "mcp tools/list": await mcpToolList() });
  writeJson("exports.json", await exportsOf());
  writeJson("model.json", await modelOutputs());
  const noteFiles = tracked([NOTE_FILES_PREFIX]);
  writeJson("owner-notes.json", noteMap((f) => readFileSync(join(ROOT, f), "utf8"), noteFiles));
  console.log(`captured baseline at ${commit} into ${BASELINE}`);
  return 0;
}

const transpiler = new Bun.Transpiler({ loader: "ts", trimUnusedImports: false });

const firstDifference = (a: string, b: string): string => {
  const la = a.split("\n");
  const lb = b.split("\n");
  for (let k = 0; k < Math.max(la.length, lb.length); k += 1) {
    if (la[k] !== lb[k]) return `line ${k + 1}:\n  baseline: ${la[k] ?? "<none>"}\n  current:  ${lb[k] ?? "<none>"}`;
  }
  return "identical";
};

async function check(): Promise<number> {
  const failures: string[] = [];
  const meta = readJson("meta.json") as { commit: string; bun: string; codeFiles: string[] };
  if (meta.bun !== Bun.version) failures.push(`bun version ${Bun.version} differs from baseline ${meta.bun}`);

  const current = tracked(["packages", "apps/calculator"]);
  const baseSet = new Set(meta.codeFiles);
  for (const file of current) {
    if (!baseSet.has(file)) failures.push(`code: new file ${file}`);
  }
  let compared = 0;
  for (const file of meta.codeFiles) {
    const exists = existsSync(join(ROOT, file));
    if (!exists) {
      if (!ALLOWED_REMOVALS.has(file)) failures.push(`code: removed file ${file}`);
      continue;
    }
    const before = git(["show", `${meta.commit}:${file}`]);
    const after = readFileSync(join(ROOT, file), "utf8");
    compared += 1;
    const tb = transpiler.transformSync(before);
    const ta = transpiler.transformSync(after);
    if (tb !== ta) failures.push(`code: runtime output differs in ${file}\n${firstDifference(tb, ta)}`);
    const kb = normalizedTokens(before).join(" ");
    const ka = normalizedTokens(after).join(" ");
    if (kb !== ka) failures.push(`code: tokens differ in ${file}\n${firstDifference(kb.replaceAll(" ; ", " ;\n"), ka.replaceAll(" ; ", " ;\n"))}`);
  }

  const compare = (label: string, base: Json, now: Json): void => {
    if (typeof base === "object" && base !== null && typeof now === "object" && now !== null && !Array.isArray(base)) {
      const keys = new Set([...Object.keys(base), ...Object.keys(now as object)]);
      for (const key of [...keys].sort()) {
        const a = stable((base as Record<string, Json>)[key] ?? null);
        const b = stable((now as Record<string, Json>)[key] ?? null);
        if (a !== b) failures.push(`${label}: "${key}" differs\n${firstDifference(a, b)}`);
      }
      return;
    }
    if (stable(base) !== stable(now)) failures.push(`${label} differs`);
  };

  compare("commands", readJson("commands.json"), { ...runCommands(), "mcp tools/list": await mcpToolList() });
  compare("exports", readJson("exports.json"), await exportsOf());
  compare("model", readJson("model.json"), await modelOutputs());
  const notesBase = readJson("owner-notes.json") as Record<string, Json>;
  compare("owner notes", notesBase, noteMap((f) => (existsSync(join(ROOT, f)) ? readFileSync(join(ROOT, f), "utf8") : null), Object.keys(notesBase)));

  if (failures.length > 0) {
    console.error(failures.join("\n\n"));
    console.error(`\nparity check FAILED: ${failures.length} difference(s)`);
    return 1;
  }
  console.log(`parity check passed: ${compared} code files, ${COMMANDS.length + 1} commands, exports, model outputs and owner notes match baseline ${meta.commit.slice(0, 7)}`);
  return 0;
}

function sameCode(rev: string | undefined): number {
  if (rev === undefined) {
    console.error("same-code needs a git revision, for example: same-code HEAD");
    return 2;
  }
  const failures: string[] = [];
  const before = git(["ls-tree", "-r", "--name-only", rev, "--", ...COMMENT_SCOPE])
    .split("\n")
    .filter((f) => f.endsWith(".ts"))
    .sort();
  const beforeSet = new Set(before);
  for (const file of tracked(COMMENT_SCOPE)) {
    if (!beforeSet.has(file)) failures.push(`new file ${file}`);
  }
  let compared = 0;
  for (const file of before) {
    if (!existsSync(join(ROOT, file))) {
      if (!ALLOWED_REMOVALS.has(file)) failures.push(`removed file ${file}`);
      continue;
    }
    const old = git(["show", `${rev}:${file}`]);
    const now = readFileSync(join(ROOT, file), "utf8");
    compared += 1;
    const tb = transpiler.transformSync(old);
    const ta = transpiler.transformSync(now);
    if (tb !== ta) failures.push(`runtime output differs in ${file}\n${firstDifference(tb, ta)}`);
    const kb = normalizedTokens(old).join(" ");
    const ka = normalizedTokens(now).join(" ");
    if (kb !== ka) failures.push(`tokens differ in ${file}\n${firstDifference(kb.replaceAll(" ; ", " ;\n"), ka.replaceAll(" ; ", " ;\n"))}`);
  }
  if (failures.length > 0) {
    console.error(failures.join("\n\n"));
    console.error(`\nsame-code FAILED: ${failures.length} difference(s) against ${rev}`);
    return 1;
  }
  console.log(`same-code passed: ${compared} files have the same code as ${rev} apart from comments and formatting`);
  return 0;
}

function scan(expectClean: boolean): number {
  const counts = { ownerNotes: 0, directives: 0, other: 0 };
  const others: string[] = [];
  for (const file of tracked(COMMENT_SCOPE)) {
    const src = readFileSync(join(ROOT, file), "utf8");
    for (const comment of lex(src).comments) {
      const kind = classify(comment);
      if (kind === "owner-note") counts.ownerNotes += 1;
      else if (kind === "directive") counts.directives += 1;
      else {
        counts.other += 1;
        if (others.length < 20) {
          const line = src.slice(0, comment.start).split("\n").length;
          others.push(`${file}:${line}: ${comment.text.split("\n")[0]}`);
        }
      }
    }
  }
  console.log(JSON.stringify(counts));
  if (!expectClean) return 0;
  const ok =
    counts.ownerNotes === EXPECTED.ownerNotes &&
    counts.directives === EXPECTED.directives &&
    counts.other === EXPECTED.other;
  if (!ok) {
    console.error(`scan FAILED: expected ${JSON.stringify(EXPECTED)}`);
    if (others.length > 0) console.error(others.join("\n"));
    return 1;
  }
  console.log("scan passed");
  return 0;
}

function stripAll(): number {
  let changed = 0;
  for (const file of tracked(COMMENT_SCOPE)) {
    const path = join(ROOT, file);
    const src = readFileSync(path, "utf8");
    const out = strip(src);
    if (out !== src) {
      writeFileSync(path, out);
      changed += 1;
    }
  }
  console.log(`stripped comments from ${changed} file(s); now run: bun run format`);
  return 0;
}

function selftest(): number {
  const cases: Array<{ readonly name: string; readonly input: string; readonly expected: string }> = [
    {
      name: "full-line and trailing comments go, strings and regex stay",
      input: `// head\nimport { x } from "y";\n\n/** doc\n * more\n */\nexport const f = (a: number) => a + 1; // trail\nconst s = "a//b/*c*/";\nconst r = /\\/\\//g;\nconst t = \`x \${a /* in */ + 1} // not\`;\n`,
      expected: `import { x } from "y";\n\nexport const f = (a: number) => a + 1;\nconst s = "a//b/*c*/";\nconst r = /\\/\\//g;\nconst t = \`x \${a + 1} // not\`;\n`,
    },
    {
      name: "owner notes and directives stay word for word",
      input: `// START_BLOCK_X\n//@unknownhero keep this\nconst a = 1; //@unknownhero same line\n// @ts-expect-error reason\nconst b: string = 1;\n// END_BLOCK_X\n`,
      expected: `//@unknownhero keep this\nconst a = 1; //@unknownhero same line\n// @ts-expect-error reason\nconst b: string = 1;\n`,
    },
    {
      name: "blank lines collapse and division is not a regex",
      input: `const a = 4 / 2; // x\n\n// one\n\n// two\n\nconst b = a / 2 / 1;\n`,
      expected: `const a = 4 / 2;\n\nconst b = a / 2 / 1;\n`,
    },
    {
      name: "nested template literals",
      input: "const n = `a${`b${c /* z */}`}d`; // q\n",
      expected: "const n = `a${`b${c}`}d`;\n",
    },
  ];
  let failed = 0;
  for (const c of cases) {
    const got = strip(c.input);
    if (got !== c.expected) {
      failed += 1;
      console.error(`FAIL ${c.name}\n--- expected\n${c.expected}--- got\n${got}`);
    } else {
      console.log(`ok   ${c.name}`);
    }
  }
  const notes = ownerNotes(`// a\n//@unknownhero n1\n\nconst x = 1; // b\nconst y = 2; //@unknownhero n2\n`);
  const expectedNotes = [
    { text: "//@unknownhero n1", placement: "line-above", anchor: "const x = 1;" },
    { text: "//@unknownhero n2", placement: "same-line", anchor: "const y = 2;" },
  ];
  if (JSON.stringify(notes) !== JSON.stringify(expectedNotes)) {
    failed += 1;
    console.error(`FAIL owner note anchors: ${JSON.stringify(notes)}`);
  } else {
    console.log("ok   owner note anchors");
  }
  const tokensA = normalizedTokens("f(\n  a, // c\n  b,\n);\n").join(" ");
  const tokensB = normalizedTokens("f(a, b);\n").join(" ");
  if (tokensA !== tokensB) {
    failed += 1;
    console.error(`FAIL trailing commas are ignored: ${tokensA} vs ${tokensB}`);
  } else {
    console.log("ok   trailing commas are ignored by the token comparison");
  }
  if (normalizedTokens("a + 1").join(" ") === normalizedTokens("a + 2").join(" ")) {
    failed += 1;
    console.error("FAIL a code change must change the tokens");
  } else {
    console.log("ok   a code change changes the tokens");
  }
  console.log(failed === 0 ? "selftest passed" : `selftest FAILED: ${failed}`);
  return failed === 0 ? 0 : 1;
}

const [command, ...rest] = process.argv.slice(2);
const usage = "usage: bun kitty-specs/m0-cleanup-01M5SPZC/parity/parity.ts capture|check|scan [--expect-clean]|strip|same-code <rev>|selftest";
let code = 2;
switch (command) {
  case "capture":
    code = await capture();
    break;
  case "check":
    code = await check();
    break;
  case "scan":
    code = scan(rest.includes("--expect-clean"));
    break;
  case "strip":
    code = stripAll();
    break;
  case "same-code":
    code = sameCode(rest[0]);
    break;
  case "selftest":
    code = selftest();
    break;
  default:
    console.error(usage);
}
process.exit(code);
