// START_MODULE_CONTRACT
//   PURPOSE: Describe the Telos repository as a semantic model: its Loci, their source claims, external packages and dependency relations.
//   SCOPE: The Locus definitions and the repository model only. It imports only the kernel and the calculator, and never runs a check.
//   DEPENDS: M-KERNEL-API, M-CALC-INTERFACES
//   LINKS: M-REPOSITORY-MODEL, V-M-REPOSITORY-MODEL
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   kernel - the telos:kernel Locus over the kernel package
//   cliPack - the telos:cli-pack Locus over the command line pack
//   agentPack - the telos:agent-pack Locus over the agent pack
//   webPack - the telos:web-pack Locus over the web pack
//   calculator - the telos:calculator Locus that contains the calculator application
//   tooling - the telos:tooling Locus over the repository scripts
//   docsSite - the telos:docs-site Locus over the documentation site
//   legacyLocus - the telos:legacy-locus Locus over the previous Locus package
//   repository - the telos:repository Locus that contains every other Locus
//   repositoryModel - the built semantic model of repository
// END_MODULE_MAP

import {
  External,
  Locus,
  Purpose,
  Source,
  SourceDependsOn,
  buildModel,
} from "@telos/kernel";
import { app as calculatorApp } from "@telos/calculator";

const Module = Locus.extend(Purpose, Source, External);

// START_CONTRACT: kernel
//   PURPOSE: Declare the telos:kernel Locus that owns the kernel package sources.
//   INPUTS: none
//   OUTPUTS: { LocusDefinition - telos:kernel with its sources and externals }
//   SIDE_EFFECTS: none
//   LINKS: M-REPOSITORY-MODEL
// END_CONTRACT: kernel
export const kernel = Module.make({
  id: "telos:kernel",
  description:
    "The kernel package builds, checks, describes, verifies and invokes semantic models with Effect.",
  properties: {
    purpose: "Builds, checks, describes, verifies and invokes semantic models.",
    sources: ["packages/kernel/src/**/*.ts", "packages/kernel/test/**/*.ts"],
    packages: ["effect"],
  },
});

export const cliPack = Module.make({
  id: "telos:cli-pack",
  description:
    "The CLI pack reads CLI Loci and derives command-line interfaces from their capabilities.",
  properties: {
    purpose:
      "Derives command-line interfaces from capabilities exposed by CLI Loci.",
    sources: ["packages/cli/src/**/*.ts", "packages/cli/test/**/*.ts"],
    packages: ["effect"],
  },
  relations: [SourceDependsOn.to(kernel)],
});

export const agentPack = Module.make({
  id: "telos:agent-pack",
  description:
    "The agent pack reads agent Loci and derives agent tools and an MCP server from their capabilities.",
  properties: {
    purpose:
      "Derives agent tools and an MCP server from capabilities exposed by agent Loci.",
    sources: ["packages/agent/src/**/*.ts", "packages/agent/test/**/*.ts"],
    packages: ["effect"],
  },
  relations: [SourceDependsOn.to(kernel)],
});

export const webPack = Module.make({
  id: "telos:web-pack",
  description:
    "The web pack reads web Loci and derives form models for web pages from their capabilities.",
  properties: {
    purpose: "Derives web form models from capabilities exposed by web Loci.",
    sources: ["packages/web/src/**/*.ts", "packages/web/test/**/*.ts"],
    packages: ["effect"],
  },
  relations: [SourceDependsOn.to(kernel)],
});

export const calculator = Module.make({
  id: "telos:calculator",
  description:
    "The calculator application contains the arithmetic Locus and its command-line, web and agent interfaces.",
  properties: {
    purpose:
      "Proves that one arithmetic implementation serves a command line, a web page and agent tools.",
    sources: [
      "apps/calculator/src/**/*.ts",
      "apps/calculator/bin/**/*.ts",
      "apps/calculator/test/**/*.ts",
    ],
    packages: ["effect"],
  },
  relations: [
    SourceDependsOn.to(kernel),
    SourceDependsOn.to(cliPack),
    SourceDependsOn.to(agentPack),
    SourceDependsOn.to(webPack),
  ],
  contains: [calculatorApp],
});

export const tooling = Module.make({
  id: "telos:tooling",
  description:
    "The tooling Locus holds the repository scripts: the review gate, the Bun version guard and the telos command.",
  properties: {
    purpose:
      "Runs the repository checks, the review gate and the telos command.",
    sources: ["scripts/**/*.ts"],
    packages: ["effect"],
  },
  relations: [SourceDependsOn.to(kernel)],
});

export const legacyLocus = Module.make({
  id: "telos:legacy-locus",
  description:
    "The legacy locus package holds the previous Locus model, kept until the documentation no longer uses it.",
  properties: {
    purpose:
      "Keeps the previous Locus package until the documentation no longer uses it.",
    sources: [
      "packages/locus/src/**/*.ts",
      "packages/locus/test/**/*.ts",
      "packages/locus/specs/**/*.ts",
    ],
    packages: ["effect"],
  },
});

export const docsSite = Module.make({
  id: "telos:docs-site",
  description:
    "A TanStack Start site that renders the foundation documents, the playground on the real kernel and the semantic report.",
  properties: {
    purpose:
      "Builds the documentation site from the foundation documents and the semantic report.",
    sources: [
      "apps/docs/*.ts",
      "apps/docs/src/**/*.ts",
      "apps/docs/src/**/*.tsx",
      "apps/docs/scripts/**/*.ts",
      "apps/docs/test/**/*.ts",
      "apps/docs/test/**/*.tsx",
      "apps/docs/e2e/**/*.ts",
    ],
    packages: [
      "@axe-core/playwright",
      "@playwright/test",
      "@tailwindcss/vite",
      "@tanstack/react-router",
      "@tanstack/react-start",
      "@vitejs/plugin-react",
      "class-variance-authority",
      "clsx",
      "effect",
      "lucide-react",
      "mermaid",
      "minisearch",
      "radix-ui",
      "react",
      "react-dom",
      "tailwind-merge",
      "vite",
    ],
  },
  relations: [
    SourceDependsOn.to(kernel),
    SourceDependsOn.to(webPack),
    SourceDependsOn.to(calculator),
    SourceDependsOn.to(legacyLocus),
  ],
});

export const repository = Module.make({
  id: "telos:repository",
  description:
    "The Telos repository holds the framework, its packs, the calculator proof and the documentation site as one model.",
  properties: {
    purpose:
      "Holds the Telos framework, its packs, the calculator proof and the documentation site.",
    sources: ["telos.ts"],
    packages: [],
  },
  contains: [
    kernel,
    cliPack,
    agentPack,
    webPack,
    calculator,
    tooling,
    docsSite,
    legacyLocus,
  ],
});

export const repositoryModel = buildModel(repository);
