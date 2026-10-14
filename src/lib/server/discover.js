import { searchPlaces } from './places.js';
import { insertLead, leadExists, getSettings, logRun, setMeta, getPlacesUsage } from './db.js';
import { CATEGORIES, DEFAULT_SERVICE, CHAIN_RE, cleanPhone, score, typeIsReady } from '$lib/shared/catalog.js';
import { istDate } from '$lib/shared/dates.js';

/**
 * Finds new leads, ranks them by how likely they are to say yes, and saves the best ones.
 * Leads are spread across the chosen business types so the queue stays varied.
 */
const VARIANTS = [
  (q, c) => `${q} in ${c}`,
  (q, c) => `best ${q} in ${c}`,
  (q, c) => `${q} near ${c} city centre`
];

export async function runDiscovery(opts = {}) {
  if (globalThis.__outreachDiscovering) throw new Error('A search is already running. Wait a moment and try again.');
  globalThis.__outreachDiscovering = true;
  try {
    return await search(opts);
  } finally {
    globalThis.__outreachDiscovering = false;
  }
}

async function search({ trigger = 'manual', limit } = {}) {
  const settings = getSettings();
  const cities = String(settings.cities || '').split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
  const chosen = (settings.types || []).filter((t) => CATEGORIES[t]);
  // Only search business types whose service has a demo link, because you cannot pitch what you cannot show.
  const types = chosen.filter((t) => typeIsReady(settings, t));
  const paused = chosen.filter((t) => !typeIsReady(settings, t));
  const perRun = Number(limit ?? settings.perRun ?? 20);
  if (!cities.length) throw new Error('Add at least one city in Discover.');
  if (!chosen.length) throw new Error('Choose at least one business type in Discover.');
  if (!types.length) throw new Error('None of the chosen business types has a demo link yet. Add a demo link on the Demo sites page first.');

  const skipped = { chain: 0, noPhone: 0, closed: 0, existing: 0, tooBig: 0, errors: [] };
  const byType = {};
  let found = 0;
  const seen = new Set();

  // Extra query wordings are only tried when the first wording does not give enough new leads.
  for (const variant of VARIANTS) {
    for (const city of cities) {
      for (const type of types) {
        let places = [];
        try {
          places = await searchPlaces(variant(CATEGORIES[type].query, city));
        } catch (e) {
          skipped.errors.push(`${type} in ${city}: ${e.message}`);
          continue;
        }
        found += places.length;
        for (const p of places) {
          const name = p.displayName?.text || '';
          if (!p.id || !name || seen.has(p.id)) continue;
          seen.add(p.id);
          if (p.businessStatus && p.businessStatus !== 'OPERATIONAL') { skipped.closed++; continue; }
          if (CHAIN_RE.test(name)) { skipped.chain++; continue; }
          const phone = cleanPhone(p.nationalPhoneNumber || p.internationalPhoneNumber || '');
          if (!phone) { skipped.noPhone++; continue; }
          if ((p.userRatingCount || 0) > 1500) { skipped.tooBig++; continue; }
          if (leadExists(p.id, phone)) { skipped.existing++; continue; }
          const lead = {
            place_id: p.id, name, category: type, service: DEFAULT_SERVICE[type], city,
            address: p.formattedAddress || '', phone, email: '', website: p.websiteUri || '',
            website_checked: 1, rating: p.rating ?? null, reviews: p.userRatingCount ?? 0,
            maps_url: p.googleMapsUri || '', notes: '', source: 'Google Places', added_at: istDate()
          };
          (byType[type] ??= []).push({ lead, sc: score(lead).score });
        }
      }
    }
    const candidates = Object.values(byType).reduce((n, a) => n + a.length, 0);
    if (candidates >= perRun) break;
    if (skipped.errors.length >= cities.length * types.length * (VARIANTS.indexOf(variant) + 1)) break; // every search failed
  }

  if (!found && skipped.errors.length) throw new Error('Google search failed. ' + skipped.errors[0]);

  // Round-robin across types, best score first within each type.
  Object.values(byType).forEach((arr) => arr.sort((a, b) => b.sc - a.sc));
  const picked = [];
  while (picked.length < perRun && Object.values(byType).some((a) => a.length)) {
    for (const t of Object.keys(byType)) {
      const next = byType[t].shift();
      if (next && picked.length < perRun) picked.push(next);
    }
  }

  const added = [];
  for (const { lead, sc } of picked) {
    if (insertLead(lead)) added.push({ name: lead.name, category: lead.category, score: sc });
  }

  const result = {
    found, added: added.length, skipped, leads: added, usage: getPlacesUsage(), paused,
    message: added.length ? null : 'No new leads found. Add more cities or business types, then try again.'
  };
  logRun({ trigger, cities: cities.join(', '), types: types.join(', '), found, added: added.length, detail: skipped, error: skipped.errors.length === cities.length * types.length ? skipped.errors[0] : null });
  setMeta('lastDiscoveryDate', istDate());
  return result;
}
