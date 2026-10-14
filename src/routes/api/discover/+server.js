import { json } from '@sveltejs/kit';
import { runDiscovery } from '$lib/server/discover.js';
import { logRun } from '$lib/server/db.js';

export async function POST({ request }) {
  const body = await request.json().catch(() => ({}));
  const limit = body?.limit ? Math.min(60, Math.max(1, Math.round(Number(body.limit)))) : undefined;
  try {
    return json(await runDiscovery({ trigger: 'manual', limit }));
  } catch (e) {
    logRun({ trigger: 'manual', cities: '', types: '', error: e.message });
    return json({ message: e.message }, { status: 400 });
  }
}
