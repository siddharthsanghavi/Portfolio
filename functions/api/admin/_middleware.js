// Cloudflare Access protects these routes at the edge. This verifies the Access
// token as well, so the API still refuses writes if the Access application is
// ever removed or misconfigured.
const TEAM_DOMAIN = 'fancy-queen-1c3a.cloudflareaccess.com';
const AUD = '1d19a20d5ef62a2200381d7def9462799c51e9cb84a70002737f7c0d3bdb30bc';

function bytesFromBase64Url(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function jsonFromBase64Url(value) {
  return JSON.parse(new TextDecoder().decode(bytesFromBase64Url(value)));
}

function tokenFrom(request) {
  const header = request.headers.get('cf-access-jwt-assertion');
  if (header) return header;

  const cookies = request.headers.get('cookie') || '';
  const match = cookies.match(/(?:^|;\s*)CF_Authorization=([^;]+)/);
  return match ? match[1] : null;
}

async function identify(request) {
  const token = tokenFrom(request);
  if (!token) return null;

  const [rawHeader, rawPayload, rawSignature] = token.split('.');
  if (!rawHeader || !rawPayload || !rawSignature) return null;

  let header, payload;
  try {
    header = jsonFromBase64Url(rawHeader);
    payload = jsonFromBase64Url(rawPayload);
  } catch {
    return null;
  }

  if (payload.iss !== `https://${TEAM_DOMAIN}`) return null;
  if (!payload.exp || payload.exp * 1000 < Date.now()) return null;

  const audience = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audience.includes(AUD)) return null;

  const certs = await fetch(`https://${TEAM_DOMAIN}/cdn-cgi/access/certs`, {
    cf: { cacheTtl: 3600, cacheEverything: true }
  }).then((r) => r.json());

  const jwk = (certs.keys || []).find((k) => k.kid === header.kid);
  if (!jwk) return null;

  const key = await crypto.subtle.importKey(
    'jwk',
    { kty: 'RSA', n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    bytesFromBase64Url(rawSignature),
    new TextEncoder().encode(`${rawHeader}.${rawPayload}`)
  );

  return valid ? payload.email || 'unknown' : null;
}

export async function onRequest({ request, next }) {
  const email = request.headers.get('cf-access-authenticated-user-email')
    || await identify(request);

  if (!email) {
    const seen = {
      emailHeader: !!request.headers.get('cf-access-authenticated-user-email'),
      jwtHeader: !!request.headers.get('cf-access-jwt-assertion'),
      jwtCookie: /CF_Authorization=/.test(request.headers.get('cookie') || '')
    };

    return new Response(JSON.stringify({ error: 'not authenticated', seen }), {
      status: 401,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  }

  return next();
}
