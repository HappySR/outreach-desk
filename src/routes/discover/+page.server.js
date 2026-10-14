import { getSettings, lastRuns, stats, getPlacesUsage } from '$lib/server/db.js';
import { env } from '$env/dynamic/private';

export function load() {
  return {
    settings: getSettings(),
    runs: lastRuns(8),
    stats: stats(),
    usage: getPlacesUsage(),
    hasKey: !!env.GOOGLE_PLACES_API_KEY,
    autoTime: (env.AUTO_DISCOVER_TIME || '').trim()
  };
}
