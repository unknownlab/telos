import { createFileRoute } from "@tanstack/react-router";
import { PlaygroundPage } from "@/playground/components/playground-page";
import { PLAYGROUND_INTRO } from "@/playground/registry";
import { pageTitle } from "@/lib/site";

export const Route = createFileRoute("/playground/")({
  head: () => ({
    meta: [
      { title: pageTitle("Playground") },
      { name: "description", content: PLAYGROUND_INTRO },
    ],
  }),
  component: PlaygroundPage,
});
