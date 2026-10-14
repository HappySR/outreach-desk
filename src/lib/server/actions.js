import { error } from '@sveltejs/kit';
import { getLead, updateLead, addMessage, getSettings, nextInvoiceNo } from './db.js';
import { normPhone, nextFollowAfterSend, isMobile } from '$lib/shared/catalog.js';
import { istDate, addDays } from '$lib/shared/dates.js';

const SAVEABLE = ['msg', 'next_msg', 'price', 'monthly', 'service', 'category', 'phone', 'email', 'website', 'channel', 'notes'];
const STAGE_KEYS = ['sent', 'replied', 'building', 'delivered', 'paid', 'lost'];

const clean = (v) => (typeof v === 'string' ? v.trim() : v);

/** Applies one user action to a lead and returns the updated lead. */
export function applyAction(id, body) {
  const lead = getLead(id);
  if (!lead) throw error(404, 'Lead not found');
  const today = istDate();

  switch (body.action) {
    case 'save': {
      const patch = {};
      for (const k of SAVEABLE) if (k in body) patch[k] = clean(body[k]);
      for (const k of ['price', 'monthly']) {
        if (k in patch) patch[k] = patch[k] === null || patch[k] === '' ? null : Math.max(0, Math.round(Number(patch[k]) || 0));
      }
      if ('channel' in patch && !['wa', 'email'].includes(patch.channel)) throw error(400, 'Unknown channel');
      // Changing anything that feeds the draft clears a custom message, unless the message itself was edited.
      if (('price' in patch || 'monthly' in patch || 'service' in patch || 'category' in patch) && !('msg' in patch)) patch.msg = null;
      return updateLead(id, patch);
    }

    case 'approve': {
      if (lead.status !== 'pending') throw error(400, 'Only pending leads can be approved');
      const text = String(body.msg ?? lead.msg ?? '').trim();
      if (!text) throw error(400, 'Message is empty');
      if (lead.channel === 'wa' && !normPhone(lead.phone)) throw error(400, 'Add a valid 10-digit mobile number first');
      if (lead.channel === 'email' && !lead.email) throw error(400, 'Add an email address first');
      addMessage(id, 'me', text);
      return updateLead(id, {
        status: 'approved', stage: 'sent', approved_at: today, msg: text,
        sends: { sent: 1 }, next_follow_at: addDays(3)
      });
    }

    case 'skip':
      return updateLead(id, { status: 'skipped' });
    case 'pending':
      return updateLead(id, { status: 'pending' });

    case 'reply': {
      const text = String(body.text ?? '').trim();
      if (!text) throw error(400, 'Reply is empty');
      if (lead.status !== 'approved') throw error(400, 'Approve this lead first');
      addMessage(id, 'them', text);
      return updateLead(id, {
        stage: lead.stage === 'sent' ? 'replied' : lead.stage,
        next_msg: lead.stage === 'sent' ? null : lead.next_msg,
        next_follow_at: today
      });
    }

    case 'send': {
      if (lead.status !== 'approved') throw error(400, 'Approve this lead first');
      const text = String(body.text ?? '').trim();
      if (!text) throw error(400, 'Message is empty');
      addMessage(id, 'me', text);
      const sends = { ...lead.sends, [lead.stage]: (lead.sends[lead.stage] || 0) + 1 };
      return updateLead(id, { sends, next_msg: null, next_follow_at: nextFollowAfterSend(lead.stage, sends[lead.stage]) });
    }

    case 'stage': {
      if (!STAGE_KEYS.includes(body.stage)) throw error(400, 'Unknown stage');
      const patch = { stage: body.stage, next_msg: null };
      if (['delivered', 'paid', 'building', 'lost'].includes(body.stage)) patch.next_follow_at = null;
      patch.paid_at = body.stage === 'paid' ? (lead.paid_at || today) : null;
      return updateLead(id, patch);
    }

    case 'ensure_invoice': {
      if (lead.status !== 'approved') throw error(400, 'Approve this lead first');
      if (lead.invoice_no) return lead;
      return updateLead(id, { invoice_no: nextInvoiceNo(), invoice_date: today });
    }

    case 'doc': {
      if (lead.status !== 'approved') throw error(400, 'Approve this lead first');
      if (!['agreement', 'invoice'].includes(body.doc)) throw error(400, 'Unknown document');
      const text = String(body.text ?? '').trim();
      if (!text) throw error(400, 'Message is empty');
      addMessage(id, 'me', text);
      if (body.doc === 'agreement') {
        // Lock the agreed price in, so later changes to your settings do not alter it.
        const patch = { agreement_sent_at: today };
        if (lead.price == null && body.price != null) patch.price = Math.round(Number(body.price));
        if (lead.monthly == null && body.monthly != null) patch.monthly = Math.round(Number(body.monthly));
        return updateLead(id, patch);
      }
      return updateLead(id, { invoice_sent_at: today });
    }

    case 'dnc':
      return updateLead(id, { dnc: true, stage: 'lost', next_follow_at: null });
    case 'close':
      return updateLead(id, { stage: 'lost', next_follow_at: null });

    default:
      throw error(400, 'Unknown action');
  }
}

export { getSettings, isMobile };
