<script lang="ts">
  import { onMount } from 'svelte';
  const featured = [
    {
      id: 'google-workspace',
      name: 'Google Workspace',
      description: 'Sync users and apply Atlas policies across your Workspace domain.',
      href: '/api/oauth/google',
      cta: 'Connect with Google',
    },
    {
      id: 'microsoft-entra',
      name: 'Microsoft 365 / Entra ID',
      description: 'Provision and govern Microsoft tenants with Entra application access.',
      href: '/api/oauth/entra',
      cta: 'Connect with Microsoft',
    },
  ];

  let items: any[] = [];
  let loading = true;
  onMount(async () => {
    try {
      const res = await fetch('/api/iam-automation?type=integrations');
      if (res.ok) items = await res.json();
    } finally { loading = false; }
  });
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
  <section class="container mx-auto px-6 py-10">
    <h1 class="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Marketplace</h1>
    <p class="text-slate-400 mb-6">Discover integrations, templates, and extensions.</p>
    {#if loading}
      <div class="text-slate-300">Loading...</div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each featured as integration}
          <article class="glass-effect border border-slate-700/60 rounded-xl p-6 flex flex-col justify-between" aria-labelledby={`integration-${integration.id}`}>
            <div>
              <h2 id={`integration-${integration.id}`} class="text-xl font-semibold mb-2 text-slate-100">{integration.name}</h2>
              <p class="text-slate-300 leading-relaxed">{integration.description}</p>
            </div>
            <a
              class="mt-6 inline-flex items-center justify-center rounded-lg border border-blue-500/70 bg-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
              href={integration.href}
              rel="external"
            >
              {integration.cta}
            </a>
          </article>
        {/each}

        {#each items as it}
          <article class="glass-effect border border-slate-700/60 rounded-xl p-6 space-y-3" aria-labelledby={`integration-${it.id ?? it.slug ?? it.name}`}>
            <header class="flex items-start justify-between gap-3">
              <div>
                <h2 id={`integration-${it.id ?? it.slug ?? it.name}`} class="text-xl font-semibold text-slate-100">{it.name}</h2>
                <p class="text-slate-300 mt-1 leading-relaxed">{it.description}</p>
              </div>
              {#if it.automation?.level}
                <span class={`text-[0.65rem] uppercase tracking-wide px-2 py-1 rounded-full ${it.automation.level === 'full' ? 'bg-emerald-500/20 text-emerald-200' : it.automation.level === 'partial' ? 'bg-amber-500/20 text-amber-200' : 'bg-rose-500/20 text-rose-200'}`}>
                  {it.automation.level} automation
                </span>
              {/if}
            </header>

            {#if it.automation?.summary}
              <p class="text-sm text-slate-300">{it.automation.summary}</p>
            {/if}

            {#if Array.isArray(it.automation?.highlights) && it.automation.highlights.length > 0}
              <ul class="text-xs text-slate-400 space-y-1">
                {#each it.automation.highlights as highlight}
                  <li class="flex items-start gap-2">
                    <span class="mt-[2px] inline-block h-1.5 w-1.5 rounded-full bg-blue-400/80"></span>
                    <span>{highlight}</span>
                  </li>
                {/each}
              </ul>
            {/if}

            <div class="grid grid-cols-2 gap-3 text-xs text-slate-400">
              <div>
                <span class="font-semibold text-slate-300">Mechanism</span>
                <div>{it.mechanism}</div>
              </div>
              <div>
                <span class="font-semibold text-slate-300">Okta group</span>
                <div>{it.oktaGroup}</div>
              </div>
              <div>
                <span class="font-semibold text-slate-300">SCIM</span>
                <div>{it.capabilities?.supportsScim ? 'Yes' : 'No'}</div>
              </div>
              <div>
                <span class="font-semibold text-slate-300">XaaS Catalog</span>
                <div>{it.capabilities?.supportsXaas ? 'Yes' : 'Manual task'}</div>
              </div>
            </div>

            {#if it.capabilities?.notes}
              <p class="text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-2">
                {it.capabilities.notes}
              </p>
            {/if}

            <footer class="flex flex-wrap items-center gap-2 text-[0.65rem] uppercase tracking-wide text-slate-400">
              {#if Array.isArray(it.capabilities?.connectors)}
                {#each it.capabilities.connectors as connector}
                  <span class="rounded-full border border-slate-600 px-2 py-1">{connector}</span>
                {/each}
              {/if}
            </footer>
          </article>
        {/each}
      </div>
    {/if}
  </section>
</div>
