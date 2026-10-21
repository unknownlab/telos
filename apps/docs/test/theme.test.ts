// START_MODULE_CONTRACT
//   PURPOSE: Prove the theme rules: choice parsing, the dark decision, the pre-paint script that applies the stored choice, and the storage fallback when storage is blocked.
//   SCOPE: parseTheme, isDark, applyTheme, applyStoredTheme (table-driven), storeTheme with blocked storage, readTheme, and THEME_SCRIPT, which is checked as text and by running it in an isolated VM context.
//   DEPENDS: M-DOCS-SITE
//   LINKS: V-M-DOCS-SITE
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   FakeRoot - the fake root element that records class toggles and holds the dataset
//   makeRoot - a fresh FakeRoot with an empty dataset
//   FakeStorage - an in-memory storage that records its writes
//   throwing - a function that always throws, to simulate blocked storage
//   runPreludeScript - runs THEME_SCRIPT in an isolated VM context and returns the root it changed
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { runInNewContext } from "node:vm";
import {
  applyStoredTheme,
  applyTheme,
  isDark,
  parseTheme,
  readTheme,
  storeTheme,
  THEME_SCRIPT,
  THEME_STORAGE_KEY,
  type ThemeRoot,
} from "@/lib/theme";

interface FakeRoot extends ThemeRoot {
  readonly classes: Map<string, boolean>;
  readonly dataset: Record<string, string | undefined>;
}

function makeRoot(): FakeRoot {
  const classes = new Map<string, boolean>();
  return {
    classes,
    classList: {
      toggle(token: string, force?: boolean): boolean {
        const on = force ?? !classes.get(token);
        classes.set(token, on);
        return on;
      },
    },
    dataset: {},
  };
}

class FakeStorage {
  readonly writes: Array<[string, string]> = [];
  constructor(private readonly values: Record<string, string> = {}) {}
  getItem(key: string): string | null {
    return this.values[key] ?? null;
  }
  setItem(key: string, value: string): void {
    this.writes.push([key, value]);
  }
}

function throwing(): never {
  throw new Error("storage is blocked");
}

function runPreludeScript(options: {
  readonly stored: string | null;
  readonly prefersDark: boolean;
}): FakeRoot {
  const root = makeRoot();
  const storage = new FakeStorage(
    options.stored === null ? {} : { "telos-theme": options.stored },
  );
  runInNewContext(THEME_SCRIPT, {
    document: { documentElement: root },
    window: {
      localStorage: storage,
      matchMedia: () => ({ matches: options.prefersDark }),
    },
  });
  return root;
}

describe("parseTheme", () => {
  test("keeps the three known choices", () => {
    expect(parseTheme("light")).toBe("light");
    expect(parseTheme("dark")).toBe("dark");
    expect(parseTheme("system")).toBe("system");
  });

  test("maps anything else to system", () => {
    expect(parseTheme("neon")).toBe("system");
    expect(parseTheme(null)).toBe("system");
    expect(parseTheme(undefined)).toBe("system");
    expect(parseTheme(1)).toBe("system");
  });
});

describe("isDark", () => {
  test("follows the choice, and the system setting only for system", () => {
    expect(isDark("dark", false)).toBe(true);
    expect(isDark("light", true)).toBe(false);
    expect(isDark("system", true)).toBe(true);
    expect(isDark("system", false)).toBe(false);
  });
});

describe("applyTheme", () => {
  test("sets the dark class and data-theme", () => {
    const root = makeRoot();
    applyTheme(root, "dark", false);
    expect(root.classes.get("dark")).toBe(true);
    expect(root.dataset.theme).toBe("dark");
    applyTheme(root, "light", true);
    expect(root.classes.get("dark")).toBe(false);
    expect(root.dataset.theme).toBe("light");
  });
});

describe("applyStoredTheme", () => {
  const cases: ReadonlyArray<{
    readonly name: string;
    readonly stored: string | null;
    readonly storage: "works" | "getStorage throws" | "getItem throws" | "null";
    readonly prefersDark: boolean;
    readonly dark: boolean;
    readonly theme: string;
  }> = [
    {
      name: "stored dark",
      stored: "dark",
      storage: "works",
      prefersDark: false,
      dark: true,
      theme: "dark",
    },
    {
      name: "stored light",
      stored: "light",
      storage: "works",
      prefersDark: true,
      dark: false,
      theme: "light",
    },
    {
      name: "stored system",
      stored: "system",
      storage: "works",
      prefersDark: true,
      dark: true,
      theme: "system",
    },
    {
      name: "unknown value",
      stored: "neon",
      storage: "works",
      prefersDark: false,
      dark: false,
      theme: "system",
    },
    {
      name: "nothing stored",
      stored: null,
      storage: "works",
      prefersDark: true,
      dark: true,
      theme: "system",
    },
    {
      name: "storage access throws",
      stored: null,
      storage: "getStorage throws",
      prefersDark: true,
      dark: true,
      theme: "system",
    },
    {
      name: "getItem throws",
      stored: null,
      storage: "getItem throws",
      prefersDark: false,
      dark: false,
      theme: "system",
    },
    {
      name: "no storage object",
      stored: null,
      storage: "null",
      prefersDark: false,
      dark: false,
      theme: "system",
    },
  ];

  for (const c of cases) {
    test(c.name, () => {
      const root = makeRoot();
      const storage = new FakeStorage(
        c.stored === null ? {} : { [THEME_STORAGE_KEY]: c.stored },
      );
      const getStorage =
        c.storage === "getStorage throws"
          ? throwing
          : c.storage === "null"
            ? () => null
            : c.storage === "getItem throws"
              ? () => ({ getItem: throwing, setItem: () => undefined })
              : () => storage;
      applyStoredTheme(root, getStorage, () => c.prefersDark);
      expect(root.classes.get("dark")).toBe(c.dark);
      expect(root.dataset.theme).toBe(c.theme);
    });
  }
});

describe("storeTheme", () => {
  test("writes the choice under telos-theme", () => {
    const storage = new FakeStorage();
    expect(storeTheme(() => storage, "dark")).toBe(true);
    expect(storage.writes).toEqual([["telos-theme", "dark"]]);
  });

  test("returns false and does not throw when setItem throws", () => {
    const getStorage = () => ({
      getItem: () => null,
      setItem: throwing,
    });
    expect(storeTheme(getStorage, "light")).toBe(false);
  });

  test("returns false and does not throw when storage access throws", () => {
    expect(storeTheme(throwing, "light")).toBe(false);
  });

  test("returns false when there is no storage", () => {
    expect(storeTheme(() => null, "light")).toBe(false);
  });
});

describe("readTheme", () => {
  test("reads the choice the pre-paint script applied", () => {
    const root = makeRoot();
    root.dataset.theme = "light";
    expect(readTheme(root)).toBe("light");
    root.dataset.theme = undefined;
    expect(readTheme(root)).toBe("system");
  });
});

describe("THEME_SCRIPT", () => {
  test("is a call of a self-contained function", () => {
    expect(THEME_SCRIPT.startsWith("(")).toBe(true);
    expect(THEME_SCRIPT).toContain('"telos-theme"');
    expect(THEME_SCRIPT).toContain("document.documentElement");
    expect(THEME_SCRIPT).toContain("prefers-color-scheme: dark");
  });

  test("references no identifier of this module", () => {
    expect(THEME_SCRIPT).not.toContain("THEME_STORAGE_KEY");
    expect(THEME_SCRIPT).not.toContain("parseTheme");
    expect(THEME_SCRIPT).not.toContain("isDark");
    expect(THEME_SCRIPT).not.toContain("applyTheme(");
  });

  test("runs with only the page globals and applies a stored dark choice", () => {
    const root = runPreludeScript({ stored: "dark", prefersDark: false });
    expect(root.classes.get("dark")).toBe(true);
    expect(root.dataset.theme).toBe("dark");
  });

  test("runs and follows the system setting when nothing is stored", () => {
    const root = runPreludeScript({ stored: null, prefersDark: true });
    expect(root.classes.get("dark")).toBe(true);
    expect(root.dataset.theme).toBe("system");
  });
});
