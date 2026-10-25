import { describe, expect, test } from "bun:test";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");

const PACKAGES: ReadonlyArray<{
  readonly name: string;
  readonly dir: string;
  readonly exports: Readonly<Record<string, string>>;
  readonly dependencies: Readonly<Record<string, string>>;
}> = [
  {
    name: "@telos/kernel",
    dir: "packages/kernel",
    exports: {
      ".": "./src/index.ts",
      "./closure": "./src/closure.ts",
      "./package.json": "./package.json",
    },
    dependencies: { effect: "4.0.4" },
  },
  {
    name: "@telos/cli",
    dir: "packages/cli",
    exports: {
      ".": "./src/index.ts",
      "./bun": "./src/bun.ts",
      "./package.json": "./package.json",
    },
    dependencies: { "@telos/kernel": "workspace:*", effect: "4.0.4" },
  },
  {
    name: "@telos/agent",
    dir: "packages/agent",
    exports: {
      ".": "./src/index.ts",
      "./mcp": "./src/mcp.ts",
      "./client": "./src/client.ts",
      "./package.json": "./package.json",
    },
    dependencies: { "@telos/kernel": "workspace:*", effect: "4.0.4" },
  },
  {
    name: "@telos/web",
    dir: "packages/web",
    exports: { ".": "./src/index.ts", "./package.json": "./package.json" },
    dependencies: { "@telos/kernel": "workspace:*", effect: "4.0.4" },
  },
  {
    name: "@telos/calculator",
    dir: "apps/calculator",
    exports: { ".": "./src/index.ts", "./package.json": "./package.json" },
    dependencies: {
      "@telos/agent": "workspace:*",
      "@telos/cli": "workspace:*",
      "@telos/kernel": "workspace:*",
      "@telos/web": "workspace:*",
      effect: "4.0.4",
    },
  },
];

async function readManifest(path: string): Promise<Record<string, unknown>> {
  return (await Bun.file(join(ROOT, path)).json()) as Record<string, unknown>;
}

describe("workspace package manifests", () => {
  for (const expected of PACKAGES) {
    test(`${expected.name} has exactly the expected fields, exports and dependencies`, async () => {
      const pkg = await readManifest(`${expected.dir}/package.json`);
      expect(Object.keys(pkg).sort()).toEqual([
        "dependencies",
        "exports",
        "name",
        "private",
        "type",
        "version",
      ]);
      expect(pkg.name).toBe(expected.name);
      expect(pkg.private).toBe(true);
      expect(pkg.type).toBe("module");
      expect(pkg.exports).toEqual(expected.exports);
      expect(pkg.dependencies).toEqual(expected.dependencies);
    });
  }

  test("every dependency is an exact pin or a workspace link, and no manifest trusts install scripts", async () => {
    const root = await readManifest("package.json");
    expect("trustedDependencies" in root).toBe(false);
    for (const expected of PACKAGES) {
      const pkg = await readManifest(`${expected.dir}/package.json`);
      expect("trustedDependencies" in pkg).toBe(false);
      for (const version of Object.values(
        pkg.dependencies as Record<string, string>,
      )) {
        expect(version).toMatch(/^(\d+\.\d+\.\d+|workspace:\*)$/);
      }
    }
  });
});
