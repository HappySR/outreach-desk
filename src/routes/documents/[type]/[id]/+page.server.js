import { error } from '@sveltejs/kit';
import { getLead, getSettings, updateLead, nextInvoiceNo } from '$lib/server/db.js';
import { istDate } from '$lib/shared/dates.js';

export function load({ params }) {
  if (!['agreement', 'invoice'].includes(params.type)) throw error(404, 'Unknown document');
  let lead = getLead(Number(params.id));
  if (!lead) throw error(404, 'Lead not found');
  if (lead.status !== 'approved') throw error(400, 'Approve this lead first, then the documents become available.');
  const today = istDate();
  if (params.type === 'invoice' && !lead.invoice_no) {
    lead = updateLead(lead.id, { invoice_no: nextInvoiceNo(), invoice_date: today });
  }
  return { type: params.type, lead, settings: getSettings(), today };
}
