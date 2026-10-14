import { priceOf, fmtINR } from './catalog.js';

const longDate = (iso) =>
  new Date(iso + 'T00:00:00+05:30').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
export { longDate };

/** The parties' details shown at the top of both documents. */
export function parties(lead, settings) {
  return {
    me: {
      name: settings.ownerName || 'Subhajit Roy',
      lines: ['Web & app developer, Assam, India', settings.email, settings.portfolio, settings.phone ? `Phone: ${settings.phone}` : '', settings.gstin ? `GSTIN: ${settings.gstin}` : ''].filter(Boolean)
    },
    client: {
      name: lead.name,
      lines: [lead.address || lead.city, lead.phone ? `Phone: ${lead.phone}` : '', lead.email].filter(Boolean)
    }
  };
}

/** One source of truth: the printable page and the WhatsApp text both use these clauses. */
export function agreementClauses(lead, settings) {
  const { setup, monthly, g } = priceOf(lead, settings);
  const c = g.c;
  const upi = settings.upi ? ` to ${settings.upi}` : '';
  const list = [
    ['What you get', `${c.label} for ${lead.name}: ${c.what}. It is built from the free sample you saw and customised with your own photos, prices and details.`],
    ['Timeline', `I share a preview link within ${c.days} days after you send everything I need: ${c.need}.`],
    ['Price', `One-time setup fee ${fmtINR(setup)}.${monthly ? ` Hosting and updates ${fmtINR(monthly)} per month.` : ' There is no monthly fee.'}`],
    ['When you pay', `Nothing is due until you have seen the finished website and approved it. You then pay the setup fee by UPI${upi} before the website goes live. I make it live within 24 hours of payment.`],
    ['Changes', 'Up to 2 rounds of changes are included before you approve. Extra work is quoted separately and agreed with you first.'],
    monthly ? ['Monthly plan', "The monthly fee covers hosting, security and small edits. It starts only after your website is live. Either of us can cancel with 30 days' notice."] : null,
    ['Ownership', 'After full payment you own your content, and I hand over your domain and logins. I may show the finished website in my portfolio unless you tell me not to.'],
    ["If you don't go ahead", 'You owe nothing. The preview is taken down after 7 days.'],
    ['Your part', 'You provide accurate content and photos you have the right to use, and reply to my questions within a reasonable time.'],
    ['Accepting', 'Replying "Agreed" on WhatsApp or email, or signing below, means you accept these terms.']
  ].filter(Boolean);
  return { clauses: list.map(([h, t], i) => ({ n: i + 1, h, t })), setup, monthly };
}

export function agreementText(lead, settings, date) {
  const { clauses } = agreementClauses(lead, settings);
  const me = settings.ownerName || 'Subhajit Roy';
  return `Website service agreement
${me} and ${lead.name}, ${longDate(date)}

${clauses.map((c) => `${c.n}. ${c.h}: ${c.t}`).join('\n')}

Please reply "Agreed" to confirm, and I'll get started. A printable copy is available if you'd like one.

— ${me}${settings.email ? `\n${settings.email}` : ''}`;
}

export function invoiceData(lead, settings, today) {
  const { setup, monthly, g } = priceOf(lead, settings);
  return {
    no: lead.invoice_no || 'DRAFT',
    date: lead.invoice_date || today,
    paid: !!lead.paid_at,
    paidAt: lead.paid_at,
    items: [{ desc: `${g.c.label}: website design, customisation and setup for ${lead.name}`, amount: setup }],
    total: setup,
    monthly,
    upi: settings.upi
  };
}

export function invoiceText(lead, settings, today) {
  const inv = invoiceData(lead, settings, today);
  const me = settings.ownerName || 'Subhajit Roy';
  return `Invoice ${inv.no} (${longDate(inv.date)})
From: ${me}${settings.gstin ? `, GSTIN ${settings.gstin}` : ''}
To: ${lead.name}

${inv.items[0].desc}: ${fmtINR(inv.total)}
Total due: ${fmtINR(inv.total)}, payable by UPI to ${inv.upi || '[YOUR-UPI-ID]'} (please mention ${inv.no}).

Due after you approve the finished website, before it goes live. I put it live within 24 hours of payment.${inv.monthly ? `\nHosting and updates (${fmtINR(inv.monthly)}/month) start only after it is live and are billed separately.` : ''}

Thank you!
— ${me}${settings.email ? `\n${settings.email}` : ''}`;
}
