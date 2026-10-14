import { json, error } from '@sveltejs/kit';
import { applyAction } from '$lib/server/actions.js';

export async function POST({ params, request }) {
  let body;
  try { body = await request.json(); } catch { throw error(400, 'Invalid JSON'); }
  const lead = applyAction(Number(params.id), body);
  return json({ lead });
}
