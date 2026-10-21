import { createFileRoute } from "@tanstack/react-router";
import { PlaygroundIndex } from "@/playground/components/playground-index";
import { PLAYGROUND_SUMMARY, SCENARIOS } from "@/playground/registry";
import { pageTitle } from "@/lib/site";

export const Route = createFileRoute("/playground/")({
  head: () => ({
    meta: [
      { title: pageTitle("Playground") },
      { name: "description", content: PLAYGROUND_SUMMARY },
    ],
  }),
  component: () => <PlaygroundIndex scenarios={SCENARIOS} />,
});
