<script>
  import { invalidateAll } from '$app/navigation';
  import {
    SERVICES, CATEGORIES, score, suggest, draft, svc, normPhone, isMobile,
    fmtINR, demoIsPlaceholder, priceOf
  } from '$lib/shared/catalog.js';

  let { data } = $props();

  let filter = $state('pending');
  let sfilter = $state('all');
  let selId = $state(null);
  let busy = $state(false);
  let toast = $state('');
  let ta = $state();
  let moreCount = $state(20);
  let finding = $state(false);

  const settings = $derived(data.settings);
  const all = $derived(
    data.leads.map((l) => ({ ...l, sc: score(l) })).sort((a, b) => b.sc.score - a.sc.score)
  );
  const pend = $derived(all.filter((l) => l.status === 'pending'));
  const visible = $derived(
    all.filter((l) => l.status === filter && (sfilter === 'all' || svc(l) === sfilter))
  );
  const sel = $derived(visible.find((l) => l.id === selId) ?? visible[0] ?? null);
  const view = $derived(sel ? { p: priceOf(sel, settings), d: draft(sel, settings), g: suggest(sel, settings) } : null);
  const text = $derived(sel ? (sel.msg ?? view.d.body) : '');
  const waOK = $derived(sel ? !!normPhone(sel.phone) : false);

  function flash(t) {
    toast = t;
    setTimeout(() => (toast = ''), 3200);
  }

  async function call(id, body) {
    busy = true;
    try {
      const r = await fetch(`/api/leads/${id}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        flash(e.message || 'Something went wrong');
        return false;
      }
      await invalidateAll();
      return true;
    } finally {
      busy = false;
    }
  }

  const save = (patch) => sel && call(sel.id, { action: 'save', ...patch });

  async function approve() {
    const l = sel;
    const msg = ta?.value ?? text;
    if (l.channel === 'wa') {
      if (!waOK) return flash('Add a valid 10-digit mobile number first');
      window.open(`https://wa.me/${normPhone(l.phone)}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    } else {
      if (!l.email) return flash('Add an email address first');
      window.open(
        `mailto:${encodeURIComponent(l.email)}?subject=${encodeURIComponent(view.d.subject)}&body=${encodeURIComponent(msg)}`,
        '_blank', 'noopener'
      );
    }
    const next = visible.find((x) => x.id !== l.id)?.id ?? null;
    if (await call(l.id, { action: 'approve', msg })) {
      selId = next;
      flash('Approved. Press send in ' + (l.channel === 'wa' ? 'WhatsApp' : 'your mail app'));
    }
  }

  async function findMore() {
    finding = true;
    try {
      const r = await fetch('/api/discover', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ limit: moreCount })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) flash(j.message || 'Search failed');
      else if (j.added) { flash(`Added ${j.added} new leads`); filter = 'pending'; sfilter = 'all'; selId = null; }
      else flash(j.message || 'No new leads found');
      await invalidateAll();
    } catch (e) {
      flash(e.message);
    } finally {
      finding = false;
    }
  }

  async function skip() {
    const next = visible.find((x) => x.id !== sel.id)?.id ?? null;
    if (await call(sel.id, { action: 'skip' })) selId = next;
  }
</script>

<svelte:head><title>Today's queue · Outreach Desk</title></svelte:head>

<div class="row" style="justify-content:space-between;margin:0 0 8px">
  <p class="note" style="margin:0">
    {data.stats.newToday} leads added today. Counts show pending leads only.
    {#if data.stats.doneToday >= data.cap}Daily goal reached. You can still send more whenever you like.{/if}
  </p>
  <div class="row">
    <label class="f" style="flex-direction:row;align-items:center;gap:6px">More leads
      <input type="number" min="1" max="60" bind:value={moreCount} style="width:70px" />
    </label>
    <button class="btn ghost" disabled={finding || !data.hasKey} onclick={findMore}>{finding ? 'Searching…' : 'Find more leads'}</button>
  </div>
</div>

{#if pend.length === 0 && data.stats.doneToday > 0}
  <div class="ok-note" style="margin-bottom:10px">
    You have worked through every lead in the queue. Press <b>Find more leads</b> to fetch {moreCount} more whenever you feel like sending to more people.
  </div>
{/if}

<div class="filters" style="padding:0 0 10px">
  <button class="chip" aria-pressed={sfilter === 'all'} onclick={() => (sfilter = 'all')}>All services ({pend.length})</button>
  {#each Object.entries(SERVICES) as [k, s]}
    {@const n = pend.filter((l) => svc(l) === k).length}
    {#if n || sfilter === k}
      <button class="chip" aria-pressed={sfilter === k} onclick={() => (sfilter = k)}>{s.label} ({n})</button>
    {/if}
  {/each}
</div>

<div class="grid">
  <div class="panel list">
    <div class="filters">
      {#each ['pending', 'skipped'] as f}
        <button class="chip" aria-pressed={filter === f} onclick={() => (filter = f)}>
          {f[0].toUpperCase() + f.slice(1)} ({all.filter((l) => l.status === f).length})
        </button>
      {/each}
    </div>
    {#each visible as l (l.id)}
      <button class="item" aria-current={sel?.id === l.id} onclick={() => (selId = l.id)}>
        <div class="n">
          <span class:st-skipped={l.status === 'skipped'}>{l.name}</span>
          <span class="score {l.sc.score >= 70 ? 's-hi' : l.sc.score >= 45 ? 's-mid' : 's-lo'}" title="Chance of a positive reply">{l.sc.score}</span>
        </div>
        <div class="m">{SERVICES[svc(l)].label} · {CATEGORIES[l.category]?.short ?? l.category} · {l.city || '—'}</div>
      </button>
    {:else}
      <div class="empty">
        Nothing here yet. Press <b>Find more leads</b> above, or open <a href="/discover">Discover</a>.
      </div>
    {/each}
  </div>

  {#if sel && view}
    <div class="panel">
      <h2>{sel.name}</h2>
      <div class="note">
        {CATEGORIES[sel.category]?.label} · {sel.city || 'city not set'}
        {#if sel.address}· {sel.address}{/if}
        {#if sel.maps_url}· <a href={sel.maps_url} target="_blank" rel="noopener">Open in Google Maps</a>{/if}
      </div>

      <div class="facts">
        <div><b>Reply likelihood</b>{sel.sc.score} / 100</div>
        <div><b>Google rating</b>{sel.rating ? `${sel.rating}★ (${sel.reviews})` : '—'}</div>
        <div><b>Website</b>{sel.website ? sel.website : sel.website_checked ? 'None on Google' : 'None recorded'}</div>
        <div><b>Capacity tier</b>{view.g.tier}</div>
      </div>

      <div class="note">
        Service: <b>{SERVICES[svc(sel)].label}</b>. Pitch later: {SERVICES[svc(sel)].addons.join(', ')}.
        {#if sel.source}Source: {sel.source}.{/if}
      </div>
      <details>
        <summary class="note" style="cursor:pointer">Why this lead scored {sel.sc.score}</summary>
        <ul class="reasons">{#each sel.sc.reasons as r}<li>{r}</li>{/each}</ul>
      </details>

      <div class="row" style="margin-top:12px">
        <label class="f">Business type
          <select value={sel.category} onchange={(e) => save({ category: e.currentTarget.value })}>
            {#each Object.entries(CATEGORIES) as [k, c]}<option value={k}>{c.label}</option>{/each}
          </select>
        </label>
        <label class="f">Service to offer
          <select value={svc(sel)} onchange={(e) => save({ service: e.currentTarget.value })}>
            {#each Object.entries(SERVICES) as [k, s]}<option value={k}>{s.label}</option>{/each}
          </select>
        </label>
        <label class="f">WhatsApp number
          <input type="text" inputmode="tel" value={sel.phone} placeholder="98640 00000" onchange={(e) => save({ phone: e.currentTarget.value })} />
        </label>
        <label class="f">Email
          <input type="email" value={sel.email} placeholder="owner@example.com" onchange={(e) => save({ email: e.currentTarget.value })} />
        </label>
        <label class="f">Website
          <input type="text" value={sel.website} placeholder="none" onchange={(e) => save({ website: e.currentTarget.value })} />
        </label>
      </div>

      {#if sel.phone && !isMobile(sel.phone)}
        <div class="warn">This looks like a landline. WhatsApp will not work, so call them or find a mobile number.</div>
      {/if}

      <h3>Draft message</h3>
      <div class="row" style="margin-bottom:8px">
        <div class="seg" role="group" aria-label="Channel">
          <button aria-pressed={sel.channel === 'wa'} onclick={() => save({ channel: 'wa' })}>WhatsApp</button>
          <button aria-pressed={sel.channel === 'email'} onclick={() => save({ channel: 'email' })}>Email</button>
        </div>
        <button class="btn ghost" onclick={() => save({ msg: null })}>Reset draft</button>
      </div>
      {#if sel.channel === 'email'}<div class="note" style="margin-bottom:6px">Subject: <b>{view.d.subject}</b></div>{/if}
      <textarea bind:this={ta} aria-label="Message draft" value={text} onchange={(e) => save({ msg: e.currentTarget.value })}></textarea>
      {#if demoIsPlaceholder(settings, svc(sel))}
        <div class="warn">The demo link is still a placeholder. Add your real link on the <a href="/demos">Demo sites</a> page before approving.</div>
      {/if}

      <h3>Price</h3>
      <div class="row">
        <label class="f">Setup (one-time, ₹)
          <input type="number" min="0" step="500" value={view.p.setup} onchange={(e) => save({ price: e.currentTarget.value })} />
        </label>
        <label class="f">Monthly (₹)
          <input type="number" min="0" step="100" value={view.p.monthly} onchange={(e) => save({ monthly: e.currentTarget.value })} />
        </label>
        <button class="btn ghost" onclick={() => save({ price: null, monthly: null })}>Use suggested</button>
      </div>
      <div class="why">
        <b>Why {fmtINR(view.p.setup)} is fair</b>
        <ul>
          <li><b>Your time:</b> about {view.g.c.hours} hours at {fmtINR(settings.rate)}/hour is {fmtINR(view.g.floor)}, which is your minimum. Your reusable template makes {view.g.c.days} days realistic.</li>
          <li><b>Their capacity:</b> this looks like {view.g.tierText}.{#if sel.website} They already have a site, so a revamp is discounted.{/if}{#if settings.launch} Launch offer: 10% off.{/if}</li>
          <li><b>Payback for them:</b> at about {fmtINR(view.g.c.ticket)} per customer, roughly {Math.max(1, Math.ceil(view.p.setup / view.g.c.ticket))} extra {view.g.c.unit} covers the whole cost.</li>
          <li><b>Market check:</b> agency quotes for a comparable site are usually much higher. Confirm with two local quotes before you rely on this.</li>
          <li><b>When you get paid:</b> {fmtINR(view.p.setup)} after they approve the finished site, before it goes live.{#if view.p.monthly} {fmtINR(view.p.monthly)}/month starts the month after it is live.{/if}</li>
        </ul>
        <div class="walk">Lowest you should accept: {fmtINR(view.g.walk)}. Below that you earn under {fmtINR(settings.rate)}/hour.</div>
      </div>

      <div class="actions">
        {#if sel.status === 'pending'}
          <button class="btn ok" disabled={busy || (sel.channel === 'wa' && !waOK) || (sel.channel === 'email' && !sel.email)} onclick={approve}>
            Approve and open {sel.channel === 'wa' ? 'WhatsApp' : 'email'}
          </button>
          <button class="btn no" disabled={busy} onclick={skip}>Skip this lead</button>
        {:else}
          <button class="btn ghost" disabled={busy} onclick={() => call(sel.id, { action: 'pending' })}>Move back to pending</button>
        {/if}
      </div>
      {#if sel.status === 'pending' && sel.channel === 'wa' && !waOK}
        <div class="note" style="margin-top:6px">Enter a 10-digit mobile number to enable WhatsApp.</div>
      {/if}
    </div>
  {:else}
    <div class="panel empty">Select a lead to review its draft.</div>
  {/if}
</div>

{#if toast}<div class="toast" role="status">{toast}</div>{/if}
