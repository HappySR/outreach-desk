import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { startScheduler } from '$lib/server/scheduler.js';
import { sessionToken, safeEqual } from '$lib/server/auth.js';

startScheduler();

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  const path = event.url.pathname;

  // External cron uses a bearer secret instead of the login cookie.
  if (path.startsWith('/api/cron/')) return resolve(event);

  if (env.APP_PASSWORD && path !== '/login') {
    const cookie = event.cookies.get('session');
    if (!cookie || !safeEqual(cookie, sessionToken())) {
      if (path.startsWith('/api/')) return new Response(JSON.stringify({ message: 'Not signed in' }), { status: 401, headers: { 'content-type': 'application/json' } });
      throw redirect(303, '/login');
    }
  }
  return resolve(event);
}
