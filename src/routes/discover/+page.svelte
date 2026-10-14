<script>
  import { invalidateAll } from '$app/navigation';
  import { CATEGORIES, SERVICES, DEFAULT_SERVICE, typeIsReady } from '$lib/shared/catalog.js';
  import { fmtTime } from '$lib/shared/dates.js';

  let { data } = $props();

  let cities = $state(data.settings.cities);
  let types = $state([...data.settings.types]);
  let perRun = $state(data.settings.perRun);
  let running = $state(false);
  let result = $state(null);
  let error = $state('');
  let csv = $state('');
  let importMsg = $state('');

  async function saveTargets() {
    await fetch('/api/settings', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cities, types, perRun })
    });
  }

  async function run() {
    running = true; error = ''; result = null;
    try {
      await saveTargets();
      const r = await fetch('/api/discover', { method: 'POST' });
      const j = await r.json();
      if (!r.ok) error = j.message || 'Search failed';
      else result = j;
      await invalidateAll();
    } catch (e) {
      error = e.message;
    } finally {
      running = false;
    }
  }

  async function doImport() {
    importMsg = '';
    const r = await fetch('/api/import', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: csv })
    });
    const j = await r.json();
    if (!r.ok) importMsg = j.message || 'Import failed';
    else { importMsg = `${j.added} added, ${j.duplicates} skipped as duplicates.`; csv = ''; await invalidateAll(); }
  }
</script>

<svelte:head><title>Discover · Outreach Desk</title></svelte:head>

<div class="panel">
  <h2>Find today's leads</h2>
  <p class="sub">
    The server searches Google Maps listings, skips big chains and duplicates, checks which businesses have no website,
    ranks the rest by how likely they are to say yes, and adds the best ones to your queue sorted by service.
  </p>

  {#if !data.hasKey}
    <div class="warn">GOOGLE_PLACES_API_KEY is not set, so searching is switched off. Add it to your .env file and restart the app.</div>
  {/if}

  <div class="row" style="margin-top:10px">
    <label class="f" style="flex:1;min-width:240px">Cities (comma separated)
      <input type="text" bind:value={cities} placeholder="Guwahati, Jorhat, Dibrugarh" />
    </label>
    <label class="f">Leads per search
      <input type="number" min="1" max="60" bind:value={perRun} />
    </label>
  </div>

  <h3>Business types</h3>
  <p class="note" style="margin:0 0 6px">Only types whose service has a demo link are searched. Add links on the <a href="/demos">Demo sites</a> page to switch more on.</p>
  <div class="checkrow">
    {#each Object.entries(CATEGORIES) as [k, c]}
      <label>
        <input type="checkbox" value={k} bind:group={types} /> {c.short}
        <span class="note">({SERVICES[DEFAULT_SERVICE[k]].label}{#if !typeIsReady(data.settings, k)}: paused, no demo link yet{/if})</span>
      </label>
    {/each}
  </div>

  <div class="actions" style="position:static;border:0">
    <button class="btn ok" disabled={running || !data.hasKey} onclick={run}>{running ? 'Searching…' : 'Find leads now'}</button>
    <button class="btn ghost" onclick={saveTargets}>Save targets</button>
  </div>

  {#if error}<div class="err-note">{error}</div>{/if}
  {#if result}
    <div class="ok-note">
      Found {result.found} listings and added {result.added} new leads to your queue.
      {#if result.paused?.length}Skipped types with no demo link: {result.paused.join(', ')}.{/if}
      Skipped: {result.skipped.chain} chains, {result.skipped.noPhone} without a phone, {result.skipped.existing} already saved, {result.skipped.tooBig} too big, {result.skipped.closed} closed.
      {#if result.skipped.errors.length}<br />Some searches failed: {result.skipped.errors.join('; ')}{/if}
    </div>
    <p><a class="btn ghost" href="/" style="text-decoration:none;display:inline-block">Review today's queue</a></p>
  {/if}

  <p class="note" style="margin-top:10px">
    {#if data.autoTime}
      Automatic search runs every day at {data.autoTime} IST while the app is running.
    {:else}
      Automatic daily search is off. Set AUTO_DISCOVER_TIME (for example 08:30) in your .env file to turn it on.
    {/if}
    {data.stats.newToday} leads were added today.
  </p>
  <p class="note">
    Google searches used this month: <b>{data.usage}</b>. The fields this app asks for fall in Google's "Text Search Enterprise" tier,
    which has a free allowance of 1,000 requests a month at the time of writing, then a per-request charge. Each press of the button uses
    about {Math.max(1, types.filter((t) => typeIsReady(data.settings, t)).length) * cities.split(/[,\n]/).filter((c) => c.trim()).length * 2} requests. Check the current numbers in your Google Cloud billing page and set a budget alert.
  </p>
</div>

<div class="panel" style="margin-top:12px">
  <h3 style="margin-top:0">Recent searches</h3>
  <div class="scroll">
    <table class="runs">
      <thead><tr><th>When</th><th>Trigger</th><th>Where</th><th>Found</th><th>Added</th><th>Notes</th></tr></thead>
      <tbody>
        {#each data.runs as r (r.id)}
          <tr>
            <td>{fmtTime(r.at)}</td><td>{r.trigger}</td><td>{r.cities}</td><td>{r.found}</td><td>{r.added}</td>
            <td>{r.error ?? ''}</td>
          </tr>
        {:else}
          <tr><td colspan="6" class="note">No searches yet.</td></tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<div class="panel" style="margin-top:12px">
  <h3 style="margin-top:0">Or add leads yourself</h3>
  <p class="note"><code>name, category, city, phone, email, website, rating, reviews, notes</code></p>
  <textarea style="min-height:110px" bind:value={csv} placeholder="Spice Route Kitchen, restaurant, Guwahati, 9864012345, , , 4.4, 85, Instagram only"></textarea>
  <div class="actions" style="position:static;border:0">
    <button class="btn ok" disabled={!csv.trim()} onclick={doImport}>Add to queue</button>
  </div>
  {#if importMsg}<div class="ok-note">{importMsg}</div>{/if}
  <p class="note">Only contact numbers that businesses have published for enquiries. Send one message plus the two follow-ups, and stop when someone says STOP.</p>
</div>
