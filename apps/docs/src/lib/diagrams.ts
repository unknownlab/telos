// START_MODULE_CONTRACT
//   PURPOSE: Hold the Mermaid settings and the selector of diagram source blocks, without importing Mermaid itself.
//   SCOPE: MERMAID_SELECTOR and MERMAID_CONFIG. The library is loaded only by the renderer, on pages that have a diagram.
//   DEPENDS: none
//   LINKS: M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   MERMAID_SELECTOR - the selector of the code blocks that hold diagram source
//   MERMAID_CONFIG - the Mermaid settings: strict security, no render on load, neutral theme
// END_MODULE_MAP

// START_CONTRACT: MERMAID_SELECTOR
//   PURPOSE: Find the diagram source blocks that the content pipeline writes for mermaid fences.
//   INPUTS: none (constant)
//   OUTPUTS: { string - the CSS selector of a code element with the language-mermaid class inside a pre element }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: MERMAID_SELECTOR
export const MERMAID_SELECTOR = "pre > code.language-mermaid";

// START_CONTRACT: MERMAID_CONFIG
//   PURPOSE: Configure Mermaid for the site: strict security, rendering only when asked, and the neutral theme, which reads on a light card in both page themes.
//   INPUTS: none (constant)
//   OUTPUTS: { object - the settings passed to mermaid.initialize }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: MERMAID_CONFIG
export const MERMAID_CONFIG = {
  startOnLoad: false,
  securityLevel: "strict",
  theme: "neutral",
} as const;
