// START_MODULE_CONTRACT
//   PURPOSE: Decide the page theme from the stored choice and the system setting, and apply it before first paint without relying on storage.
//   SCOPE: The choice type, the storage key, parseTheme, isDark, applyTheme, storeTheme, readTheme, applyStoredTheme, and THEME_SCRIPT, the inline script that runs applyStoredTheme in the head.
//   DEPENDS: none
//   LINKS: M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   ThemeChoice - the three theme choices
//   THEME_CHOICES - the three theme choices in toggle order
//   THEME_STORAGE_KEY - the localStorage key that holds the choice
//   ThemeRoot - the part of the document root that the theme changes
//   GetStorage - returns the storage to use, or null when there is none
//   parseTheme - turns any stored value into a theme choice
//   isDark - decides whether a choice shows the dark palette
//   applyTheme - applies a choice to the document root
//   storeTheme - stores a choice and reports whether it was stored
//   readTheme - reads the choice that the pre-paint script applied
//   applyStoredTheme - reads the stored choice and applies it, for the pre-paint script
//   THEME_SCRIPT - the inline script text that applies the stored theme before paint
// END_MODULE_MAP

/** A theme choice. `system` follows prefers-color-scheme. */
export type ThemeChoice = "light" | "dark" | "system";

// START_CONTRACT: THEME_CHOICES
//   PURPOSE: List the three choices in the order the toggle shows them.
//   INPUTS: none (constant)
//   OUTPUTS: { ReadonlyArray<ThemeChoice> - light, dark, system }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: THEME_CHOICES
export const THEME_CHOICES: ReadonlyArray<ThemeChoice> = [
  "light",
  "dark",
  "system",
];

// START_CONTRACT: THEME_STORAGE_KEY
//   PURPOSE: Name the localStorage key that holds the theme choice.
//   INPUTS: none (constant)
//   OUTPUTS: { string - "telos-theme" }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: THEME_STORAGE_KEY
export const THEME_STORAGE_KEY = "telos-theme";

/** The part of the document root that the theme changes. */
export interface ThemeRoot {
  readonly classList: { toggle(token: string, force?: boolean): boolean };
  readonly dataset: Record<string, string | undefined>;
}

/** Returns the storage to use, or null when the page has none. Reading it may throw when storage is blocked. */
export type GetStorage = () => {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
} | null;

// START_CONTRACT: parseTheme
//   PURPOSE: Accept only the three known choices, so any other stored value falls back to the system setting.
//   INPUTS: { value: unknown - a raw value, usually from storage or from data-theme }
//   OUTPUTS: { ThemeChoice - the value when it is a known choice, otherwise "system" }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: parseTheme
export function parseTheme(value: unknown): ThemeChoice {
  return value === "light" || value === "dark" || value === "system"
    ? value
    : "system";
}

// START_CONTRACT: isDark
//   PURPOSE: Decide whether a choice shows the dark palette, given the system setting.
//   INPUTS: { choice: ThemeChoice - the chosen theme, prefersDark: boolean - the system setting }
//   OUTPUTS: { boolean - true for dark, and for system when the system prefers dark }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: isDark
export function isDark(choice: ThemeChoice, prefersDark: boolean): boolean {
  return choice === "dark" || (choice === "system" && prefersDark);
}

// START_CONTRACT: applyTheme
//   PURPOSE: Show a choice on the document root, through the dark class and data-theme.
//   INPUTS: { root: ThemeRoot - the document element, choice: ThemeChoice - the theme, prefersDark: boolean - the system setting }
//   OUTPUTS: { void }
//   SIDE_EFFECTS: toggles the dark class and sets data-theme on root
//   LINKS: M-DOCS-SITE
// END_CONTRACT: applyTheme
export function applyTheme(
  root: ThemeRoot,
  choice: ThemeChoice,
  prefersDark: boolean,
): void {
  root.classList.toggle("dark", isDark(choice, prefersDark));
  root.dataset.theme = choice;
}

// START_CONTRACT: storeTheme
//   PURPOSE: Remember the choice across visits, and say so when the choice could not be remembered.
//   INPUTS: { getStorage: GetStorage - the storage source, choice: ThemeChoice - the choice to store }
//   OUTPUTS: { boolean - true when the choice was stored; false when storage is missing, blocked or throws }
//   SIDE_EFFECTS: writes THEME_STORAGE_KEY to storage
//   LINKS: M-DOCS-SITE
// END_CONTRACT: storeTheme
export function storeTheme(
  getStorage: GetStorage,
  choice: ThemeChoice,
): boolean {
  try {
    const storage = getStorage();
    if (storage === null) return false;
    storage.setItem(THEME_STORAGE_KEY, choice);
    return true;
  } catch {
    return false;
  }
}

// START_CONTRACT: readTheme
//   PURPOSE: Read back the choice that the pre-paint script applied to the document root.
//   INPUTS: { root: ThemeRoot - the document element }
//   OUTPUTS: { ThemeChoice - the value of data-theme, or "system" when it is absent or unknown }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: readTheme
export function readTheme(root: ThemeRoot): ThemeChoice {
  return parseTheme(root.dataset.theme);
}

// START_CONTRACT: applyStoredTheme
//   PURPOSE: Apply the stored choice before the body paints; any failure of storage falls back to the system setting.
//   INPUTS: { root: ThemeRoot - the document element, getStorage: GetStorage - the storage source, prefersDark: () => boolean - the system setting }
//   OUTPUTS: { void }
//   SIDE_EFFECTS: toggles the dark class and sets data-theme on root
//   LINKS: M-DOCS-SITE
// END_CONTRACT: applyStoredTheme
// SELF-CONTAINED: THEME_SCRIPT serialises this function with toString(), so it must
// reference only its parameters and globals. Do not add references to module-level names.
export function applyStoredTheme(
  root: ThemeRoot,
  getStorage: GetStorage,
  prefersDark: () => boolean,
): void {
  let choice = "system";
  try {
    const storage = getStorage();
    const value = storage === null ? null : storage.getItem("telos-theme");
    if (value === "light" || value === "dark") choice = value;
  } catch {
    choice = "system";
  }
  root.classList.toggle(
    "dark",
    choice === "dark" || (choice === "system" && prefersDark()),
  );
  root.dataset.theme = choice;
}

// START_CONTRACT: THEME_SCRIPT
//   PURPOSE: Hold the inline script text that applies the stored theme in the document head, before the body paints.
//   INPUTS: none (build-time constant)
//   OUTPUTS: { string - a call of applyStoredTheme with the document root, a storage getter and a system-setting getter }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: THEME_SCRIPT
export const THEME_SCRIPT = `(${applyStoredTheme.toString()})(document.documentElement,function(){return window.localStorage},function(){return window.matchMedia("(prefers-color-scheme: dark)").matches})`;
