// START_MODULE_CONTRACT
//   PURPOSE: Prove which key presses open the search dialog, and that typing in a text field never does.
//   SCOPE: isSearchShortcut over the table of key events, and isEditableTarget for the non-element and editable cases.
//   DEPENDS: M-DOCS-SITE
//   LINKS: V-M-DOCS-SITE
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   BODY - a non-editable target, the document body
//   event - a key event with no modifiers on the body, overridden per case
//   SHORTCUT_CASES - the table of key events and the expected result
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import {
  isEditableTarget,
  isSearchShortcut,
  type KeyLike,
} from "@/lib/shortcuts";

const BODY = { tagName: "BODY" };

function event(overrides: Partial<KeyLike>): KeyLike {
  return {
    key: "a",
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    target: BODY,
    ...overrides,
  };
}

const SHORTCUT_CASES: ReadonlyArray<{
  readonly name: string;
  readonly event: KeyLike;
  readonly opens: boolean;
}> = [
  { name: "slash on the body", event: event({ key: "/" }), opens: true },
  {
    name: "slash in an input",
    event: event({ key: "/", target: { tagName: "INPUT" } }),
    opens: false,
  },
  {
    name: "slash in a textarea",
    event: event({ key: "/", target: { tagName: "TEXTAREA" } }),
    opens: false,
  },
  {
    name: "slash in a content-editable element",
    event: event({
      key: "/",
      target: { tagName: "DIV", isContentEditable: true },
    }),
    opens: false,
  },
  {
    name: "slash with ctrl",
    event: event({ key: "/", ctrlKey: true }),
    opens: false,
  },
  {
    name: "ctrl+k in an input",
    event: event({ key: "k", ctrlKey: true, target: { tagName: "INPUT" } }),
    opens: true,
  },
  { name: "meta+K", event: event({ key: "K", metaKey: true }), opens: true },
  {
    name: "ctrl+alt+k",
    event: event({ key: "k", ctrlKey: true, altKey: true }),
    opens: false,
  },
  { name: "k with no modifier", event: event({ key: "k" }), opens: false },
  { name: "enter", event: event({ key: "Enter" }), opens: false },
];

describe("isSearchShortcut", () => {
  for (const c of SHORTCUT_CASES) {
    test(c.name, () => {
      expect(isSearchShortcut(c.event)).toBe(c.opens);
    });
  }
});

describe("isEditableTarget", () => {
  test("is false for a missing or non-object target", () => {
    expect(isEditableTarget(null)).toBe(false);
    expect(isEditableTarget("x")).toBe(false);
    expect(isEditableTarget(undefined)).toBe(false);
  });

  test("is true for input, textarea and select", () => {
    expect(isEditableTarget({ tagName: "INPUT" })).toBe(true);
    expect(isEditableTarget({ tagName: "TEXTAREA" })).toBe(true);
    expect(isEditableTarget({ tagName: "SELECT" })).toBe(true);
  });

  test("is true for a content-editable element", () => {
    expect(isEditableTarget({ tagName: "DIV", isContentEditable: true })).toBe(
      true,
    );
  });

  test("is false for the body and for other elements", () => {
    expect(isEditableTarget({ tagName: "BODY" })).toBe(false);
    expect(isEditableTarget({ tagName: "BUTTON" })).toBe(false);
  });
});
