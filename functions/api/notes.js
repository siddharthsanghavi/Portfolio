const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    `SELECT id, title, body, created_at, updated_at
       FROM notes
      WHERE published = 1
      ORDER BY created_at DESC, id DESC`
  ).all();

  return new Response(JSON.stringify(results), {
    headers: { ...JSON_HEADERS, 'cache-control': 'public, max-age=60' }
  });
}
