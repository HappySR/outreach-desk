import { env } from '$env/dynamic/private';
import { bumpPlacesUsage } from './db.js';

const FIELDS = [
  'places.id', 'places.displayName', 'places.formattedAddress', 'places.nationalPhoneNumber',
  'places.internationalPhoneNumber', 'places.rating', 'places.userRatingCount', 'places.websiteUri',
  'places.googleMapsUri', 'places.businessStatus', 'places.types', 'nextPageToken'
].join(',');

/**
 * Text search against the Google Places API (New). Returns up to pages * 20 places.
 * The API key stays on the server and is never sent to the browser.
 */
export async function searchPlaces(textQuery, { pages = 2 } = {}) {
  const key = env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error('GOOGLE_PLACES_API_KEY is not set. Add it to your .env file.');
  const base = env.PLACES_API_BASE || 'https://places.googleapis.com';
  const out = [];
  let pageToken;
  for (let i = 0; i < pages; i++) {
    bumpPlacesUsage();
    const res = await fetch(`${base}/v1/places:searchText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': FIELDS },
      body: JSON.stringify({ textQuery, pageSize: 20, regionCode: 'IN', languageCode: 'en', ...(pageToken ? { pageToken } : {}) })
    });
    if (!res.ok) {
      let msg = res.statusText;
      try { msg = (await res.json()).error?.message || msg; } catch {}
      throw new Error(`Places API ${res.status}: ${msg}`);
    }
    const data = await res.json();
    out.push(...(data.places || []));
    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }
  return out;
}
