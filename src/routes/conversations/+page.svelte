<script>
  import { invalidateAll } from '$app/navigation';
  import {
    SERVICES, CATEGORIES, STAGES, svc, nextDraft, priceOf, normPhone, isDue,
    hasPlaceholder, fmtINR, score
  } from '$lib/shared/catalog.js';
  import { fmtTime } from '$lib/shared/dates.js';
  import { agreementText, invoiceText } from '$lib/shared/documents.js';

  let { data } = $props();

  let filter = $state('active');
  let selId = $state(null);
  let busy = $state(false);
  let toast = $state('');
  let replyText = $state('');
  let nextTa = $state();

  const settings = $derived(data.settings);
  const leads = $derived(data.leads);
  const dueIds = $derived(new Set(leads.filter((l) => isDue(l, data.today)).map((l) => l.id)));
  const open = (l) => !['paid', 'lost'].includes(l.stage);
  const counts = $derived({
    due: dueIds.size,
    active: leads.filter(open).length,
    paid: leads.filter((l) => l.stage === 'paid').length,
    lost: leads.filter((l) => l.stage === 'lost').length,
    all: leads.length
  });
  const list = $derived(
    leads
      .filter((l) =>
        filter === 'all' ||
        (filter === 'due' && dueIds.has(l.id)) ||
        (filter === 'active' && open(l)) ||
        (filter === 'paid' && l.stage === 'paid') ||
        (filter === 'lost' && l.stage === 'lost'))
      .sort((a, b) => (dueIds.has(b.id) ? 1 : 0) - (dueIds.has(a.id) ? 1 : 0) || (b.approved_at || '').localeCompare(a.approved_at || ''))
  );
  const sel = $derived(list.find((l) => l.id === selId) ?? list[0] ?? null);
  const thread = $derived(sel ? data.messages[sel.id] ?? [] : []);
  const nd = $derived(sel ? nextDraft(sel, settings) : null);
  const ndText = $derived(sel && nd ? (sel.next_msg ?? nd.text) : '');
  const price = $derived(sel ? priceOf(sel, settings) : null);

  function flash(t) {
    toast = t;
    setTimeout(() => (toast = ''), 3200);
  }

  async function call(body) {
    busy = true;
    try {
      const r = await fetch(`/api/leads/${sel.id}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        flash(e.message || 'Something went wrong');
        return false;
      }
      const j = await r.json().catch(() => ({}));
      await invalidateAll();
      return j.lead ?? true;
    } finally {
      busy = false;
    }
  }

  async function addReply() {
    if (!replyText.trim()) return;
    if (await call({ action: 'reply', text: replyText })) replyText = '';
  }

  function openChannel(l, msg, subject) {
    if (l.channel === 'wa') {
      if (!normPhone(l.phone)) { flash('Add a valid 10-digit mobile number first'); return false; }
      window.open(`https://wa.me/${normPhone(l.phone)}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    } else {
      if (!l.email) { flash('Add an email address first'); return false; }
      window.open(`mailto:${encodeURIComponent(l.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    }
    return true;
  }

  async function sendNext() {
    const l = sel;
    const msg = nextTa?.value ?? ndText;
    if (hasPlaceholder(msg)) return flash('Replace the [bracketed] placeholders first');
    if (!openChannel(l, msg, 'Your website: ' + l.name)) return;
    if (await call({ action: 'send', text: msg })) flash('Logged. Press send in ' + (l.channel === 'wa' ? 'WhatsApp' : 'your mail app'));
  }

  // Agreement and invoice go out as a message you only have to send. The printable copy is one click away.
  async function sendDoc(kind) {
    let l = sel;
    if (kind === 'invoice') {
      if (!settings.upi) return flash('Add your UPI ID in Pricing & settings first');
      if (!l.invoice_no) {
        const updated = await call({ action: 'ensure_invoice' });
        if (!updated || updated === true) return;
        l = updated;
      }
    }
    const msg = kind === 'agreement' ? agreementText(l, settings, data.today) : invoiceText(l, settings, data.today);
    if (!openChannel(l, msg, kind === 'agreement' ? `Agreement: website for ${l.name}` : `Invoice ${l.invoice_no}: ${l.name}`)) return;
    const pr = priceOf(l, settings);
    if (await call({ action: 'doc', doc: kind, text: msg, price: pr.setup, monthly: pr.monthly })) {
      flash('Logged. Press send in ' + (l.channel === 'wa' ? 'WhatsApp' : 'your mail app'));
    }
  }

  const stageLabel = (k) => STAGES.find((s) => s[0] === k)?.[1] ?? k;
</script>

<svelte:head><title>Conversations · Outreach Desk</title></svelte:head>

<div class="grid">
  <div class="panel list">
    <div class="filters">
      {#each [['due', 'Follow up'], ['active', 'Active'], ['paid', 'Paid'], ['lost', 'Closed'], ['all', 'All']] as [k, t]}
        <button class="chip" aria-pressed={filter === k} onclick={() => (filter = k)}>{t} ({counts[k]})</button>
      {/each}
    </div>
    {#each list as l (l.id)}
      <button class="item" aria-current={sel?.id === l.id} onclick={() => (selId = l.id)}>
        <div class="n">
          <span>{l.name}{#if dueIds.has(l.id)}<span class="tag due">follow up</span>{/if}</span>
          <span class="tag">{stageLabel(l.stage)}</span>
        </div>
        <div class="m">{SERVICES[svc(l)].label} · {CATEGORIES[l.category]?.short ?? l.category} · {l.city || '—'}</div>
      </button>
    {:else}
      <div class="empty">Nothing here yet. Approve a lead in <a href="/">Today's queue</a> and it appears here.</div>
    {/each}
  </div>

  {#if sel}
    <div class="panel">
      <h2>{sel.name}</h2>
      <div class="note">
        {CATEGORIES[sel.category]?.label} · {sel.city}
        {#if dueIds.has(sel.id)}<span class="tag due">follow up due</span>
        {:else if sel.next_follow_at}<span class="tag">next follow-up {sel.next_follow_at}</span>{/if}
      </div>

      <div class="row" style="margin-top:12px">
        <label class="f">Stage
          <select value={sel.stage} onchange={(e) => call({ action: 'stage', stage: e.currentTarget.value })}>
            {#each STAGES as [k, t]}<option value={k}>{t}</option>{/each}
          </select>
        </label>
        <div class="facts" style="margin:0;flex:1">
          <div><b>Setup fee, due after they approve</b>{fmtINR(price.setup)}</div>
          <div><b>Monthly, from after go-live</b>{price.monthly ? fmtINR(price.monthly) : 'None'}</div>
        </div>
      </div>

      <div class="row" style="margin-top:8px">
        <label class="f">WhatsApp number
          <input type="text" inputmode="tel" value={sel.phone} onchange={(e) => call({ action: 'save', phone: e.currentTarget.value })} />
        </label>
        <label class="f">Email
          <input type="email" value={sel.email} onchange={(e) => call({ action: 'save', email: e.currentTarget.value })} />
        </label>
        <div class="seg" role="group" aria-label="Channel">
          <button aria-pressed={sel.channel === 'wa'} onclick={() => call({ action: 'save', channel: 'wa' })}>WhatsApp</button>
          <button aria-pressed={sel.channel === 'email'} onclick={() => call({ action: 'save', channel: 'email' })}>Email</button>
        </div>
      </div>

      <h3>Messages</h3>
      <div class="thread">
        {#each thread as m (m.id)}
          <div class="bubble {m.who === 'me' ? 'b-me' : 'b-them'}">
            {m.text}
            <div class="note" style="margin-top:4px">{m.who === 'me' ? 'You' : sel.name} · {fmtTime(m.at)}</div>
          </div>
        {:else}
          <div class="note">No messages logged yet.</div>
        {/each}
      </div>
      <div class="note" style="margin:6px 0">
        WhatsApp replies arrive in your WhatsApp app, not here. When someone replies, paste it below so the history and stage stay in one place.
      </div>
      <div class="row">
        <label class="f" style="flex:1;min-width:220px">Their reply
          <textarea style="min-height:70px" bind:value={replyText} placeholder="Paste what they wrote"></textarea>
        </label>
        <button class="btn ghost" disabled={busy || !replyText.trim()} onclick={addReply}>Add reply</button>
      </div>

      <h3>Next message{#if nd}: {nd.label}{/if}</h3>
      {#if nd}
        <textarea bind:this={nextTa} aria-label="Next message" value={ndText} onchange={(e) => call({ action: 'save', next_msg: e.currentTarget.value })}></textarea>
        {#if hasPlaceholder(ndText)}
          <div class="warn">Replace the [bracketed] placeholders before sending. Add your UPI ID in Pricing &amp; settings to fill it in automatically.</div>
        {/if}
        <div class="actions"><button class="btn ok" disabled={busy} onclick={sendNext}>Send via {sel.channel === 'wa' ? 'WhatsApp' : 'email'} and log it</button></div>
      {:else}
        <div class="note">
          {#if sel.stage === 'lost'}Closed. No more messages.
          {:else if sel.stage === 'paid'}Paid and live. Nothing left to send.
          {:else}The follow-up sequence is finished (original message plus two follow-ups). Move the stage forward if they reply, or close it.{/if}
        </div>
      {/if}

      <h3>Documents</h3>
      <div class="cards" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">
        <div class="card">
          <b>One-page agreement</b>
          {#if sel.agreement_sent_at}<span class="tag">sent {sel.agreement_sent_at}</span>
          {:else if sel.stage === 'replied'}<span class="tag due">send now</span>{/if}
          <p class="note" style="margin:6px 0">Send it when they say yes and before you start building.</p>
          <div class="row">
            <a class="btn ghost" href={`/documents/agreement/${sel.id}`} target="_blank" rel="noopener" style="text-decoration:none">Preview or PDF</a>
            <button class="btn ok" disabled={busy} onclick={() => sendDoc('agreement')}>Send as message</button>
          </div>
        </div>
        <div class="card">
          <b>Invoice</b>
          {#if sel.invoice_no}<span class="tag">{sel.invoice_no}</span>{/if}
          {#if sel.invoice_sent_at}<span class="tag">sent {sel.invoice_sent_at}</span>
          {:else if sel.stage === 'delivered'}<span class="tag due">send now</span>{/if}
          <p class="note" style="margin:6px 0">Send it when the finished website is ready for approval.</p>
          <div class="row">
            <a class="btn ghost" href={`/documents/invoice/${sel.id}`} target="_blank" rel="noopener" style="text-decoration:none">Preview or PDF</a>
            <button class="btn ok" disabled={busy} onclick={() => sendDoc('invoice')}>Send as message</button>
          </div>
        </div>
      </div>
      <p class="note">The message contains the full text, so nothing has to be attached. Use Preview or PDF if the client wants a formal copy to download.</p>

      <h3>When money changes hands</h3>
      <div class="steps">
        <div><b>Free</b>Sample website</div>
        <div><b>Free</b>Your customised build, after they say yes</div>
        <div><b>{fmtINR(price.setup)}</b>After they approve the finished site, before it goes live</div>
        <div><b>{price.monthly ? fmtINR(price.monthly) + '/month' : 'No monthly fee'}</b>Starts the month after go-live</div>
      </div>
      <div class="actions">
        <button class="btn no" disabled={busy} onclick={() => call({ action: 'dnc' })}>Do not contact again</button>
        {#if sel.stage !== 'lost'}<button class="btn ghost" disabled={busy} onclick={() => call({ action: 'close' })}>Close as lost</button>{/if}
      </div>
    </div>
  {:else}
    <div class="panel empty">Select a conversation.</div>
  {/if}
</div>

{#if toast}<div class="toast" role="status">{toast}</div>{/if}
