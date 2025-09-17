<script lang="ts">
  import { onMount } from 'svelte';
  let loading = true;
  let workflows: any[] = [];
  onMount(async () => {
    try {
      const res = await fetch('/api/iam-automation?type=workflows');
      if (res.ok) workflows = await res.json();
    } finally {
      loading = false;
    }
  });
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
  <section class="container mx-auto px-6 py-10">
    <h1 class="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Onboarding</h1>
    <p class="text-slate-400 mb-6">Automate joiner/mover/leaver workflows across SaaS and cloud.</p>

    {#if loading}
      <div class="glass-effect border border-slate-700/60 rounded-xl p-4 text-slate-300">Loading workflows...</div>
    {:else if workflows.length === 0}
      <div class="glass-effect border border-slate-700/60 rounded-xl p-4 text-slate-300">No workflows yet. Trigger a demo from the dashboard.</div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each workflows as wf}
          <div class="glass-effect border border-slate-700/60 rounded-xl p-4 space-y-3">
            <div class="flex justify-between items-start gap-3">
              <div>
                <div class="text-slate-100 font-medium uppercase tracking-wide text-xs">{wf.type}</div>
                <div class="text-slate-100 text-lg">{wf.persona}</div>
                <div class="text-slate-400 text-xs">Submitted {new Date(wf.submittedAt).toLocaleString()}</div>
              </div>
              <span class={`text-xs px-2 py-1 rounded-full ${wf.status === 'completed' ? 'bg-emerald-500/20 text-emerald-200' : wf.status === 'provisioning' ? 'bg-blue-500/20 text-blue-200' : wf.status === 'pending' ? 'bg-amber-500/20 text-amber-200' : 'bg-rose-500/20 text-rose-200'}`}>
                {wf.status}
              </span>
            </div>

            {#if wf.automationSummary}
              <p class="text-sm text-slate-300">{wf.automationSummary}</p>
            {/if}

            <div class="space-y-2 text-xs text-slate-300">
              {#each wf.steps || [] as step}
                <div class="border border-slate-700/60 rounded-lg px-3 py-2 bg-slate-900/40">
                  <div class="flex justify-between items-center gap-2">
                    <span class="uppercase tracking-wide text-slate-200">{step.system}</span>
                    <span class={`px-2 py-1 rounded-full ${step.state === 'completed' ? 'bg-emerald-500/20 text-emerald-200' : step.state === 'provisioning' ? 'bg-blue-500/20 text-blue-200' : step.state === 'manual_required' ? 'bg-amber-500/20 text-amber-200' : step.state === 'error' ? 'bg-rose-500/20 text-rose-200' : 'bg-slate-700/40 text-slate-300'}`}>
                      {step.state}
                    </span>
                  </div>
                  <div class="mt-1 flex justify-between text-[0.7rem] uppercase tracking-wide text-slate-400">
                    <span>{step.automation === 'automated' ? 'Automated' : 'Manual step'}</span>
                  </div>
                  {#if step.notes}
                    <p class="mt-1 text-[0.7rem] text-slate-400 leading-relaxed">{step.notes}</p>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </section>
</div>
