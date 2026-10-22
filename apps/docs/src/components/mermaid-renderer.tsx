// START_MODULE_CONTRACT
//   PURPOSE: Replace each Mermaid source block with a rendered SVG figure when JavaScript runs, keeping the source one click away, and load Mermaid only on pages that have a diagram.
//   SCOPE: MermaidRenderer, which renders nothing itself and scans the page for diagram source blocks on mount and whenever new content is inserted.
//   DEPENDS: M-DOCS-SITE
//   LINKS: M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   MermaidRenderer - the site-wide renderer of Mermaid diagram blocks
// END_MODULE_MAP

import { useEffect } from "react";
import { MERMAID_CONFIG, MERMAID_SELECTOR } from "@/lib/diagrams";

const FIGURE_CLASS = "my-6 overflow-x-auto rounded-md bg-white p-4 text-black";

// Diagram ids must be unique within the document, so the counter lives for the whole session.
let diagramCount = 0;

// START_CONTRACT: MermaidRenderer
//   PURPOSE: Render every diagram source block of the page once, after Mermaid is loaded on demand, and keep the source visible when a diagram fails.
//   INPUTS: none
//   OUTPUTS: { null - nothing is rendered into the React tree }
//   SIDE_EFFECTS: on mount and on each DOM insertion, looks for unprocessed diagram blocks; loads Mermaid only when one exists; replaces each block with an SVG figure and a source disclosure; sets data-mermaid on each block
//   LINKS: M-DOCS-SITE
// END_CONTRACT: MermaidRenderer
export function MermaidRenderer() {
  useEffect(() => {
    let disposed = false;
    let queue: Promise<void> = Promise.resolve();

    function scan() {
      if (disposed) return;
      const pres: HTMLElement[] = [];
      for (const code of document.querySelectorAll(MERMAID_SELECTOR)) {
        const pre = code.closest("pre");
        if (pre instanceof HTMLElement && pre.dataset.mermaid === undefined) {
          pre.dataset.mermaid = "pending";
          pres.push(pre);
        }
      }
      if (pres.length === 0) return;
      queue = queue.then(() => renderAll(pres));
    }

    async function renderAll(pres: ReadonlyArray<HTMLElement>) {
      const mermaid = await import("mermaid").then(
        (loaded) => loaded.default,
        () => null,
      );
      if (mermaid === null) {
        for (const pre of pres) pre.dataset.mermaid = "error";
        console.warn(
          "Mermaid could not be loaded; the diagram sources are shown.",
        );
        return;
      }
      mermaid.initialize({ ...MERMAID_CONFIG });
      for (const pre of pres) {
        if (disposed) return;
        if (!pre.isConnected) continue;
        const source = pre.querySelector("code")?.textContent ?? "";
        diagramCount += 1;
        try {
          const { svg } = await mermaid.render(
            `telos-diagram-${diagramCount}`,
            source,
          );
          if (disposed) return;
          showFigure(pre, svg);
        } catch (error) {
          pre.dataset.mermaid = "error";
          console.warn(
            "A diagram could not be rendered; its source is shown.",
            error,
          );
        }
      }
    }

    scan();
    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      disposed = true;
      observer.disconnect();
    };
  }, []);

  return null;
}

// Replaces a source block with its rendered figure, and moves the source into a disclosure after it.
function showFigure(pre: HTMLElement, svg: string) {
  const figure = document.createElement("figure");
  figure.dataset.mermaid = "rendered";
  figure.className = FIGURE_CLASS;
  figure.innerHTML = svg;

  const disclosure = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = "Diagram source";
  disclosure.append(summary);

  pre.dataset.mermaid = "rendered";
  pre.replaceWith(figure);
  disclosure.append(pre);
  figure.after(disclosure);
}
