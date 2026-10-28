export async function onRequestGet({ params, env, next }) {
  const object = await env.IMAGES.get(params.key);

  // Not an upload — fall through to the static file of the same name.
  if (!object) return next();

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');

  return new Response(object.body, { headers });
}
