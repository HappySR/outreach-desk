import path from 'node:path';
import { env } from '$env/dynamic/private';
import { getSettings } from '$lib/server/db.js';

export const load = () => ({
  settings: getSettings(),
  dbPath: path.resolve(env.DB_PATH || 'data/outreach.db')
});