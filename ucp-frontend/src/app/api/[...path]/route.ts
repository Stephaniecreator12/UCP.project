export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const getBackendBase = (): string => {
  const raw =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://127.0.0.1:8000";

  // Accept either a pure backend origin (`http://host:8000`) or a value
  // mistakenly ending with `/api`, since the proxied path already contains it.
  return raw.replace(/\/+$/, "").replace(/\/api$/i, "");
};

async function proxy(request: Request): Promise<Response> {
  const backendBase = getBackendBase();
  const url = new URL(request.url);

  // Prevent redirect loops with Django's APPEND_SLASH.
  const normalizedPath =
    url.pathname.startsWith("/api/") && !url.pathname.endsWith("/")
      ? `${url.pathname}/`
      : url.pathname;

  const target = `${backendBase}${normalizedPath}${url.search}`;

  const upstreamHeaders = new Headers(request.headers);
  upstreamHeaders.delete("host");
  upstreamHeaders.delete("content-length");
  upstreamHeaders.set("accept-encoding", "identity");
  for (const h of HOP_BY_HOP_HEADERS) upstreamHeaders.delete(h);

  const method = request.method.toUpperCase();
  // Avoid Node fetch streaming body requirements by buffering the body.
  let body: BodyInit | undefined = undefined;
  if (method !== "GET" && method !== "HEAD") {
    const buf = await request.arrayBuffer().catch(() => null);
    if (buf && buf.byteLength > 0) body = Buffer.from(buf);
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method,
      headers: upstreamHeaders,
      body,
      redirect: "manual",
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return Response.json(
      { error: "Backend indisponible", target, detail },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers(upstream.headers);
  for (const h of HOP_BY_HOP_HEADERS) responseHeaders.delete(h);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export async function GET(request: Request): Promise<Response> {
  return proxy(request);
}
export async function POST(request: Request): Promise<Response> {
  return proxy(request);
}
export async function PUT(request: Request): Promise<Response> {
  return proxy(request);
}
export async function PATCH(request: Request): Promise<Response> {
  return proxy(request);
}
export async function DELETE(request: Request): Promise<Response> {
  return proxy(request);
}
export async function OPTIONS(request: Request): Promise<Response> {
  return proxy(request);
}
