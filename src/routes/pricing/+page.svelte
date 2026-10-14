<script>
  import { invalidateAll } from '$app/navigation';
  import { SERVICES, fmtINR } from '$lib/shared/catalog.js';
  import { saveSettings } from '$lib/saveSettings.js';

  let { data } = $props();
  let s = $state({
    rate: data.settings.rate, cap: data.settings.cap, years: data.settings.years,
    upi: data.settings.upi, launch: data.settings.launch,
    ownerName: data.settings.ownerName, email: data.settings.email, portfolio: data.settings.portfolio,
    phone: data.settings.phone, gstin: data.settings.gstin
  });
  let status = $state('');
  let failed = $state(false);

  // Runs when you press the button and also whenever you leave a field, so nothing is lost.
  async function save() {
    status = 'Saving…';
    failed = false;
    try {
      await saveSettings({ ...s });
      await invalidateAll();
      status = 'Saved to the database ✓';
    } catch (e) {
      failed = true;
      status = 'Not saved: ' + e.message;
    }
  }

  const extra = [
    ['Review-collection QR + page', '₹1,999', 'Customers scan and rate; happy ones are sent to Google.'],
    ['Loyalty / punch card app (Flutter)', '₹9,999–₹19,999', 'Stamps and rewards for cafés and salons.'],
    ['WhatsApp automation (n8n)', '₹5,000–₹15,000 + monthly', 'Booking confirmations, fee reminders, auto-replies.'],
    ['Website care plan', '₹399–₹1,499/month', 'Hosting, backups, edits. Your steady recurring income.']
  ];
</script>

<svelte:head><title>Pricing & settings · Outreach Desk</title></svelte:head>

<div class="panel">
  <h2>Services and starting prices</h2>
  <div class="scroll">
    <table>
      <thead><tr><th>Service</th><th>Setup range</th><th>Monthly</th><th>Your effort</th><th>Upsell later</th></tr></thead>
      <tbody>
        {#each Object.values(SERVICES) as c}
          <tr><td><b>{c.label}</b></td><td>{fmtINR(c.lo)} – {fmtINR(c.hi)}</td><td>{c.monthly ? fmtINR(c.monthly) : 'None'}</td><td>{c.hours} h</td><td>{c.addons.join(', ')}</td></tr>
        {/each}
      </tbody>
    </table>
  </div>

  <h3>When the client pays</h3>
  <div class="steps">
    <div><b>Free</b>Sample website (generic, built once per service)</div>
    <div><b>Free</b>Customised build, only after they say yes and send their details</div>
    <div><b>Setup fee</b>After they approve the finished site, before go-live</div>
    <div><b>Monthly fee</b>Starts the month after go-live, 30 days' notice to cancel</div>
  </div>

  <h3>Other things you can sell</h3>
  <div class="scroll"><table><tbody>
    {#each extra as e}<tr><td><b>{e[0]}</b></td><td>{e[1]}</td><td>{e[2]}</td></tr>{/each}
  </tbody></table></div>

  <h3>Settings</h3>
  <div class="row">
    <label class="f">Your hourly rate (₹)<input type="number" min="100" step="50" bind:value={s.rate} onchange={save} /></label>
    <label class="f">Daily cap of new messages<input type="number" min="1" max="50" bind:value={s.cap} onchange={save} /></label>
    <label class="f">Years of experience (shown in messages)<input type="number" min="1" max="30" bind:value={s.years} onchange={save} /></label>
    <label class="f">Your UPI ID<input type="text" bind:value={s.upi} placeholder="name@bank" onchange={save} /></label>
    <label class="f" style="flex-direction:row;align-items:center;gap:8px"><input type="checkbox" bind:checked={s.launch} onchange={save} /> Launch offer: 10% off for Navratri/Durga Puja clients</label>
  </div>
  <h3>Your details (used in messages, agreements and invoices)</h3>
  <div class="row">
    <label class="f">Your name<input type="text" bind:value={s.ownerName} onchange={save} /></label>
    <label class="f">Professional email<input type="email" bind:value={s.email} onchange={save} /></label>
    <label class="f">Portfolio link<input type="text" bind:value={s.portfolio} onchange={save} /></label>
    <label class="f">Phone (optional)<input type="text" bind:value={s.phone} onchange={save} /></label>
    <label class="f">GSTIN (only if registered)<input type="text" bind:value={s.gstin} onchange={save} /></label>
  </div>
  <div class="actions" style="position:static;border:0"><button class="btn ok" onclick={save}>Save settings</button></div>
  {#if status}<div class={failed ? 'err-note' : 'ok-note'} role="status">{status}</div>{/if}
  <p class="note">Settings are stored in this database file: <code>{data.dbPath}</code></p>
  <p class="note">Ranges are starting points for small Indian businesses, not verified market data. Adjust after your first five conversations.</p>
</div>

