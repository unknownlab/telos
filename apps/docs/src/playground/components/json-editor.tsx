// START_MODULE_CONTRACT
//   PURPOSE: Give the reader a labelled text box for JSON input, which says that the text is decoded and never executed (C-002).
//   SCOPE: JsonEditor, a presentational controlled textarea with its label and hint. It holds no state of its own.
//   DEPENDS: M-DOCS-PLAYGROUND
//   LINKS: M-DOCS-PLAYGROUND
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   JsonEditor - a labelled monospace textarea for JSON input
// END_MODULE_MAP

import { Textarea } from "@/components/ui/textarea";

// START_CONTRACT: JsonEditor
//   PURPOSE: Let the reader edit JSON with a visible label, a hint and no spell checking, so that the text is typed as data.
//   INPUTS: { id: string - the element id, label: string - the visible label, value: string - the current text, onChange: (value: string) => void - called with each edit }
//   OUTPUTS: { JSX.Element - a label for the textarea, and the textarea with data-slot="input", aria-describedby the hint and rows 18 }
//   SIDE_EFFECTS: none. Each edit calls onChange; nothing runs on an edit.
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: JsonEditor
/** A labelled text box for JSON. It is decoded on a Validate press, never executed. */
export function JsonEditor({
  id,
  label,
  value,
  onChange,
}: {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  const hintId = `${id}-hint`;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <p id={hintId} className="text-sm text-muted-foreground">
        JSON. It is decoded, never executed.
      </p>
      <Textarea
        id={id}
        data-slot="input"
        className="font-mono text-sm"
        rows={18}
        spellCheck={false}
        autoComplete="off"
        aria-describedby={hintId}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </div>
  );
}
