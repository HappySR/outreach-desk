import { env } from '$env/dynamic/private';
import { stats, getSettings } from '$lib/server/db.js';

export function load() {
  const settings = getSettings();
  return {
    stats: stats(),
    cap: settings.cap,
    hasKey: !!env.GOOGLE_PLACES_API_KEY,
    authOn: !!env.APP_PASSWORD,
    autoTime: (env.AUTO_DISCOVER_TIME || '').trim()
  };
}
