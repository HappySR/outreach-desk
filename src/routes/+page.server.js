import { listLeads, getSettings } from '$lib/server/db.js';

export function load() {
  return {
    leads: listLeads("status IN ('pending','skipped')"),
    settings: getSettings()
  };
}
