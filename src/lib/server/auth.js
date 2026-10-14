import { env } from '$env/dynamic/private';
import crypto from 'node:crypto';

export const sessionToken = () =>
  crypto.createHmac('sha256', env.SESSION_SECRET || env.APP_PASSWORD || 'dev').update('outreach-desk-session').digest('hex');

export const safeEqual = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
