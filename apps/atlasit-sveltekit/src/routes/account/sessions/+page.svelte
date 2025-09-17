<script lang="ts">
  import { invalidate } from '$app/navigation';
  import { formatTimestamp, revokeAllSessions, revokeSession } from './helpers';
  import type { PageData } from './$types';

  export let data: PageData;

  type Session = {
    id: string;
    user_agent?: string | null;
    ip?: string | null;
    created_at?: string | null;
    expires_at?: string | null;
    revoked_at?: string | null;
  };

  $: sessions = (data.sessions ?? []) as Session[];

  let busySession: string | null = null;
  let busyAll = false;
  let message: { type: 'success' | 'error'; text: string } | null = null;

  const revoke = async (sessionId: string) => {
    message = null;
    busySession = sessionId;
    try {
      const result = await revokeSession(sessionId, fetch);
      message = { type: result.success ? 'success' : 'error', text: result.message };
      if (!result.success) {
        return;
      }
      await invalidate('page');
    } finally {
      busySession = null;
    }
  };

  const revokeAll = async () => {
    message = null;
    busyAll = true;
    try {
      const result = await revokeAllSessions(fetch);
      message = { type: result.success ? 'success' : 'error', text: result.message };
      if (!result.success) {
        return;
      }
      await invalidate('page');
    } finally {
      busyAll = false;
    }
  };
</script>

<div class="min-h-screen bg-slate-950 text-slate-100">
  <section class="container mx-auto px-6 py-12">
    <header class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-3xl font-semibold">Account Sessions</h1>
        <p class="text-sm text-slate-400">Review active sessions and revoke devices that should no longer have access.</p>
      </div>
      <button
        class="rounded-lg border border-rose-500/70 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        on:click={revokeAll}
        disabled={busyAll}
        type="button"
      >
        {busyAll ? 'Revoking…' : 'Revoke all other sessions'}
      </button>
    </header>

    {#if message}
      <div class={`mb-6 rounded-lg border px-4 py-3 text-sm ${message.type === 'success' ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-100' : 'border-rose-500/50 bg-rose-500/10 text-rose-100'}`}>
        {message.text}
      </div>
    {/if}

    {#if sessions.length === 0}
      <div class="rounded-lg border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-400">
        No active sessions found.
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-800 text-left text-sm">
          <thead class="bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th class="px-4 py-3">Session ID</th>
              <th class="px-4 py-3">Created</th>
              <th class="px-4 py-3">Expires</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3">IP</th>
              <th class="px-4 py-3">User agent</th>
              <th class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800 bg-slate-900/40 text-slate-200">
            {#each sessions as session (session.id)}
              <tr>
                <td class="px-4 py-3 font-mono text-xs">{session.id}</td>
                <td class="px-4 py-3">{formatTimestamp(session.created_at)}</td>
                <td class="px-4 py-3">{formatTimestamp(session.expires_at)}</td>
                <td class="px-4 py-3">
                  {#if session.revoked_at}
                    <span class="rounded-full bg-rose-500/10 px-2 py-1 text-xs text-rose-200">Revoked</span>
                  {:else}
                    <span class="rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200">Active</span>
                  {/if}
                </td>
                <td class="px-4 py-3 text-xs text-slate-400">{session.ip ?? '—'}</td>
                <td class="px-4 py-3 text-xs text-slate-400">{session.user_agent ?? '—'}</td>
                <td class="px-4 py-3 text-right">
                  <button
                    class="rounded-md border border-rose-400/70 px-3 py-1 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    type="button"
                    disabled={!!session.revoked_at || busySession === session.id}
                    on:click={() => revoke(session.id)}
                  >
                    {busySession === session.id ? 'Revoking…' : session.revoked_at ? 'Revoked' : 'Revoke'}
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </section>
</div>
