export async function saveSettings(patch) {
  let res;
  try {
    res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch)
    });
  } catch {
    throw new Error('Could not reach the server');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || `Server said ${res.status}`);
  return body.settings;
}