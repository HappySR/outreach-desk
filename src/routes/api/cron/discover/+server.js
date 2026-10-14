import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { runDiscovery } from '$lib/server/discover.js';

async function run({ request }) {
  const secret = env.CRON_SECRET;
  const auth = request.headers.get('authorization') || '';
  if (!secret || auth !== `Bearer ${secret}`) return json({ message: 'Unauthorized' }, { status: 401 });
  try {
    return json(await runDiscovery({ trigger: 'cron' }));
  } catch (e) {
    return json({ message: e.message }, { status: 500 });
  }
}
export const GET = run;
export const POST = run;
