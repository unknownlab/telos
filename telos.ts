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

export const repository = Module.make({
  id: "telos:repository",
  description:
    "The Telos repository holds the framework, its packs and the calculator proof as one model.",
  properties: {
    purpose: "Holds the Telos framework, its packs and the calculator proof.",
    sources: ["telos.ts"],
    packages: [],
  },
  contains: [kernel, cliPack, agentPack, webPack, calculator, tooling],
});

export const repositoryModel = buildModel(repository);
