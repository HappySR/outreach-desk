// All dates are handled in Indian Standard Time so "today" means the same on the server and in the browser.
const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' });

/** @param {Date} [d] @returns {string} YYYY-MM-DD in IST */
export const istDate = (d = new Date()) => fmt.format(d);

/** @param {number} n @param {Date} [from] */
export const addDays = (n, from = new Date()) => istDate(new Date(from.getTime() + n * 86400000));

/** @param {string|number|Date} t */
export const fmtTime = (t) => {
  const d = new Date(String(t).includes('T') || typeof t === 'number' ? t : String(t).replace(' ', 'T') + 'Z');
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });
};
