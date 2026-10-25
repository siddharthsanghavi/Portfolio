const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };

function bad(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: JSON_HEADERS
  });
}

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    `SELECT id, title, body, created_at, updated_at, published
       FROM notes
      ORDER BY created_at DESC, id DESC`
  ).all();

  return new Response(JSON.stringify(results), { headers: JSON_HEADERS });
}

export async function onRequestPost({ request, env }) {
  const note = await request.json().catch(() => null);
  if (!note) return bad('body must be JSON');

  const title = (note.title || '').trim();
  const body = (note.body || '').trim();
  if (!title) return bad('title is required');
  if (!body) return bad('body is required');

  const createdAt = note.created_at || new Date().toISOString().slice(0, 10);
  const published = note.published === false ? 0 : 1;

  const row = await env.DB.prepare(
    `INSERT INTO notes (title, body, created_at, published)
     VALUES (?, ?, ?, ?)
     RETURNING id, title, body, created_at, updated_at, published`
  ).bind(title, body, createdAt, published).first();

  return new Response(JSON.stringify(row), { status: 201, headers: JSON_HEADERS });
}
