<script lang="ts">
  import { onMount } from 'svelte';
  let runs: any[] = [];
  let analytics: any = null;
  onMount(async () => {
    const [runsRes, analyticsRes] = await Promise.all([
      fetch('/api/iam-automation?type=workflows'),
      fetch('/api/iam-automation?type=analytics'),
    ]);
    if (runsRes.ok) runs = await runsRes.json();
    analytics = analyticsRes.ok ? await analyticsRes.json() : null;
  });
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
  <section class="container mx-auto px-6 py-10">
    <h1 class="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Orchestrator</h1>
    <p class="text-slate-400 mb-6">Design and run multi-system workflows with guardrails.</p>
    <div class="glass-effect border border-slate-700/50 rounded-xl p-6">
      <p class="text-slate-300">Visual DAGs and execution logs will live here.</p>
    </div>

    {#if analytics}
      <div class="glass-effect border border-cyan-500/30 rounded-xl p-6 bg-cyan-500/5 mt-6">
        <h2 class="text-lg font-semibold text-cyan-100 mb-2">Run Insights</h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-cyan-100/80">
          <div>
            <p class="text-xs uppercase tracking-wide text-cyan-200/80">Automated steps</p>
            <p class="text-base font-semibold text-cyan-100">{analytics.automatedSteps}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wide text-cyan-200/80">Manual steps</p>
            <p class="text-base font-semibold text-cyan-100">{analytics.manualSteps}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wide text-cyan-200/80">Paycom handoffs</p>
            <p class="text-base font-semibold text-cyan-100">{analytics.paycomManualSteps}</p>
          </div>
        </div>
        {#if analytics.manualSystems?.length}
          <p class="mt-3 text-xs text-cyan-100/70">Manual systems: {analytics.manualSystems.map((entry: any) => `${entry.system} (${entry.count})`).join(', ')}</p>
        {/if}
      </div>
    {/if}

    <h2 class="text-xl font-semibold mt-8 mb-3 text-slate-100">Recent Runs</h2>
    {#if runs.length === 0}
      <div class="text-slate-400">No recent runs.</div>
    {:else}
      <ul class="space-y-4 text-sm">
        {#each runs as r}
          <li class="glass-effect border border-slate-700/60 rounded-lg p-4 space-y-2">
            <div class="flex justify-between items-start gap-3">
              <div>
                <div class="text-xs uppercase tracking-wide text-slate-400">{r.type}</div>
                <div class="text-slate-100 font-medium">{r.persona}</div>
                <div class="text-slate-400 text-xs">Submitted {new Date(r.submittedAt).toLocaleString()}</div>
              </div>
              <span class={`text-xs px-2 py-1 rounded-full ${r.status === 'completed' ? 'bg-emerald-500/20 text-emerald-200' : r.status === 'provisioning' ? 'bg-blue-500/20 text-blue-200' : r.status === 'pending' ? 'bg-amber-500/20 text-amber-200' : 'bg-rose-500/20 text-rose-200'}`}>
                {r.status}
              </span>
            </div>
            {#if r.automationSummary}
              <p class="text-slate-300">{r.automationSummary}</p>
            {/if}
            <div class="grid grid-cols-1 gap-2 text-xs text-slate-400">
              {#each r.steps || [] as step}
                <div class="flex items-start justify-between gap-2 border border-slate-700/60 rounded-lg px-3 py-2 bg-slate-900/40">
                  <div>
                    <div class="text-slate-200 uppercase tracking-wide">{step.system}</div>
                    {#if step.notes}
                      <p class="mt-1 leading-relaxed text-[0.7rem]">{step.notes}</p>
                    {/if}
                  </div>
                  <div class="text-right space-y-1">
                    <span class={`block px-2 py-1 rounded-full ${step.state === 'completed' ? 'bg-emerald-500/20 text-emerald-200' : step.state === 'provisioning' ? 'bg-blue-500/20 text-blue-200' : step.state === 'manual_required' ? 'bg-amber-500/20 text-amber-200' : step.state === 'error' ? 'bg-rose-500/20 text-rose-200' : 'bg-slate-700/30 text-slate-200'}`}>
                      {step.state}
                    </span>
                    <span class="block text-[0.65rem] uppercase tracking-wide text-slate-400">{step.automation === 'automated' ? 'Automated' : 'Manual'}</span>
                  </div>
                </div>
              {/each}
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</div>
