import { json, error } from '@sveltejs/kit';
import { insertLead, leadExists } from '$lib/server/db.js';
import { parseCSV, mapCategory, DEFAULT_SERVICE, cleanPhone } from '$lib/shared/catalog.js';
import { istDate } from '$lib/shared/dates.js';

export async function POST({ request }) {
  const { text } = await request.json().catch(() => ({}));
  if (!text || !String(text).trim()) throw error(400, 'Paste at least one row');
  const rows = parseCSV(text);
  const start = rows.length && /name/i.test(rows[0][0]) ? 1 : 0;
  let added = 0, duplicates = 0;
  for (const r of rows.slice(start)) {
    const [name, category, city, phone, email, website, rating, reviews, notes] = r;
    if (!name) continue;
    const cat = mapCategory(category);
    const p = cleanPhone(phone);
    if (leadExists(null, p || null)) { duplicates++; continue; }
    const id = insertLead({
      name, category: cat, service: DEFAULT_SERVICE[cat], city: city || '', phone: p, email: email || '',
      website: website || '', website_checked: 0, rating: rating ? Number(rating) : null,
      reviews: Number(reviews) || 0, notes: notes || '', source: 'Imported', added_at: istDate()
    });
    if (id) added++;
  }
  return json({ added, duplicates });
}
