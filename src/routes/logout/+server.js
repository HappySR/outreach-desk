import { redirect } from '@sveltejs/kit';

export function POST({ cookies }) {
  cookies.delete('session', { path: '/' });
  throw redirect(303, '/login');
}
