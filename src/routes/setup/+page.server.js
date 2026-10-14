import { getSettings } from '$lib/server/db.js';
export const load = () => ({ settings: getSettings() });
