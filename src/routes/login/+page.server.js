import { fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { sessionToken, safeEqual } from '$lib/server/auth.js';

export function load() {
  if (!env.APP_PASSWORD) throw redirect(303, '/');
}

export const actions = {
  default: async ({ request, cookies, url }) => {
    const form = await request.formData();
    const pw = String(form.get('password') || '');
    if (!safeEqual(pw, env.APP_PASSWORD || '')) return fail(401, { error: 'Wrong password' });
    cookies.set('session', sessionToken(), {
      path: '/', httpOnly: true, sameSite: 'lax', secure: url.protocol === 'https:', maxAge: 60 * 60 * 24 * 30
    });
    throw redirect(303, '/');
  }
};
