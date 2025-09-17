<script lang="ts">
  import { onMount } from 'svelte';
  let connections: any[] = [];
  onMount(async () => {
    const res = await fetch('/api/iam-automation?type=integrations');
    if (res.ok) connections = await res.json();
  });
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
  <section class="container mx-auto px-6 py-10">
    <h1 class="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">API Manager</h1>
    <p class="text-slate-400 mb-6">Connect and manage external APIs.</p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="glass-effect border border-slate-700/50 rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-2">Connections</h2>
        {#if connections.length === 0}
          <p class="text-slate-300">No connections found.</p>
        {:else}
          <ul class="space-y-3 text-sm">
            {#each connections as c}
              <li class="border border-slate-700/50 rounded-lg p-3 bg-slate-900/40 space-y-2">
                <div class="flex justify-between items-start gap-2">
                  <span class="text-slate-200 font-medium">{c.name}</span>
                  <span class={`text-[0.65rem] uppercase tracking-wide px-2 py-1 rounded-full ${c.automation?.level === 'full' ? 'bg-emerald-500/20 text-emerald-200' : c.automation?.level === 'partial' ? 'bg-amber-500/20 text-amber-200' : 'bg-rose-500/20 text-rose-200'}`}>
                    {c.automation?.level ?? 'manual'}
                  </span>
                </div>
                <p class="text-xs text-slate-300">{c.description}</p>
                <div class="grid grid-cols-2 gap-2 text-[0.7rem] text-slate-400">
                  <div>Mechanism: {c.mechanism}</div>
                  <div>Okta group: {c.oktaGroup}</div>
                  <div>SCIM: {c.capabilities?.supportsScim ? 'Yes' : 'Manual'}</div>
                  <div>XaaS Catalog: {c.capabilities?.supportsXaas ? 'Supported' : 'Not supported'}</div>
                </div>
                {#if c.capabilities?.notes}
                  <p class="text-[0.7rem] text-amber-200 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-2">{c.capabilities.notes}</p>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
      </div>
      <div class="glass-effect border border-slate-700/50 rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-2">API Keys</h2>
        <p class="text-slate-300">Securely manage keys and secrets (edge-safe only).</p>
      </div>
    </div>
  </section>
</div>
