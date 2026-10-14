import { addDays, istDate } from './dates.js';

/* ------------------------------------------------------------------ */
/* Business types and the services you sell                            */
/* ------------------------------------------------------------------ */

export const CATEGORIES = {
  restaurant: { label: 'Restaurant / café / cloud kitchen', short: 'Restaurant', ticket: 450, unit: 'orders', query: 'restaurants and cafes' },
  clinic: { label: 'Clinic / dentist / diagnostics / physio', short: 'Clinic', ticket: 600, unit: 'patients', query: 'dental and medical clinics' },
  salon: { label: 'Salon / spa / gym / yoga studio', short: 'Salon or gym', ticket: 700, unit: 'bookings', query: 'salons and beauty parlours' },
  coaching: { label: 'Coaching / tuition / school', short: 'Coaching', ticket: 1500, unit: 'students', query: 'coaching institutes and tuition centres' },
  retail: { label: 'Retail / boutique / jewellery / sweet shop', short: 'Retail', ticket: 900, unit: 'orders', query: 'boutiques and clothing stores' },
  realestate: { label: 'Real estate agent / builder / PG owner', short: 'Real estate', ticket: 30000, unit: 'deals', query: 'real estate agents' },
  services: { label: 'Local services (photographer, event, repair)', short: 'Local services', ticket: 800, unit: 'jobs', query: 'photographers and event planners' },
  hotel: { label: 'Hotel / homestay / lodge / banquet', short: 'Hotel or homestay', ticket: 3000, unit: 'bookings', query: 'homestays and small hotels' }
};

export const SERVICES = {
  qrmenu: {
    label: 'QR menu', short: 'a QR-code menu',
    what: 'a digital menu that customers open by scanning a QR code, and order from on WhatsApp',
    benefit: 'You never reprint menus when prices change, and customers can order straight from their table or home.',
    need: 'your logo, menu with prices, 5–10 photos of your best dishes, address, timings and WhatsApp number',
    days: 3, hours: 10, lo: 3499, mid: 4999, hi: 6999, monthly: 499,
    demo: 'QR menu site: category tabs, dish photos, veg/non-veg badges, search, and a cart that sends the order to WhatsApp.',
    wow: 'Change a price on an admin page and the menu updates instantly.',
    addons: ['Full website', 'Google Business Profile', 'Review QR code']
  },
  booking: {
    label: 'Booking website', short: 'a booking website',
    what: 'a website with your services, timings and online booking, with WhatsApp confirmations',
    benefit: 'Fewer phone calls and missed appointments, and new customers can find and book you from Google.',
    need: 'your logo, services and prices, timings, address, photos of your place and your phone number',
    days: 5, hours: 20, lo: 6999, mid: 9499, hi: 13999, monthly: 799,
    demo: 'Booking site: services, timings, map, slot picker with WhatsApp confirmation, gallery and reviews.',
    wow: 'A slot picker that blocks times that are already booked.',
    addons: ['Google Business Profile', 'WhatsApp reminders', 'Review QR code']
  },
  website: {
    label: 'Business website', short: 'a business website',
    what: 'a professional website showing your business, services and contact details',
    benefit: 'People searching on Google can find you and trust you before they call, and enquiries reach your WhatsApp.',
    need: 'your logo, details of your services or courses, photos, address and phone number',
    days: 4, hours: 16, lo: 5999, mid: 7999, hi: 11999, monthly: 599,
    demo: 'Business site: hero, services or courses, results or gallery, testimonials, enquiry form, sticky WhatsApp button.',
    wow: 'Loads fast on 4G and is set up for "near me" searches.',
    addons: ['Fee & attendance app (Flutter)', 'Google Business Profile', 'WhatsApp automation']
  },
  catalogue: {
    label: 'Online catalogue', short: 'an online catalogue',
    what: 'an online catalogue where customers browse your products and order on WhatsApp',
    benefit: 'Your shop stays open online 24 hours, and customers see what you have before they visit.',
    need: 'your logo, product photos with prices, categories, address, timings and WhatsApp number',
    days: 4, hours: 18, lo: 5999, mid: 7999, hi: 11999, monthly: 599,
    demo: 'Catalogue site: product grid, filters, in-stock toggle, an enquiry button on every product, festival offer banner.',
    wow: 'The owner can mark items sold out from a phone.',
    addons: ['Google Business Profile', 'WhatsApp catalogue', 'Review QR code']
  },
  app: {
    label: 'Custom app (Flutter)', short: 'a simple mobile app',
    what: 'a simple mobile app for fee reminders and attendance, or a customer loyalty card',
    benefit: 'No more paper registers, and reminders go out in one tap.',
    need: 'your student or customer list format, fee structure, and how you track attendance today',
    days: 14, hours: 60, lo: 14999, mid: 24999, hi: 39999, monthly: 1499,
    demo: 'Flutter app demo: student list, attendance tick, fee-due list with a one-tap WhatsApp reminder.',
    wow: 'Fee-due list that sends reminders in one tap.',
    addons: ['Business website', 'WhatsApp automation']
  },
  gbp: {
    label: 'Google Business Profile', short: 'a Google Business Profile setup',
    what: 'a complete Google Business Profile, so you show up properly when people search nearby',
    benefit: 'More calls and direction requests from people searching near you, and an easy way to collect reviews.',
    need: 'access to your Google Business listing, photos, timings and services list',
    days: 2, hours: 6, lo: 1999, mid: 2999, hi: 3999, monthly: 0,
    demo: 'A before and after example of an optimised profile.',
    wow: 'Shows up in the "near me" map results.',
    addons: ['Business website', 'Review QR code']
  }
};

export const DEFAULT_SERVICE = {
  restaurant: 'qrmenu', clinic: 'booking', salon: 'booking', coaching: 'website',
  retail: 'catalogue', realestate: 'website', services: 'website', hotel: 'booking'
};

export const STAGES = [
  ['sent', 'Sent'], ['replied', 'Replied'], ['building', 'Building'],
  ['delivered', 'Delivered'], ['paid', 'Paid'], ['lost', 'Closed']
];

export const DEFAULT_SETTINGS = {
  rate: 350, cap: 20, perRun: 20, years: 2, upi: '', launch: false,
  cities: 'Guwahati', types: ['restaurant', 'clinic', 'salon', 'coaching'],
  demos: {}, checks: {},
  ownerName: 'Subhajit Roy', email: 'subhajit.roy.dev@gmail.com',
  portfolio: 'https://subhajit.is-a.dev', phone: '', gstin: ''
};

/** A business type is only searched when the service you would pitch to it has a demo link. */
export const serviceHasDemo = (settings, key) => !!(settings.demos && String(settings.demos[key] || '').trim());
export const typeIsReady = (settings, type) => serviceHasDemo(settings, DEFAULT_SERVICE[type]);

/** Big brands and chains that decide at head office. They are skipped during discovery. */
export const CHAIN_RE = /(physics\s?wallah|\bpw\b|allen career|aakash|unacademy|byju|vedantu|\bims\b|resonance|fiitjee|athenian|lakme|lakm[eé]|jawed habib|green trends|naturals|toni\s?&?\s?guy|domino|pizza hut|kfc|mcdonald|burger king|subway|starbucks|cafe coffee day|\bccd\b|haldiram|barbeque nation|wow! momo|chai point|apollo|clove dental|dentzz|portea|manipal|fortis|medanta|max hospital|narayana|oyo|treebo|fab\s?hotels|taj\b|marriott|radisson|hyatt|ibis|lemon tree|ginger|holiday inn|pantaloons|westside|lifestyle|max fashion|reliance|big bazaar|tanishq|malabar|kalyan jewel|dunkin|baskin)/i;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export const fmtINR = (n) => '₹' + Number(n).toLocaleString('en-IN');
const rnd = (x) => Math.max(999, Math.round(x / 500) * 500 - 1);

export const svc = (l) => (l.service && SERVICES[l.service] ? l.service : DEFAULT_SERVICE[l.category] || 'website');
export const pack = (l) => ({ ...(CATEGORIES[l.category] || CATEGORIES.services), ...SERVICES[svc(l)], key: svc(l) });

/** Returns a 10-digit national number, or the raw digits for landlines. */
export function cleanPhone(p) {
  let d = String(p ?? '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return d;
}
export const isMobile = (p) => /^[6-9]\d{9}$/.test(cleanPhone(p));
/** wa.me wants country code + number. Empty string if the number cannot take WhatsApp. */
export const normPhone = (p) => (isMobile(p) ? '91' + cleanPhone(p) : '');

const SOCIAL_RE = /(facebook|instagram|linktr\.ee|justdial|sulekha|wa\.me|whatsapp|youtube|twitter|x\.com|zomato|swiggy|practo|lybrate|linkedin|magicpin|dineout|urbanpro)\b/i;
export function websiteKind(url) {
  if (!url || !String(url).trim()) return 'none';
  return SOCIAL_RE.test(url) ? 'social' : 'site';
}

/* ------------------------------------------------------------------ */
/* Scoring: how likely is this business to say yes?                    */
/* ------------------------------------------------------------------ */

export function score(l) {
  let s = 20;
  const r = [];
  const kind = websiteKind(l.website);
  const rating = Number(l.rating) || 0;
  const rev = Number(l.reviews) || 0;

  if (kind === 'none') { s += 25; r.push(l.website_checked ? 'Google lists no website (+25)' : 'No website on record (+25)'); }
  else if (kind === 'social') { s += 18; r.push('Only a social or directory page, no real website (+18)'); }
  else r.push('Already has a website, so this is a revamp pitch (+0)');

  if (isMobile(l.phone)) { s += 20; r.push('Mobile number, so WhatsApp works (+20)'); }
  else if (l.phone) { s += 5; r.push('Landline only, WhatsApp will not work (+5)'); }
  else r.push('No phone number yet (+0)');

  if (l.email) { s += 5; r.push('Email available as a fallback (+5)'); }

  if (rating >= 4.3) { s += 10; r.push(`Rating ${rating}★ shows they care about reputation (+10)`); }
  else if (rating && rating < 3.8) { s -= 10; r.push(`Low rating ${rating}★ (−10)`); }

  if (rev >= 15 && rev <= 600) { s += 15; r.push(`Active but not a big brand (${rev} reviews) (+15)`); }
  else if (rev > 600 && rev <= 1500) { s += 5; r.push(`Busy, larger business (${rev} reviews) (+5)`); }
  else if (rev > 1500) { s -= 20; r.push(`Very large review count suggests a chain or big brand (−20)`); }
  else if (rev > 0) { s += 3; r.push(`New or small listing (${rev} reviews) (+3)`); }

  if (/chain|franchise/i.test(l.notes || '')) { s -= 30; r.push('Noted as chain or franchise (−30)'); }
  if (/instagram|phone-only|paper|dm/i.test(l.notes || '')) { s += 8; r.push('Notes show a manual process you can replace (+8)'); }

  return { score: Math.max(5, Math.min(98, s)), reasons: r };
}

/* ------------------------------------------------------------------ */
/* Pricing                                                             */
/* ------------------------------------------------------------------ */

export function suggest(l, settings) {
  const c = pack(l);
  const rev = Number(l.reviews) || 0;
  const tier = rev < 25 ? 'micro' : rev < 250 ? 'small' : 'established';
  const mult = { micro: 0.8, small: 1, established: 1.25 }[tier];
  const web = websiteKind(l.website) === 'site' ? 0.9 : 1;
  const floor = c.hours * settings.rate;
  let raw = c.mid * mult * web;
  if (settings.launch) raw *= 0.9;
  const setup = Math.max(rnd(raw), rnd(floor * 1.05));
  const walk = Math.max(rnd(floor), rnd(setup * 0.8));
  const tierText = {
    micro: `a small or new business (${rev} reviews), so priced 20% below standard`,
    small: `a steady local business (${rev} reviews), so priced at standard`,
    established: `an established business (${rev} reviews) with more revenue to protect, so priced 25% above standard`
  }[tier];
  return { c, setup, walk, floor, tier, tierText, monthly: c.monthly };
}

export function priceOf(l, settings) {
  const g = suggest(l, settings);
  return { setup: l.price ?? g.setup, monthly: l.monthly ?? g.monthly, g };
}

/* ------------------------------------------------------------------ */
/* Drafting                                                            */
/* ------------------------------------------------------------------ */

export const demoUrl = (settings, key) => (settings.demos && settings.demos[key]) || `https://YOUR-DEMO-LINK.com/${key}`;
export const demoIsPlaceholder = (settings, key) => !(settings.demos && settings.demos[key]);

function hook(l) {
  const rt = Number(l.rating) || 0;
  const rev = Number(l.reviews) || 0;
  const kind = websiteKind(l.website);
  if (kind === 'none') return `I noticed ${l.name} doesn't have its own website yet, so people searching on Google can't see everything you offer.`;
  if (kind === 'social') return `I noticed ${l.name} is only on social media, and a proper website would help people find and trust you on Google.`;
  if (rt >= 4 && rev >= 15) return `Your ${rt}★ rating from ${rev} reviews is impressive, and a good website can turn that reputation into more customers.`;
  return `I looked at your website, and it can be made faster on mobile and take bookings or orders directly.`;
}

export function draft(l, settings) {
  const { setup, monthly, g } = priceOf(l, settings);
  const c = g.c;
  const years = settings.years || 2;
  const monthlyLine = monthly
    ? `✔ ${fmtINR(monthly)}/month for hosting and updates starts only after it goes live.`
    : '✔ No monthly fees.';
  const body = `Hello ${l.name} team,

I'm ${settings.ownerName || 'Subhajit Roy'}, a web and app developer from Assam. I've been building websites and apps for the last ${years} years, and I work with clients across India.${settings.portfolio ? `\nMy work: ${settings.portfolio}` : ''}

${hook(l)}

I made a free sample of ${c.what}:
${demoUrl(settings, c.key)}

${c.benefit}

How it works:
✔ The sample is free. If you like it, I'll customise it with your own photos, prices and details, also free.
✔ You pay ${fmtINR(setup)} (one-time) only after your finished website is ready and you are happy with it.
${monthlyLine}

That's well below typical agency rates, and it includes a mobile-friendly design, your own details and full setup.

If you'd like to see it with your business details, just reply "Yes".

— ${settings.ownerName || 'Subhajit Roy'}
(Reply STOP and I won't message again.)`;
  return { body, subject: `Free sample website for ${l.name}` };
}

export function nextDraft(l, settings) {
  const { setup, monthly, g } = priceOf(l, settings);
  const c = g.c;
  const n = (l.sends && l.sends[l.stage]) || 0;
  const nm = l.name;
  const upi = settings.upi || '[YOUR-UPI-ID]';
  const monthlyBullet = monthly ? `• Hosting and updates, ${fmtINR(monthly)}/month, start only after it is live` : '• No monthly fees';

  switch (l.stage) {
    case 'sent':
      if (n <= 1) return { label: 'Follow-up 1', text: `Hi ${nm} team, Subhajit here. A few days ago I shared a free sample website for ${c.short}. Did you get a chance to look at it? If you like it, I'll customise it with your own details, and you still pay nothing until you are happy with the finished site.` };
      if (n === 2) return { label: 'Final follow-up', text: `Hi ${nm} team, one last note from me. Your free sample website is ready whenever you want it. If now isn't the right time, no problem at all, and I won't message again. Wishing you a great season ahead!` };
      return null;
    case 'replied':
      if (n === 0) return { label: 'Ask for details', text: `Thank you for replying! To customise your website I need: ${c.need}.\n\nSend them here on WhatsApp. I'll share your website for review within ${c.days} days of receiving them. You pay nothing until you have seen it and are happy.` };
      return { label: 'Nudge for details', text: `Hi ${nm} team, just checking whether you could send the details for your website (${c.need}). Once I have them I'll build it within ${c.days} days.` };
    case 'building':
      if (n === 0) return { label: 'Confirm start', text: `Got everything, thank you! I've started on your website and will send a preview link within ${c.days} days. Payment is only after you approve it.` };
      return { label: 'Progress update', text: `Quick update from Subhajit: your website is coming along well and I'll share the preview link soon.` };
    case 'delivered':
      if (n === 0) return { label: 'Preview + payment terms', text: `Your website is ready to review: [preview link]\n\nPlease check it and tell me anything you'd like changed (2 rounds of changes are included).\n\nWhen you're happy:\n• One-time setup fee: ${fmtINR(setup)}, payable by UPI to ${upi}\n• After payment I put your website live within 24 hours\n${monthlyBullet}\n\nThe preview stays available for 7 days.` };
      return { label: 'Payment reminder', text: `Hi ${nm} team, a gentle reminder about your website. If you're happy with it, the one-time fee is ${fmtINR(setup)} by UPI to ${upi}, and I'll make it live within 24 hours. Happy to make any other changes first.` };
    case 'paid':
      if (n === 0) return { label: 'Go-live message', text: `Payment received, thank you! Your website is now live: [live link]\n\n${monthly ? `Hosting and updates (${fmtINR(monthly)}/month) start from next month. ` : ''}For any change, just message me here.` };
      return null;
    default:
      return null;
  }
}

export const hasPlaceholder = (t) => /\[preview link\]|\[live link\]|\[YOUR-UPI-ID\]/.test(t || '');

/** When should the next follow-up be due after a message in `stage` has been sent `count` times? */
export function nextFollowAfterSend(stage, count) {
  if (stage === 'sent') return count === 2 ? addDays(4) : null;
  if (stage === 'replied' || stage === 'delivered') return addDays(2);
  return null;
}

export const isDue = (l, today = istDate()) =>
  l.status === 'approved' && !l.dnc && !!l.next_follow_at && l.next_follow_at <= today && !['paid', 'lost'].includes(l.stage);

/* ------------------------------------------------------------------ */
/* Static content                                                      */
/* ------------------------------------------------------------------ */

export const TERMS = `Website service terms (Subhajit Roy)
1. The sample is free and carries no obligation.
2. After you say yes, I build your customised website at no charge.
3. You review the finished website. Up to 2 rounds of changes are included.
4. You pay the one-time setup fee only after you approve the finished website, before it goes live.
5. After payment I put the website live within 24 hours and hand over what you own: your content, domain and logins.
6. The monthly fee covers hosting, security and small edits. It starts only after your website is live, and you can cancel with 30 days' notice.
7. If you decide not to go ahead, you owe nothing and the preview is taken down.`;

export const CHECKS = [
  ['Before your first message', [
    ['wa', 'WhatsApp Business app on a separate number', 'Install WhatsApp Business, add your photo, name, a one-line description and your website link. A clean business profile makes strangers trust you and avoids looking like spam.'],
    ['demos', 'Deploy one demo site per service', 'Use free hosting (Cloudflare Pages, Vercel or Netlify) on one domain, like yourname.dev/qrmenu. Put a small "Sample website" label on each. Paste the links in the Demos page.'],
    ['portfolio', 'A one-page portfolio with your 2 years of work', 'Three to five real projects with screenshots and links, plus any client feedback. This is the first thing a stranger will check.'],
    ['dnc', 'A "Do not contact" habit', 'Message each business once, plus the two follow-ups in this tool. If someone says STOP, use the Do not contact button. Only message numbers businesses have published for enquiries.']
  ]],
  ['Before you take your first client', [
    ['upi', 'A UPI ID or bank account for payments', 'Enter your UPI ID in Settings so the payment message fills it in. Payment links from Razorpay or Cashfree also work; they charge a small fee per payment.'],
    ['terms', 'Review the one-page agreement', 'Built in. Open any conversation and use Documents. Read it once, change anything you disagree with, and send it when a client says yes.'],
    ['invoice', 'Review the invoice template and add your details', 'Built in. Add your email, phone and GSTIN (if you have one) in Pricing & settings. Ask a CA about GST and income-tax rules for freelance work and keep invoices from day one.'],
    ['hosting', 'A hosting and domain routine', 'Host client sites on a free plan under your own account. Buy the domain in the client\'s name where possible. Do not put the live site on their domain until they have paid.'],
    ['preview', 'A "Preview" banner for unpaid sites', 'Show unpaid work on a preview link with a visible "Preview" banner and a 7-day expiry.']
  ]],
  ['Helpful but not urgent', [
    ['gbp', 'Your own Google Business Profile and LinkedIn', 'A stranger will Google your name. Make sure something professional comes up.'],
    ['email', 'A professional email on your domain', 'For the email channel and invoices, such as subhajit@yourname.dev.']
  ]]
];

export function mapCategory(t) {
  t = String(t || '').toLowerCase().trim();
  if (CATEGORIES[t]) return t;
  const rules = [
    ['restaurant', /rest|caf|food|kitchen|bak/], ['clinic', /clinic|dent|doctor|diagn|physio|hospital/],
    ['salon', /salon|spa|gym|yoga|fitness|beauty/], ['coaching', /coach|tuition|school|class|academy|institute/],
    ['retail', /retail|shop|store|boutique|jewel|sweet|garment/], ['realestate', /real|estate|builder|pg|property/],
    ['hotel', /hotel|stay|lodge|banquet|resort|homestay/], ['services', /service|repair|photo|event|pack|plumb|electric/]
  ];
  for (const [k, re] of rules) if (re.test(t)) return k;
  return 'services';
}

/** Minimal CSV parser with quoted-field support. */
export function parseCSV(text) {
  const rows = [];
  for (const line of String(text).split(/\r?\n/)) {
    if (!line.trim()) continue;
    const out = [];
    let cur = '', q = false;
    for (const ch of line) {
      if (ch === '"') q = !q;
      else if (ch === ',' && !q) { out.push(cur); cur = ''; }
      else cur += ch;
    }
    out.push(cur);
    rows.push(out.map((x) => x.trim()));
  }
  return rows;
}
