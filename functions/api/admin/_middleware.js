// Cloudflare Access protects these routes at the edge. This is a second check so
// the API still refuses writes if the Access application is ever removed.
export async function onRequest({ request, next }) {
  const email = request.headers.get('cf-access-authenticated-user-email');

  if (!email) {
    return new Response(JSON.stringify({ error: 'not authenticated' }), {
      status: 401,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  }

  return next();
}
