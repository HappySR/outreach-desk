<script>
  import { fmtINR } from '$lib/shared/catalog.js';
  import { parties, agreementClauses, invoiceData, longDate } from '$lib/shared/documents.js';

  let { data } = $props();

  const p = $derived(parties(data.lead, data.settings));
  const ag = $derived(agreementClauses(data.lead, data.settings));
  const inv = $derived(invoiceData(data.lead, data.settings, data.today));
  const agreementDate = $derived(data.lead.agreement_sent_at || data.today);
</script>

<svelte:head>
  <title>{data.type === 'invoice' ? `Invoice ${inv.no}` : 'Website service agreement'} · {data.lead.name}</title>
</svelte:head>

<div class="toolbar noprint">
  <a href="/conversations">← Back to conversations</a>
  <button onclick={() => window.print()}>Print or save as PDF</button>
</div>

<main class="sheet">
  <header>
    <div>
      <h1>{data.type === 'invoice' ? 'Invoice' : 'Website service agreement'}</h1>
      {#if data.type === 'invoice'}
        <p class="meta">No. <b>{inv.no}</b> · Date {longDate(inv.date)}</p>
      {:else}
        <p class="meta">Date {longDate(agreementDate)}</p>
      {/if}
    </div>
    {#if data.type === 'invoice'}
      <div class="stamp" class:paid={inv.paid}>{inv.paid ? `PAID ${inv.paidAt}` : 'UNPAID'}</div>
    {/if}
  </header>

  <section class="parties">
    <div>
      <h2>{data.type === 'invoice' ? 'From' : 'Developer'}</h2>
      <p><b>{p.me.name}</b></p>
      {#each p.me.lines as l}<p>{l}</p>{/each}
    </div>
    <div>
      <h2>{data.type === 'invoice' ? 'Bill to' : 'Client'}</h2>
      <p><b>{p.client.name}</b></p>
      {#each p.client.lines as l}<p>{l}</p>{/each}
    </div>
  </section>

  {#if data.type === 'agreement'}
    <ol class="clauses">
      {#each ag.clauses as c}
        <li><b>{c.h}.</b> {c.t}</li>
      {/each}
    </ol>
    <section class="sign">
      <div><div class="line"></div>For {p.client.name}<br />Name and date</div>
      <div><div class="line"></div>For {p.me.name}<br />Date: {longDate(agreementDate)}</div>
    </section>
  {:else}
    <table>
      <thead><tr><th>Description</th><th class="r">Amount</th></tr></thead>
      <tbody>
        {#each inv.items as it}<tr><td>{it.desc}</td><td class="r">{fmtINR(it.amount)}</td></tr>{/each}
      </tbody>
      <tfoot><tr><td class="r"><b>Total due</b></td><td class="r"><b>{fmtINR(inv.total)}</b></td></tr></tfoot>
    </table>

    <section class="pay">
      <h2>How to pay</h2>
      <p>Due after you approve the finished website, before it goes live. I put it live within 24 hours of payment.</p>
      <p>UPI: <b>{inv.upi || 'add your UPI ID in Pricing & settings'}</b>. Please mention <b>{inv.no}</b> in the payment note.</p>
      {#if inv.monthly}
        <p>Hosting and updates ({fmtINR(inv.monthly)} per month) start only after the website is live and are billed separately each month.</p>
      {/if}
    </section>
  {/if}

  <footer>Thank you for your business. Questions? {data.settings.email}</footer>
</main>

<style>
  :global(body) { background: #e9edeb; }
  .toolbar { max-width: 794px; margin: 12px auto; display: flex; justify-content: space-between; align-items: center; font-family: 'Public Sans', system-ui, sans-serif; }
  .toolbar a { color: #0f5f5a; }
  .toolbar button { background: #0f5f5a; color: #fff; border: 0; border-radius: 8px; padding: 9px 16px; font-weight: 600; cursor: pointer; }
  .sheet { background: #fff; color: #14231f; max-width: 794px; min-height: 1000px; margin: 0 auto 24px; padding: 48px 56px; font-family: 'Public Sans', system-ui, sans-serif; font-size: 14px; line-height: 1.55; box-shadow: 0 2px 12px rgba(0,0,0,.12); }
  header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #e9a81b; padding-bottom: 14px; }
  h1 { font-family: 'Bricolage Grotesque', system-ui, sans-serif; font-size: 28px; margin: 0; }
  h2 { font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: #5b706c; margin: 0 0 4px; }
  .meta { margin: 4px 0 0; color: #5b706c; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 22px 0; }
  .parties p { margin: 0; }
  .clauses { padding-left: 20px; margin: 0; }
  .clauses li { margin: 0 0 9px; }
  .sign { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 44px; }
  .line { border-bottom: 1px solid #14231f; height: 38px; margin-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { padding: 10px 8px; border-bottom: 1px solid #cfd9d6; text-align: left; vertical-align: top; }
  .r { text-align: right; white-space: nowrap; }
  tfoot td { border-bottom: 0; font-size: 16px; }
  .pay { margin-top: 24px; background: #f2f6f4; border-radius: 8px; padding: 12px 16px; }
  .pay p { margin: 4px 0; }
  .stamp { border: 2px solid #b03a3a; color: #b03a3a; border-radius: 6px; padding: 4px 12px; font-weight: 700; letter-spacing: .05em; transform: rotate(-4deg); }
  .stamp.paid { border-color: #1e7a4c; color: #1e7a4c; }
  footer { margin-top: 36px; color: #5b706c; font-size: 12px; text-align: center; }
  @media print {
    :global(body) { background: #fff; }
    .noprint { display: none; }
    .sheet { box-shadow: none; margin: 0; padding: 0; max-width: none; min-height: 0; }
    @page { size: A4; margin: 18mm; }
  }
  @media (max-width: 640px) { .sheet { padding: 24px 18px; } .parties, .sign { grid-template-columns: 1fr; } }
</style>
