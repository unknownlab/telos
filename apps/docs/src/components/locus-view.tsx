// START_MODULE_CONTRACT
//   PURPOSE: Show one Locus of the repository model on its own inspector page: its extensions, properties, relations, capability contracts, Archetypes, verifications and diagnostics (FR-012).
//   SCOPE: LocusView, a presentational component over one LocusDescription and its verification rows. It never reads the report or the generated files.
//   DEPENDS: M-DOCS-SITE
//   LINKS: M-DOCS-INSPECTOR
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   LocusView - the page body of one Locus
// END_MODULE_MAP

import { Link } from "@tanstack/react-router";
import type {
  LocusDescription,
  RelationDescription,
  VerificationDescription,
} from "@telos/kernel";
import { KnowledgeBadge } from "@/components/knowledge-badge";
import { locusSlug } from "@/lib/locus-slug";

// START_CONTRACT: LocusView
//   PURPOSE: Render one Locus with every part the inspector shows, in the order the contract names.
//   INPUTS: { locus: LocusDescription - the Locus, verifications: ReadonlyArray<VerificationDescription> - its verification rows }
//   OUTPUTS: { JSX.Element - a main with data-page="inspector-locus" and data-locus-id }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-INSPECTOR
// END_CONTRACT: LocusView
export function LocusView({
  locus,
  verifications,
}: {
  readonly locus: LocusDescription;
  readonly verifications: ReadonlyArray<VerificationDescription>;
}) {
  return (
    <main
      id="content"
      data-page="inspector-locus"
      data-locus-id={locus.id}
      className="flex flex-col gap-8 py-8"
    >
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{locus.id}</h1>
        <p className="text-muted-foreground">
          {locus.description ?? "No description."}
        </p>
        <nav className="flex flex-wrap gap-4 text-sm">
          {locus.container !== null ? (
            <Link
              to="/inspector/$slug"
              params={{ slug: locusSlug(locus.container) }}
              className="underline underline-offset-4"
            >
              Contained in {locus.container}
            </Link>
          ) : null}
          <Link to="/inspector" className="underline underline-offset-4">
            All Loci
          </Link>
        </nav>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Extensions</h2>
        {locus.extensions.length === 0 ? (
          <p>No extensions.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {locus.extensions.map((extension) => (
              <li key={extension.id} data-extension-id={extension.id}>
                <code>{extension.id}</code> {extension.description}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Properties</h2>
        <pre
          data-slot="properties"
          className="overflow-x-auto rounded-md border p-4 text-sm"
        >
          {JSON.stringify(locus.properties, null, 2)}
        </pre>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Relations</h2>
        <RelationTable
          title="Outgoing"
          empty="No outgoing relations."
          rows={locus.relations.outgoing}
        />
        <RelationTable
          title="Incoming"
          empty="No incoming relations."
          rows={locus.relations.incoming}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Capabilities</h2>
        {locus.capabilities.length === 0 ? (
          <p>No capabilities.</p>
        ) : (
          locus.capabilities.map((capability) => (
            <article
              key={capability.name}
              data-capability={capability.name}
              className="flex flex-col gap-3 rounded-lg border p-4"
            >
              <h3 className="text-lg font-semibold">{capability.name}</h3>
              <p>{capability.description}</p>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span data-slot="effect">{capability.effect}</span>
                <KnowledgeBadge knowledge={capability.knowledge} />
                <span>
                  {capability.implemented ? "Implemented" : "Not implemented"}
                </span>
              </div>
              <details>
                <summary>Input schema</summary>
                <pre
                  data-slot="input-schema"
                  className="overflow-x-auto text-sm"
                >
                  {JSON.stringify(capability.input.schema, null, 2)}
                </pre>
              </details>
              <details>
                <summary>Output schema</summary>
                <pre
                  data-slot="output-schema"
                  className="overflow-x-auto text-sm"
                >
                  {JSON.stringify(capability.output.schema, null, 2)}
                </pre>
              </details>
              {capability.errors.length === 0 ? (
                <p>No declared errors.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {capability.errors.map((error) => (
                    <li key={error.tag} data-error-tag={error.tag}>
                      {error.tag}
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-sm">
                Contract digest:{" "}
                <code data-slot="contract-digest">
                  {capability.contractDigest}
                </code>
              </p>
              {capability.exposedBy.length === 0 ? (
                <p>Not exposed by any interface.</p>
              ) : (
                <ul className="flex flex-col gap-1 text-sm">
                  {capability.exposedBy.map((exposure) => (
                    <li
                      key={`${exposure.locus}:${exposure.relationType}`}
                      data-exposed-by={exposure.locus}
                    >
                      {exposure.locus} via {exposure.relationType}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Archetypes</h2>
        {locus.archetypes.length === 0 ? (
          <p>No Archetype applies to this Locus.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {locus.archetypes.map((archetype) => (
              <li key={archetype.id} data-archetype={archetype.id}>
                <strong>{archetype.id}</strong> {archetype.description}
                <ul className="mt-2 flex flex-col gap-1 pl-4">
                  {archetype.rules.map((rule) => (
                    <li key={rule.id} data-rule={rule.id}>
                      <code>{rule.id}</code> ({rule.method}) {rule.description}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Verification</h2>
        {verifications.length === 0 ? (
          <p>No Archetype applies to this Locus.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th scope="col">Archetype</th>
                  <th scope="col">Rule</th>
                  <th scope="col">Method</th>
                  <th scope="col">Outcome</th>
                  <th scope="col">Knowledge</th>
                  <th scope="col">Message</th>
                </tr>
              </thead>
              <tbody>
                {verifications.map((row) => (
                  <tr
                    key={`${row.archetype}:${row.rule}`}
                    data-verification-outcome={row.outcome}
                  >
                    <td>{row.archetype}</td>
                    <td>{row.rule}</td>
                    <td>{row.method}</td>
                    <td>{row.outcome}</td>
                    <td>
                      <KnowledgeBadge knowledge={row.knowledge} />
                    </td>
                    <td>{row.message ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Diagnostics</h2>
        {locus.diagnostics.length === 0 ? (
          <p>No diagnostics.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th scope="col">Code</th>
                  <th scope="col">Severity</th>
                  <th scope="col">Path</th>
                  <th scope="col">Message</th>
                </tr>
              </thead>
              <tbody>
                {locus.diagnostics.map((diagnostic) => (
                  <tr
                    key={`${diagnostic.code}:${diagnostic.path}`}
                    data-diagnostic-code={diagnostic.code}
                  >
                    <td>{diagnostic.code}</td>
                    <td>{diagnostic.severity}</td>
                    <td>{diagnostic.path}</td>
                    <td>{diagnostic.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

// START_CONTRACT: RelationTable
//   PURPOSE: Show one direction of the relations of a Locus as a table with type, endpoints, invocation grant and knowledge.
//   INPUTS: { title: string - the subheading, empty: string - the text when there are no rows, rows: ReadonlyArray<RelationDescription> - the relations }
//   OUTPUTS: { JSX.Element - an h3 with the title and a table or the empty text }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-INSPECTOR
// END_CONTRACT: RelationTable
function RelationTable({
  title,
  empty,
  rows,
}: {
  readonly title: string;
  readonly empty: string;
  readonly rows: ReadonlyArray<RelationDescription>;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-lg font-semibold">{title}</h3>
      {rows.length === 0 ? (
        <p>{empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th scope="col">Type</th>
                <th scope="col">From</th>
                <th scope="col">Target</th>
                <th scope="col">Grants invocation</th>
                <th scope="col">Knowledge</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={`${row.type}:${row.from}:${row.target.locus}:${row.target.capability ?? ""}`}
                  data-relation-type={row.type}
                >
                  <td>{row.type}</td>
                  <td>{row.from}</td>
                  <td>
                    {row.target.capability === null
                      ? row.target.locus
                      : `${row.target.locus}#${row.target.capability}`}
                  </td>
                  <td>{row.grantsInvocation ? "yes" : "no"}</td>
                  <td>
                    <KnowledgeBadge knowledge={row.knowledge} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
