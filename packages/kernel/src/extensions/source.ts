import { Schema } from "effect";
import { Extension } from "../extension";
import { RelationType } from "../relation";

export const SourceDependsOn = RelationType.make("source.depends-on", {
  description:
    "The source files of this Locus import code owned by the target Locus.",
  target: "locus",
});

export const Source = Extension.make("telos.source", {
  description:
    "Claims source files for a Locus by repository-relative glob patterns.",
  properties: { sources: Schema.Array(Schema.String) },
  relationTypes: [SourceDependsOn],
});

export const External = Extension.make("telos.external", {
  description:
    "Declares third-party packages this Locus may import, without modelling their internals.",
  properties: { packages: Schema.Array(Schema.String) },
});
