import { listLeads, getSettings, getMessagesFor } from '$lib/server/db.js';
import { istDate } from '$lib/shared/dates.js';

export function load() {
  const leads = listLeads("status = 'approved'");
  return {
    leads,
    messages: getMessagesFor(leads.map((l) => l.id)),
    settings: getSettings(),
    today: istDate()
  };
}
