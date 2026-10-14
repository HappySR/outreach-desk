import { env } from '$env/dynamic/private';
import { getMeta, logRun } from './db.js';
import { runDiscovery } from './discover.js';
import { istDate } from '$lib/shared/dates.js';

/**
 * Runs the discovery once a day at AUTO_DISCOVER_TIME (IST, HH:MM).
 * Works when the app runs as a long-lived Node process (npm start, a VPS, Render, Railway).
 * On serverless hosts use an external cron that calls /api/cron/discover instead.
 */
export function startScheduler() {
  if (globalThis.__outreachScheduler) return;
  const at = (env.AUTO_DISCOVER_TIME || '').trim();
  if (!/^\d{2}:\d{2}$/.test(at)) return;
  globalThis.__outreachScheduler = true;
  console.log(`[scheduler] daily lead search at ${at} IST`);

  let lastTry = 0;
  const tick = async () => {
    try {
      if (!env.GOOGLE_PLACES_API_KEY) return;
      const nowIST = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
      if (nowIST < at) return;
      if (getMeta('lastDiscoveryDate') === istDate()) return;
      if (Date.now() - lastTry < 30 * 60_000) return; // after a failure, wait 30 minutes before retrying
      lastTry = Date.now();
      const r = await runDiscovery({ trigger: 'scheduled' });
      console.log(`[scheduler] added ${r.added} leads`);
    } catch (e) {
      console.error('[scheduler]', e.message);
      try { logRun({ trigger: 'scheduled', cities: '', types: '', error: e.message }); } catch {}
    }
  };
  setInterval(tick, 60_000);
  setTimeout(tick, 5_000);
}
