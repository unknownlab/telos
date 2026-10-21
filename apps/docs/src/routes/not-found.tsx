import { createFileRoute } from "@tanstack/react-router";
import { NotFound } from "@/components/not-found";
import { pageTitle } from "@/lib/site";

export const Route = createFileRoute("/not-found")({
  head: () => ({
    meta: [
      { title: pageTitle("Page not found") },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotFoundPage,
});

function NotFoundPage() {
  return <NotFound />;
}
