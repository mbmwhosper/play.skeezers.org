const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS',
  'access-control-allow-headers': '*',
  'access-control-expose-headers': '*',
};

function withCors(headers = new Headers()) {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => headers.set(key, value));
  return headers;
}

function badRequest(message, status = 400) {
  return new Response(message, {
    status,
    headers: withCors(new Headers({ 'content-type': 'text/plain; charset=utf-8' })),
  });
}

function extractTargetUrl(requestUrl) {
  const url = new URL(requestUrl);
  const prefix = '/service/proxy/';
  if (!url.pathname.startsWith(prefix)) return null;
  const encoded = url.pathname.slice(prefix.length);
  if (!encoded) return null;
  try {
    return decodeURIComponent(encoded);
  } catch {
    return null;
  }
}

function isAllowedProtocol(targetUrl) {
  return /^https?:\/\//i.test(targetUrl || '');
}

function buildUpstreamRequest(request, targetUrl) {
  const incoming = new URL(request.url);
  const upstream = new URL(targetUrl);
  upstream.search = incoming.search;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.set('origin', upstream.origin);
  headers.set('referer', upstream.origin + '/');

  return new Request(upstream.toString(), {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    redirect: 'follow',
  });
}

async function handleProxy(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: withCors(new Headers()) });
  }

  const targetUrl = extractTargetUrl(request.url);
  if (!targetUrl) return badRequest('Missing proxy target URL.');
  if (!isAllowedProtocol(targetUrl)) return badRequest('Only http and https targets are allowed.');

  const upstreamRequest = buildUpstreamRequest(request, targetUrl);
  const upstreamResponse = await fetch(upstreamRequest);
  const headers = withCors(new Headers(upstreamResponse.headers));
  headers.delete('content-security-policy');
  headers.delete('x-frame-options');
  headers.delete('content-length');

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers,
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/service/proxy/')) {
      return handleProxy(request);
    }

    return env.ASSETS.fetch(request);
  },
};
