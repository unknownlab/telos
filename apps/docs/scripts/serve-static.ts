// START_MODULE_CONTRACT
//   PURPOSE: Serve the built static site from dist/client on the loopback address, so that the browser tests run against the files the build produced and never against a dev server (NFR-005, C-008).
//   SCOPE: resolveRequestPath, which maps a URL path to a file under the site root, createStaticServer, which answers GET and HEAD with those files and anything else with 405, and the command line that starts it on 127.0.0.1. Out: building the site and the Playwright tests.
//   DEPENDS: none
//   LINKS: M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   resolveRequestPath - maps a URL path to a regular file under the site root, or null
//   createStaticServer - starts the static server over a site root
// END_MODULE_MAP

import { statSync } from "node:fs";
import { join, posix, resolve, sep } from "node:path";

const DEFAULT_ROOT = resolve(import.meta.dir, "../dist/client");
const DEFAULT_PORT = 4173;
const HOSTNAME = "127.0.0.1";
const NOT_FOUND_PAGE = "not-found/index.html";

const TEXT_TYPE = "text/plain; charset=utf-8";
const JSON_TYPE = "application/json";
const HTML_TYPE = "text/html; charset=utf-8";

// START_CONTRACT: isRegularFile
//   PURPOSE: Tell whether a path names a regular file, so that a directory or a missing path is never served as a file.
//   INPUTS: { path: string - an absolute file system path }
//   OUTPUTS: { boolean - true only for an existing regular file }
//   SIDE_EFFECTS: reads file metadata
//   LINKS: M-DOCS-SITE
// END_CONTRACT: isRegularFile
function isRegularFile(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

// START_CONTRACT: resolveRequestPath
//   PURPOSE: Map a request path to the file that serves it, and refuse any path that could leave the site root.
//   INPUTS: { root: string - the absolute site root, pathname: string - the URL path, not yet decoded }
//   OUTPUTS: { string | null - the file path, or null when the path is malformed, contains a parent segment or a NUL character, or names no file }
//   SIDE_EFFECTS: reads file metadata
//   LINKS: M-DOCS-SITE
// END_CONTRACT: resolveRequestPath
export function resolveRequestPath(
  root: string,
  pathname: string,
): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (decoded.includes("\0")) return null;
  if (decoded.split("/").some((segment) => segment === "..")) return null;

  const normalized = posix.normalize(`/${decoded}`);
  const trimmed =
    normalized.length > 1 && normalized.endsWith("/")
      ? normalized.slice(0, -1)
      : normalized;

  const rootPath = resolve(root);
  const candidates = [
    join(rootPath, trimmed),
    join(rootPath, trimmed, "index.html"),
  ];
  for (const candidate of candidates) {
    const full = resolve(candidate);
    if (full !== rootPath && !full.startsWith(`${rootPath}${sep}`)) continue;
    if (isRegularFile(full)) return full;
  }
  return null;
}

// START_CONTRACT: fileResponse
//   PURPOSE: Build the response for a resolved file, with the content type the site needs for its text and JSON files.
//   INPUTS: { path: string - an existing regular file, status: number - the status to send }
//   OUTPUTS: { Response - the file as its body, with status and content type }
//   SIDE_EFFECTS: none until the body is read
//   LINKS: M-DOCS-SITE
// END_CONTRACT: fileResponse
function fileResponse(path: string, status: number): Response {
  const file = Bun.file(path);
  if (path.endsWith(".txt")) {
    return new Response(file, {
      status,
      headers: { "content-type": TEXT_TYPE },
    });
  }
  if (path.endsWith(".json")) {
    return new Response(file, {
      status,
      headers: { "content-type": JSON_TYPE },
    });
  }
  return new Response(file, { status });
}

// START_CONTRACT: notFoundResponse
//   PURPOSE: Answer a path with no file by the prerendered not-found page, with status 404.
//   INPUTS: { root: string - the absolute site root, method: string - the request method }
//   OUTPUTS: { Response - the not-found page with status 404, or a plain 404 when the build has no not-found page }
//   SIDE_EFFECTS: reads file metadata
//   LINKS: M-DOCS-SITE
// END_CONTRACT: notFoundResponse
function notFoundResponse(root: string, method: string): Response {
  const page = join(resolve(root), NOT_FOUND_PAGE);
  const body = method === "HEAD" ? null : Bun.file(page);
  if (!isRegularFile(page)) {
    return new Response("Not found", {
      status: 404,
      headers: { "content-type": TEXT_TYPE },
    });
  }
  return new Response(body, {
    status: 404,
    headers: { "content-type": HTML_TYPE },
  });
}

// START_CONTRACT: createStaticServer
//   PURPOSE: Start a server that answers GET and HEAD from the site root, the not-found page with status 404 for any other path, and 405 for any other method.
//   INPUTS: { options: { root: string - the site root, port: number - the port, 0 for an ephemeral port, hostname?: string - the bind address, 127.0.0.1 by default } }
//   OUTPUTS: { ReturnType<typeof Bun.serve> - the running server }
//   SIDE_EFFECTS: binds a TCP port until the server is stopped
//   LINKS: M-DOCS-SITE
// END_CONTRACT: createStaticServer
export function createStaticServer(options: {
  readonly root: string;
  readonly port: number;
  readonly hostname?: string;
}): ReturnType<typeof Bun.serve> {
  const root = resolve(options.root);
  return Bun.serve({
    port: options.port,
    hostname: options.hostname ?? HOSTNAME,
    fetch(request) {
      if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response("Method not allowed", {
          status: 405,
          headers: { allow: "GET, HEAD", "content-type": TEXT_TYPE },
        });
      }
      const { pathname } = new URL(request.url);
      const file = resolveRequestPath(root, pathname);
      if (file !== null) return fileResponse(file, 200);
      return notFoundResponse(root, request.method);
    },
  });
}

interface CliOptions {
  readonly port: number;
  readonly root: string;
}

// START_CONTRACT: parseCliArgs
//   PURPOSE: Read the --port and --root options of the command line, with the defaults the Playwright configuration relies on.
//   INPUTS: { args: ReadonlyArray<string> - the arguments after the script name }
//   OUTPUTS: { CliOptions - the port and the site root }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: parseCliArgs
function parseCliArgs(args: ReadonlyArray<string>): CliOptions {
  let port = DEFAULT_PORT;
  let root = DEFAULT_ROOT;
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    const value = args[index + 1];
    if (flag === "--port" && value !== undefined) {
      const parsed = Number(value);
      if (!Number.isInteger(parsed) || parsed < 0 || parsed > 65535) {
        throw new Error(`serve-static: invalid port "${value}"`);
      }
      port = parsed;
      index += 1;
    } else if (flag === "--root" && value !== undefined) {
      root = resolve(value);
      index += 1;
    } else {
      throw new Error(`serve-static: unknown argument "${flag ?? ""}"`);
    }
  }
  return { port, root };
}

if (import.meta.main) {
  let options: CliOptions;
  try {
    options = parseCliArgs(Bun.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(2);
  }
  const indexPage = join(options.root, "index.html");
  if (!isRegularFile(indexPage)) {
    console.error(
      `serve-static: ${indexPage} not found. Build first: bun run --cwd apps/docs build`,
    );
    process.exit(1);
  }
  const server = createStaticServer({ root: options.root, port: options.port });
  console.log(`serve-static: http://${HOSTNAME}:${server.port}/`);
}
