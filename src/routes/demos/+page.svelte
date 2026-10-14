<script>
  import { invalidateAll } from '$app/navigation';
  import { saveSettings } from '$lib/saveSettings.js';
  import { SERVICES, CATEGORIES, DEFAULT_SERVICE } from '$lib/shared/catalog.js';

  let { data } = $props();
  let saved = $state('');

  async function saveDemo(key, value) {
    const demos = { ...data.settings.demos, [key]: value.trim() };
    if (!demos[key]) delete demos[key];
    try {
      await saveSettings({ demos });
      saved = 'Demo link saved';
    } catch (e) {
      saved = 'Not saved: ' + e.message;
    }
    setTimeout(() => (saved = ''), 2000);
    await invalidateAll();
  }

  const usedFor = (k) =>
    Object.entries(DEFAULT_SERVICE).filter(([, s]) => s === k).map(([c]) => CATEGORIES[c].short).join(', ') || 'on request';
</script>

<svelte:head><title>Demo sites · Outreach Desk</title></svelte:head>

<div class="panel">
  <h2>Demo sites to build</h2>
  <p class="sub">Build one demo per service, label it "Sample website", and paste its link. Every draft for that service picks it up.</p>
</div>

<div class="cards" style="margin-top:12px">
  {#each Object.entries(SERVICES) as [k, s]}
    <div class="card">
      <b>{s.label}</b>
      <p style="margin:6px 0"><b>Build:</b> {s.demo}</p>
      <p style="margin:6px 0"><b>Wow moment:</b> {s.wow}</p>
      <p class="note" style="margin:6px 0">Used for: {usedFor(k)}</p>
      <label class="f">Demo link
        <input type="text" value={data.settings.demos[k] ?? ''} placeholder={`https://YOUR-DEMO-LINK.com/${k}`} onchange={(e) => saveDemo(k, e.currentTarget.value)} />
      </label>
    </div>
  {/each}
</div>

{#if saved}<div class="toast" role="status">{saved}</div>{/if}
