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
  return raw.replace(/\/+$/, "");
};

async function proxy(request: Request): Promise<Response> {
  const backendBase = getBackendBase();
  const url = new URL(request.url);
  // Next canonicalizes URLs without trailing slash, while Django commonly
  // enforces APPEND_SLASH. Prevent redirect loops by normalizing here.
  const normalizedPath =
    url.pathname.startsWith("/api/ppm/") && !url.pathname.endsWith("/")
      ? `${url.pathname}/`
      : url.pathname;

  const target = `${backendBase}${normalizedPath}${url.search}`;

  const upstreamHeaders = new Headers(request.headers);
  upstreamHeaders.delete("host");
  upstreamHeaders.delete("content-length");
  upstreamHeaders.set("accept-encoding", "identity");
  for (const h of HOP_BY_HOP_HEADERS) upstreamHeaders.delete(h);

  const method = request.method.toUpperCase();
  // Node's fetch (undici) requires `duplex: "half"` when forwarding a streaming body.
  // To avoid that (and to keep the proxy simple), buffer the body for non-GET/HEAD.
  let body: BodyInit | undefined = undefined;
  if (method !== "GET" && method !== "HEAD") {
    const buf = await request.arrayBuffer().catch(() => null);
    if (buf && buf.byteLength > 0) body = Buffer.from(buf);
  }

  const upstream = await fetch(target, {
    method,
    headers: upstreamHeaders,
    body,
    redirect: "manual",
  });

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
