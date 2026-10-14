import { json } from '@sveltejs/kit';
import { saveSettings } from '$lib/server/db.js';

export async function POST({ request }) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return json({ message: 'Invalid request' }, { status: 400 });

  const patch = { ...body };
  for (const k of ['rate', 'cap', 'perRun', 'years']) if (k in patch) patch[k] = Math.max(1, Number(patch[k]) || 1);
  if ('upi' in patch) patch.upi = String(patch.upi ?? '').trim();
  if ('cities' in patch) patch.cities = String(patch.cities ?? '');
  for (const k of ['ownerName', 'email', 'portfolio', 'phone', 'gstin']) if (k in patch) patch[k] = String(patch[k] ?? '').trim();

  try {
    return json({ settings: saveSettings(patch) });
  } catch (e) {
    return json({ message: 'Database error: ' + e.message }, { status: 500 });
  }
}
