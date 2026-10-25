export async function onRequestGet({ params, env }) {
  const object = await env.IMAGES.get(params.key);
  if (!object) return new Response('not found', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');

  return new Response(object.body, { headers });
}
