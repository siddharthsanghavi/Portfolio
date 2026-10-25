const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };

function bad(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: JSON_HEADERS
  });
}

export async function onRequestPut({ request, params, env }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) return bad('bad id');

  const note = await request.json().catch(() => null);
  if (!note) return bad('body must be JSON');

  const title = (note.title || '').trim();
  const body = (note.body || '').trim();
  if (!title) return bad('title is required');
  if (!body) return bad('body is required');

  const createdAt = note.created_at || new Date().toISOString().slice(0, 10);
  const published = note.published === false ? 0 : 1;

  const row = await env.DB.prepare(
    `UPDATE notes
        SET title = ?, body = ?, created_at = ?, published = ?, updated_at = ?
      WHERE id = ?
      RETURNING id, title, body, created_at, updated_at, published`
  ).bind(title, body, createdAt, published, new Date().toISOString(), id).first();

  if (!row) return bad('no such note', 404);

  return new Response(JSON.stringify(row), { headers: JSON_HEADERS });
}

export async function onRequestDelete({ params, env }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) return bad('bad id');

  await env.DB.prepare('DELETE FROM notes WHERE id = ?').bind(id).run();

  return new Response(null, { status: 204 });
}
