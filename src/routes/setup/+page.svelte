<script>
  import { invalidateAll } from '$app/navigation';
  import { saveSettings } from '$lib/saveSettings.js';
  import { CHECKS, TERMS } from '$lib/shared/catalog.js';

  let { data } = $props();
  let copied = $state('');

  const all = CHECKS.flatMap((g) => g[1]);
  const done = $derived(all.filter((i) => data.settings.checks[i[0]]).length);

  async function toggle(key, checked) {
    const checks = { ...data.settings.checks, [key]: checked };
    try { await saveSettings({ checks }); } catch (e) { copied = 'Not saved: ' + e.message; setTimeout(() => (copied = ''), 3000); }
    await invalidateAll();
  }

  async function copyTerms() {
    try { await navigator.clipboard.writeText(TERMS); copied = 'Terms copied'; } catch { copied = 'Select the text and copy it'; }
    setTimeout(() => (copied = ''), 2000);
  }
</script>

<svelte:head><title>Setup checklist · Outreach Desk</title></svelte:head>

<div class="panel">
  <h2>Setup checklist</h2>
  <p class="sub">{done} of {all.length} done. The first group matters most, because strangers decide whether to trust you in about ten seconds.</p>

  {#each CHECKS as [group, items]}
    <h3>{group}</h3>
    {#each items as [key, title, desc]}
      <label class="chk">
        <input type="checkbox" checked={!!data.settings.checks[key]} onchange={(e) => toggle(key, e.currentTarget.checked)} />
        <span><b>{title}</b><br /><span class="note">{desc}</span></span>
      </label>
    {/each}
  {/each}

  <h3>Terms to send when a client says yes</h3>
  <div class="why" style="white-space:pre-wrap">{TERMS}</div>
  <div class="actions" style="position:static;border:0"><button class="btn ghost" onclick={copyTerms}>Copy terms</button></div>
  <p class="note">This is a plain-language template, not legal advice. Have it checked once if the project value is large.</p>
</div>

{#if copied}<div class="toast" role="status">{copied}</div>{/if}
