const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };

const ALLOWED = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg'
};

const MAX_BYTES = 10 * 1024 * 1024;

function bad(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: JSON_HEADERS
  });
}

export async function onRequestPost({ request, env }) {
  const form = await request.formData().catch(() => null);
  const file = form && form.get('file');
  if (!file || typeof file === 'string') return bad('no file supplied');

  const ext = ALLOWED[file.type];
  if (!ext) return bad(`unsupported type ${file.type || 'unknown'}`);
  if (file.size > MAX_BYTES) return bad('file is larger than 10MB');

  const key = `${crypto.randomUUID()}.${ext}`;

  await env.IMAGES.put(key, file.stream(), {
    httpMetadata: { contentType: file.type }
  });

  return new Response(JSON.stringify({ url: `/img/${key}` }), {
    status: 201,
    headers: JSON_HEADERS
  });
}
