<script>
  import { enhance } from '$app/forms';
  let { form } = $props();
</script>

<svelte:head><title>Sign in · Outreach Desk</title></svelte:head>

<div class="login panel">
  <h1>Outreach Desk</h1>
  <p class="sub">Enter your password to continue.</p>
  <form method="POST" use:enhance>
    <label class="f">Password<input type="password" name="password" autocomplete="current-password" required /></label>
    {#if form?.error}<p class="warn">{form.error}</p>{/if}
    <button class="btn ok" type="submit" style="margin-top:12px">Sign in</button>
  </form>
</div>
