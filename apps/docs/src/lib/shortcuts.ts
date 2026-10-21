// START_MODULE_CONTRACT
//   PURPOSE: Decide which key presses open the search dialog, and never take a key that the reader is typing into a field.
//   SCOPE: KeyLike, isEditableTarget and isSearchShortcut.
//   DEPENDS: none
//   LINKS: M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   KeyLike - the parts of a keyboard event that the shortcut rule reads
//   isEditableTarget - true for a text field or a content-editable element
//   isSearchShortcut - true for slash outside a field, or Ctrl or Meta with K
// END_MODULE_MAP

/** The parts of a keyboard event that the shortcut rule reads. */
export interface KeyLike {
  readonly key: string;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly altKey: boolean;
  readonly target: unknown;
}

// START_CONTRACT: isEditableTarget
//   PURPOSE: Tell whether a key press is typed into a field, so that the shortcut keys stay typeable there.
//   INPUTS: { target: unknown - the event target }
//   OUTPUTS: { boolean - true for INPUT, TEXTAREA, SELECT and content-editable elements }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: isEditableTarget
export function isEditableTarget(target: unknown): boolean {
  if (typeof target !== "object" || target === null) return false;
  const element = target as { tagName?: unknown; isContentEditable?: unknown };
  if (element.isContentEditable === true) return true;
  const tag =
    typeof element.tagName === "string" ? element.tagName.toUpperCase() : "";
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

// START_CONTRACT: isSearchShortcut
//   PURPOSE: Decide whether a key press opens the search dialog.
//   INPUTS: { event: KeyLike - the key event }
//   OUTPUTS: { boolean - true for slash with no modifier outside a field, or K with Ctrl or Meta and no Alt }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: isSearchShortcut
export function isSearchShortcut(event: KeyLike): boolean {
  if (event.altKey) return false;
  if (event.key === "/") {
    return !event.ctrlKey && !event.metaKey && !isEditableTarget(event.target);
  }
  if (event.key === "k" || event.key === "K") {
    return event.ctrlKey || event.metaKey;
  }
  return false;
}
