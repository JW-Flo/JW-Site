<script lang="ts">
  import { goto } from '$app/navigation';

  let email = 'admin@atlasit.pro';
  let password = 'password';
  let error: string | null = null;

  async function submit(e: Event) {
    e.preventDefault();
    error = null;
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (res.ok) {
      // Cookies are set by server; navigate to dashboard
      goto('/dashboard');
    } else {
      const data = await res.json().catch(() => ({}));
      error = data.error || 'Login failed';
    }
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 flex items-center justify-center">
  <form class="glass-effect border border-slate-700/60 rounded-lg p-6 w-full max-w-sm" on:submit|preventDefault={submit}>
    <h1 class="text-xl font-bold mb-4">Login</h1>
    {#if error}<div class="mb-3 text-red-400 text-sm">{error}</div>{/if}
    <label class="block text-sm mb-1" for="email">Email</label>
    <input id="email" class="w-full mb-3 px-3 py-2 rounded bg-slate-900/70 border border-slate-700" bind:value={email} type="email" />
    <label class="block text-sm mb-1" for="password">Password</label>
    <input id="password" class="w-full mb-4 px-3 py-2 rounded bg-slate-900/70 border border-slate-700" bind:value={password} type="password" />
    <button class="w-full px-4 py-2 rounded bg-blue-600 hover:bg-blue-700">Sign in</button>
  </form>
</div>
