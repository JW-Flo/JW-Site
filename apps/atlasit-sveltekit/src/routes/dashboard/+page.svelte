<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import type { PageData } from './$types';

  export let data: PageData;

  // Reactive state
  let mobileMenuOpen = false;
  let selectedPersonaId = '';
  let dashboardUsers: any[] = [];
  let loading = true;
  let metrics = {
    activeUsers: '-',
    pendingRequests: '-',
    connectedSystems: '-',
    securityScore: '-',
    activeWorkflows: '-',
    automationCoverage: '-%',
    avgProvisioningTime: '-'
  };

  // IAM data
  let iamUsers: any[] = [];
  let iamWorkflows: any[] = [];
  let iamIntegrations: any[] = [];
  let iamAnalytics: any = null;
  let iamLifecycle: any[] = [];
  let iamLoading = true;

  // Demo data
  let demoRequests: any[] = [];
  let activity: any[] = [];

  // Persona preview
  let selectedPersona: any = null;

  onMount(async () => {
    await loadDashboardData();
    await loadIamData();
  });

  async function loadDashboardData() {
    try {
      const response = await fetch('/api/demo/data');
      if (response.ok) {
        const payload = await response.json();
        const data = payload?.data || {};

        // Update metrics
        const dataMetrics = data.metrics || {};
        metrics = {
          activeUsers: dataMetrics.activeUsers ?? '-',
          pendingRequests: dataMetrics.pendingRequests ?? '-',
          connectedSystems: dataMetrics.connectedSystems ?? '-',
          securityScore: dataMetrics.securityScore != null ? `${dataMetrics.securityScore}%` : '-',
          activeWorkflows: dataMetrics.activeWorkflows ?? '-',
          automationCoverage: dataMetrics.automationCoverage != null ? `${dataMetrics.automationCoverage}%` : '-%',
          avgProvisioningTime: dataMetrics.avgProvisioningTimeMinutes != null ? `${dataMetrics.avgProvisioningTimeMinutes} min` : '-'
        };

        // Update demo data
        dashboardUsers = data.users || [];
        demoRequests = data.requests || [];
        activity = data.activity || [];

        // Load screenshot events
        try {
          const screenshotRes = await fetch('/api/screenshot-event');
          if (screenshotRes.ok) {
            const screenshotEvents = await screenshotRes.json();
            if (Array.isArray(screenshotEvents)) {
              const mapped = screenshotEvents.map((ev: any) => ({
                type: 'security',
                title: 'Screenshot Event Detected',
                description: `User ${ev.user || 'unknown'} took a screenshot on ${ev.page} (${ev.context}). Risk: ${ev.risk_level}. Details: ${ev.details}`,
                relativeTime: new Date(ev.timestamp).toLocaleString()
              }));
              activity = mapped.concat(activity);
            }
          }
        } catch (err) {
          console.warn('Unable to fetch screenshot events', err);
        }
      }
    } catch (error) {
      console.warn('Unable to load dashboard data', error);
    } finally {
      loading = false;
    }
  }

  async function loadIamData() {
    try {
      const [usersRes, workflowsRes, integrationsRes, analyticsRes, lifecycleRes] = await Promise.all([
        fetch('/api/iam-automation?type=users'),
        fetch('/api/iam-automation?type=workflows'),
        fetch('/api/iam-automation?type=integrations'),
        fetch('/api/iam-automation?type=analytics'),
        fetch('/api/iam-automation?type=lifecycle'),
      ]);

      if (usersRes.ok) iamUsers = await usersRes.json() || [];
      if (workflowsRes.ok) iamWorkflows = await workflowsRes.json() || [];
      if (integrationsRes.ok) iamIntegrations = await integrationsRes.json() || [];
      iamAnalytics = analyticsRes.ok ? await analyticsRes.json() : null;
      iamLifecycle = lifecycleRes.ok ? await lifecycleRes.json() || [] : [];
    } catch (error) {
      console.warn('Unable to load IAM data', error);
    } finally {
      iamLoading = false;
    }
  }

  function formatDateTime(isoString: string) {
    try {
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  }

  function getStatusClass(status: string) {
    switch (status) {
      case 'Active': return 'bg-green-500/20 text-green-300';
      case 'Pending Approval': return 'bg-yellow-500/20 text-yellow-300';
      case 'Provisioning': return 'bg-blue-500/20 text-blue-300';
      case 'Dormant': return 'bg-slate-500/20 text-slate-200';
      default: return 'bg-red-500/20 text-red-300';
    }
  }

  function getActivityIcon(type: string) {
    const colors = {
      security: 'text-green-400',
      automation: 'text-purple-400',
      compliance: 'text-yellow-400',
      default: 'text-blue-400'
    };
    return colors[type as keyof typeof colors] || colors.default;
  }

  function updatePersonaPreview(user: any) {
    selectedPersona = user;
  }

  function clearPersonaPreview() {
    selectedPersona = null;
    selectedPersonaId = '';
  }

  async function resetDemo() {
    if (!confirm('Reset demo data to the default personas and metrics?')) return;

    try {
      const [demoRes, iamRes] = await Promise.all([
        fetch('/api/demo/reset', { method: 'POST' }),
        fetch('/api/iam-automation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reset' })
        })
      ]);

      if (demoRes.ok && iamRes.ok) {
        await loadDashboardData();
        await loadIamData();
      } else {
        alert('Failed to reset demo data');
      }
    } catch (error) {
      alert('Reset failed: ' + error);
    }
  }

  $: selectedUser = dashboardUsers.find(u => u.id === selectedPersonaId);
  $: filteredUsers = selectedPersonaId
    ? dashboardUsers.map(u => ({ ...u, highlighted: u.id === selectedPersonaId }))
    : dashboardUsers;

  $: lifecycleRecent = iamLifecycle.slice(0, 5);
</script>

<svelte:head>
  <title>Dashboard - AtlasIT</title>
</svelte:head>

<div class="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 min-h-screen">
  <!-- Header -->
  <header class="glass-effect border-b border-slate-700/50 sticky top-0 z-50">
    <nav class="container mx-auto px-6 py-4">
      <div class="flex justify-between items-center">
        <div class="flex items-center space-x-2">
          <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-sm">AI</span>
          </div>
          <h1 class="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">AtlasIT</h1>
        </div>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center space-x-1">
          <a href="/dashboard" class="nav-link px-4 py-2 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition-all duration-200">Dashboard</a>
          <a href="/onboarding" class="nav-link px-4 py-2 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition-all duration-200">Onboarding</a>
          <a href="/marketplace" class="nav-link px-4 py-2 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition-all duration-200">Marketplace</a>
          <a href="/orchestrator" class="nav-link px-4 py-2 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition-all duration-200">Orchestrator</a>
          <a href="/api-manager" class="nav-link px-4 py-2 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition-all duration-200">API Manager</a>
          <a href="/jml-demo" class="nav-link px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">JML Demo</a>

          <!-- IT Dropdown -->
          <div class="relative group">
            <button class="nav-link px-4 py-2 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition-all duration-200 flex items-center">
              IT <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            <div class="absolute top-full left-0 mt-1 w-48 bg-slate-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-slate-700">
              <a href="/it/policies" class="block px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-t-lg">Policies</a>
              <a href="/it/backup" class="block px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50">Backup & Recovery</a>
            </div>
          </div>

          <!-- Security Dropdown -->
          <div class="relative group">
            <button class="nav-link px-4 py-2 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition-all duration-200 flex items-center">
              Security <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            <div class="absolute top-full left-0 mt-1 w-48 bg-slate-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-slate-700">
              <a href="/security" class="block px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-t-lg">Security Center</a>
              <a href="/enhanced-security-scanner" class="block px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-b-lg">Scanner</a>
            </div>
          </div>

          <!-- Governance Dropdown -->
          <div class="relative group">
            <button class="nav-link px-4 py-2 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition-all duration-200 flex items-center">
              Governance <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            <div class="absolute top-full left-0 mt-1 w-48 bg-slate-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-slate-700">
              <a href="/governance/compliance" class="block px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg">Compliance</a>
            </div>
          </div>

          <div class="w-px h-6 bg-slate-600 mx-2"></div>
          <a href="/login" class="nav-link px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200">Login</a>
          <a href="/register" class="nav-link px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-all duration-200">Register</a>
        </div>

        <!-- Mobile Menu Button -->
        <button
          class="md:hidden text-slate-300 hover:text-white p-2"
          on:click={() => mobileMenuOpen = !mobileMenuOpen}
          aria-label="Toggle mobile menu"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </div>

      <!-- Mobile Menu -->
      {#if mobileMenuOpen}
        <div class="md:hidden mt-4 pb-4 space-y-2 border-t border-slate-700 pt-4">
          <a href="/dashboard" class="block px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg">Dashboard</a>
          <a href="/onboarding" class="block px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg">Onboarding</a>
          <a href="/marketplace" class="block px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg">Marketplace</a>
          <a href="/orchestrator" class="block px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg">Orchestrator</a>
          <a href="/api-manager" class="block px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg">API Manager</a>
          <a href="/it/policies" class="block px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg">IT Policies</a>
          <a href="/it/backup" class="block px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg">Backup & Recovery</a>
          <a href="/security" class="block px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg">Security Center</a>
          <a href="/governance/compliance" class="block px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg">Compliance</a>
          <div class="pt-2 border-t border-slate-700 mt-4">
            <a href="/login" class="block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-center mb-2">Login</a>
            <a href="/register" class="block px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-center">Register</a>
          </div>
        </div>
      {/if}
    </nav>
  </header>

  <div class="demo-banner">Demo Mode · Sample data resets regularly and is not production</div>

  <!-- Main Content -->
  <main class="container mx-auto px-6 py-8">
    {#if loading}
      <div class="glass-effect border border-slate-700/60 text-slate-200 text-sm rounded-lg px-4 py-3 mb-6 flex items-center gap-3">
        <svg class="w-4 h-4 animate-spin text-blue-300" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
        <span>Loading demo metrics...</span>
      </div>
    {/if}

    <!-- Welcome Section -->
    <div class="mb-8">
      <h1 class="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Welcome to AtlasIT</h1>
      <p class="text-slate-400 text-lg">Your enterprise IT automation platform for seamless business operations</p>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
      <div class="glass-effect p-6 rounded-xl border border-slate-700/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-slate-400 text-sm">Active Users</p>
            <p class="text-2xl font-bold text-blue-400">{metrics.activeUsers}</p>
          </div>
          <div class="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        </div>
      </div>

      <div class="glass-effect p-6 rounded-xl border border-slate-700/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-slate-400 text-sm">Pending Access Requests</p>
            <p class="text-2xl font-bold text-amber-400">{metrics.pendingRequests}</p>
          </div>
          <div class="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path>
            </svg>
          </div>
        </div>
      </div>

      <div class="glass-effect p-6 rounded-xl border border-slate-700/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-slate-400 text-sm">Connected Systems</p>
            <p class="text-2xl font-bold text-green-400">{metrics.connectedSystems}</p>
          </div>
          <div class="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path>
            </svg>
          </div>
        </div>
      </div>

      <div class="glass-effect p-6 rounded-xl border border-slate-700/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-slate-400 text-sm">Security Score</p>
            <p class="text-2xl font-bold text-yellow-400">{metrics.securityScore}</p>
          </div>
          <div class="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Additional Stats Row -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
      <div class="glass-effect p-6 rounded-xl border border-slate-700/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-slate-400 text-sm">Active Workflows</p>
            <p class="text-2xl font-bold text-purple-400">{metrics.activeWorkflows}</p>
          </div>
          <div class="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
        </div>
      </div>

      <div class="glass-effect p-6 rounded-xl border border-slate-700/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-slate-400 text-sm">Automation Coverage</p>
            <p class="text-2xl font-bold text-cyan-400">{metrics.automationCoverage}</p>
            <p class="text-slate-400 text-xs mt-1">Avg provisioning time: {metrics.avgProvisioningTime}</p>
          </div>
          <div class="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- IAM Automation Snapshot -->
    <section class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {#if iamAnalytics}
        <div class="glass-effect p-6 rounded-xl border border-cyan-500/30 bg-cyan-500/5 lg:col-span-3">
          <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 class="text-lg font-semibold text-cyan-200">Automation Insights</h3>
              <p class="text-sm text-cyan-100/80">{iamAnalytics.automatedSteps} automated steps • {iamAnalytics.manualSteps} manual handoffs</p>
            </div>
            <div class="grid grid-cols-2 gap-4 text-sm text-cyan-100/80">
              <div>
                <p class="text-xs uppercase tracking-wide text-cyan-200/80">Joiner workflows</p>
                <p class="text-base font-semibold text-cyan-100">{iamAnalytics.joinerCount}</p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-wide text-cyan-200/80">Mover workflows</p>
                <p class="text-base font-semibold text-cyan-100">{iamAnalytics.moverCount}</p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-wide text-cyan-200/80">Leaver workflows</p>
                <p class="text-base font-semibold text-cyan-100">{iamAnalytics.leaverCount}</p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-wide text-cyan-200/80">Paycom manual steps</p>
                <p class="text-base font-semibold text-cyan-100">{iamAnalytics.paycomManualSteps}</p>
              </div>
            </div>
          </div>
          {#if iamAnalytics.manualSystems?.length}
            <div class="mt-4 text-xs text-cyan-100/70">
              <span class="font-semibold text-cyan-100">Manual systems:</span>
              {iamAnalytics.manualSystems.map((entry: any) => `${entry.system} (${entry.count})`).join(', ')}
            </div>
          {/if}
        </div>
      {/if}
      <!-- Directory Users -->
      <div class="glass-effect p-6 rounded-xl border border-slate-700/50">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-lg font-semibold text-slate-100">Directory Users</h3>
            <p class="text-slate-400 text-xs">Source of truth: Okta demo directory</p>
          </div>
          <span class="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-200">{iamUsers.length} users</span>
        </div>

        {#if iamLoading}
          <div class="text-sm text-slate-400">Loading directory users...</div>
        {:else if iamUsers.length === 0}
          <div class="text-sm text-slate-400">No users found.</div>
        {:else}
          <div class="space-y-3">
            {#each iamUsers as user}
              <article class="border border-slate-700/60 rounded-lg p-3 bg-slate-900/40">
                <header class="flex items-start justify-between gap-3">
                  <div>
                    <p class="font-medium text-slate-200">{user.name}</p>
                    <p class="text-slate-400 text-xs">{user.email}</p>
                    <p class="text-slate-400 text-xs mt-1">{user.title} • {user.department}</p>
                  </div>
                  <span class={`text-xs px-2 py-1 rounded-full ${user.lifecycleState === 'Joiner' ? 'bg-blue-500/20 text-blue-200' : user.lifecycleState === 'Mover' ? 'bg-purple-500/20 text-purple-200' : user.lifecycleState === 'Leaver Pending' ? 'bg-rose-500/20 text-rose-200' : 'bg-emerald-500/20 text-emerald-200'}`}>
                    {user.lifecycleState}
                  </span>
                </header>
                <dl class="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-400">
                  <div>
                    <dt class="font-semibold text-slate-300">Manager</dt>
                    <dd>{user.manager}</dd>
                  </div>
                  <div>
                    <dt class="font-semibold text-slate-300">Systems</dt>
                    <dd>{(user.systems || []).join(', ')}</dd>
                  </div>
                  <div>
                    <dt class="font-semibold text-slate-300">Source</dt>
                    <dd>{user.automationFlags?.sourceOfTruth}</dd>
                  </div>
                  <div>
                    <dt class="font-semibold text-slate-300">SCIM</dt>
                    <dd>{user.automationFlags?.scimEnabled ? 'Enabled' : 'Manual'}</dd>
                  </div>
                  <div class="col-span-2">
                    <dt class="font-semibold text-slate-300">Provisioning policy</dt>
                    <dd>{user.automationFlags?.provisioningPolicy}</dd>
                  </div>
                </dl>
                {#if Array.isArray(user.recentChanges) && user.recentChanges.length > 0}
                  <ul class="mt-3 space-y-1 text-xs text-slate-400">
                    {#each user.recentChanges as change}
                      <li class="flex items-start gap-2">
                        <span class="mt-[3px] inline-block h-1.5 w-1.5 rounded-full bg-blue-400/80"></span>
                        <span>{change}</span>
                      </li>
                    {/each}
                  </ul>
                {/if}
              </article>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Active IAM Workflows -->
      <div class="glass-effect p-6 rounded-xl border border-slate-700/50">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-lg font-semibold text-slate-100">Active IAM Workflows</h3>
            <p class="text-slate-400 text-xs">Joiner/Mover flows from Okta</p>
          </div>
          <span class="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-200">{iamWorkflows.length} workflows</span>
        </div>

        {#if iamLoading}
          <div class="text-sm text-slate-400">Loading workflows...</div>
        {:else if iamWorkflows.length === 0}
          <div class="text-sm text-slate-400">No active workflows. Start a demo from onboarding.</div>
        {:else}
          <ul class="space-y-3 text-sm">
            {#each iamWorkflows as workflow}
              <li class="border border-slate-700/60 rounded-lg p-3 bg-slate-900/40">
                <div class="flex justify-between items-start mb-2">
                  <div>
                    <p class="text-slate-100 font-medium">{workflow.userId}</p>
                    <p class="text-slate-400 text-xs">Submitted {formatDateTime(workflow.submittedAt)}</p>
                  </div>
                  <span class="text-xs px-2 py-1 rounded-full {workflow.status === 'completed' ? 'bg-green-500/20 text-green-300' : workflow.status === 'failed' ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-200'}">{workflow.status}</span>
                </div>
                {#if workflow.automationSummary}
                  <p class="text-xs text-slate-300 mb-2">{workflow.automationSummary}</p>
                {/if}
                <div class="space-y-1">
                  {#each workflow.steps || [] as step}
                    <div class="flex justify-between text-xs text-slate-300">
                      <span class="uppercase tracking-wide text-slate-200">{step.system}</span>
                      <span class="px-2 py-0.5 rounded-full {step.state === 'completed' ? 'bg-green-500/20 text-green-300' : step.state === 'provisioning' ? 'bg-blue-500/20 text-blue-200' : step.state === 'error' ? 'bg-red-500/20 text-red-300' : step.state === 'manual_required' ? 'bg-amber-500/20 text-amber-200' : 'bg-slate-600/30 text-slate-300'}">{step.state}</span>
                    </div>
                    <div class="flex justify-between text-[0.65rem] uppercase tracking-wide text-slate-400">
                      <span>{step.automation === 'automated' ? 'Automated' : 'Manual handoff'}</span>
                    </div>
                    {#if step.notes}
                      <p class="text-[0.7rem] text-slate-400 mb-1">{step.notes}</p>
                    {/if}
                  {/each}
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </div>

      <!-- Connected Integrations -->
      <div class="glass-effect p-6 rounded-xl border border-slate-700/50">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-lg font-semibold text-slate-100">Connected Integrations</h3>
            <p class="text-slate-400 text-xs">Okta-driven provisioning targets</p>
          </div>
          <span class="text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-200">{iamIntegrations.length} integrations</span>
        </div>

        {#if iamLoading}
          <div class="text-sm text-slate-400">Loading integration catalog...</div>
        {:else if iamIntegrations.length === 0}
          <div class="text-sm text-slate-400">No integrations found.</div>
        {:else}
          <ul class="space-y-3 text-sm">
            {#each iamIntegrations as integration}
              <li class="border border-slate-700/60 rounded-lg p-3 bg-slate-900/40">
                <div class="flex justify-between items-start gap-3">
                  <div>
                    <p class="text-slate-100 font-medium">{integration.name}</p>
                    <p class="text-slate-400 text-xs mb-2">{integration.description}</p>
                  </div>
                  <span class={`text-[0.65rem] px-2 py-1 rounded-full uppercase tracking-wide ${integration.automation?.level === 'full' ? 'bg-emerald-500/20 text-emerald-200' : integration.automation?.level === 'partial' ? 'bg-amber-500/20 text-amber-200' : 'bg-rose-500/20 text-rose-200'}`}>
                    {integration.automation?.level ?? 'manual'}
                  </span>
                </div>
                {#if integration.automation?.summary}
                  <p class="text-xs text-slate-300 mb-2">{integration.automation.summary}</p>
                {/if}
                <p class="text-xs text-slate-400">Mechanism: {integration.mechanism}</p>
                <p class="text-xs text-slate-400">Okta group: {integration.oktaGroup}</p>
                <div class="mt-2 grid grid-cols-2 gap-2 text-[0.7rem] text-slate-400">
                  <div>SCIM: {integration.capabilities?.supportsScim ? 'Yes' : 'Manual'}</div>
                  <div>XaaS Catalog: {integration.capabilities?.supportsXaas ? 'Supported' : 'Not supported'}</div>
                </div>
                {#if integration.capabilities?.notes}
                  <p class="mt-2 text-[0.7rem] text-amber-200 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-2">{integration.capabilities.notes}</p>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
      </div>

      {#if lifecycleRecent.length > 0}
        <div class="glass-effect p-6 rounded-xl border border-slate-700/50 lg:col-span-3">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-lg font-semibold text-slate-100">Lifecycle Timeline</h3>
              <p class="text-slate-400 text-xs">Events emitted from Paycom → Okta sync</p>
            </div>
          </div>
          <ol class="space-y-3">
            {#each lifecycleRecent as event}
              <li class="border border-slate-700/60 rounded-lg p-3 bg-slate-900/40">
                <div class="flex justify-between items-start gap-3">
                  <div>
                    <p class="text-slate-100 font-medium">{event.persona}</p>
                    <p class="text-slate-400 text-xs">{new Date(event.occursAt).toLocaleString()}</p>
                  </div>
                  <span class={`text-xs px-2 py-1 rounded-full ${event.type === 'joiner' ? 'bg-blue-500/20 text-blue-200' : event.type === 'mover' ? 'bg-purple-500/20 text-purple-200' : 'bg-rose-500/20 text-rose-200'}`}>
                    {event.type}
                  </span>
                </div>
                <p class="text-xs text-slate-300 mt-2 leading-relaxed">{event.summary}</p>
                <p class="text-[0.65rem] uppercase tracking-wide text-slate-400 mt-2">{event.automated ? 'Automated sync' : 'Manual follow-up required'}</p>
              </li>
            {/each}
          </ol>
        </div>
      {/if}
    </section>

    <!-- Dashboard Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <div class="glass-effect p-6 rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
        <h2 class="text-xl font-semibold mb-3 text-slate-100">User Management</h2>
        <p class="text-slate-300 mb-4 leading-relaxed">Manage user accounts, permissions, and access controls across all connected systems.</p>
        <a href="/onboarding" class="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200 group">
          Manage Users
          <svg class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </a>
      </div>

      <div class="glass-effect p-6 rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
        <h2 class="text-xl font-semibold mb-3 text-slate-100">Workflow Orchestration</h2>
        <p class="text-slate-300 mb-4 leading-relaxed">Create and manage automated workflows for IT processes and business operations.</p>
        <a href="/workflows" class="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200 group">
          View Workflows
          <svg class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </a>
      </div>

      <div class="glass-effect p-6 rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
        <h2 class="text-xl font-semibold mb-3 text-slate-100">API Management</h2>
        <p class="text-slate-300 mb-4 leading-relaxed">Connect and manage integrations with external services and APIs.</p>
        <a href="/api-manager" class="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200 group">
          Manage APIs
          <svg class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </a>
      </div>

      <div class="glass-effect p-6 rounded-xl border border-blue-600/50 hover:border-blue-500/70 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-xl bg-gradient-to-br from-blue-600/10 to-purple-600/10">
        <h2 class="text-xl font-semibold mb-3 text-blue-400">🚀 JML Lifecycle Demo</h2>
        <p class="text-slate-300 mb-4 leading-relaxed">Experience interactive HRIS → Okta → AWS IAM automation with real-time storyline workflows.</p>
        <a href="/jml-demo" class="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200 group">
          Launch Interactive Demo
          <svg class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
          </svg>
        </a>
      </div>

      <div class="glass-effect p-6 rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
        <h2 class="text-xl font-semibold mb-3 text-slate-100">Security Center</h2>
        <p class="text-slate-300 mb-4 leading-relaxed">Monitor security threats, run scans, and manage compliance across your infrastructure.</p>
        <a href="/enhanced-security-scanner" class="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200 group">
          View Security
          <svg class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </a>
      </div>

      <div class="glass-effect p-6 rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
        <h2 class="text-xl font-semibold mb-3 text-slate-100">IT Policies</h2>
        <p class="text-slate-300 mb-4 leading-relaxed">Configure and enforce IT policies, backup schedules, and system configurations.</p>
        <a href="/it/policies" class="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200 group">
          Manage Policies
          <svg class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </a>
      </div>

      <div class="glass-effect p-6 rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
        <h2 class="text-xl font-semibold mb-3 text-slate-100">Marketplace</h2>
        <p class="text-slate-300 mb-4 leading-relaxed">Discover and install integrations, templates, and extensions for your platform.</p>
        <a href="/marketplace" class="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200 group">
          Browse Marketplace
          <svg class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </a>
      </div>
    </div>

    <!-- Reset Controls -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div class="text-xs text-slate-400">Review automation metrics or reset the demo environment for a fresh walkthrough.</div>
      <div class="flex items-center gap-3">
        <button
          on:click={resetDemo}
          class="px-3 py-2 text-xs uppercase tracking-wide rounded-lg border border-slate-600 text-slate-200 hover:bg-slate-800 transition-colors"
        >
          Reset Demo Data
        </button>
      </div>
    </div>

    <!-- Demo Data Sections -->
    <section class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- Onboarding Pipeline -->
      <div class="glass-effect p-6 rounded-xl border border-slate-700/50">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h3 class="text-xl font-semibold text-slate-100">Onboarding Pipeline</h3>
            <p class="text-slate-400 text-sm">Staged demo requests across AWS, Entra, SAP, and Jenkins.</p>
          </div>
          <div class="text-right">
            <span class="text-xs uppercase tracking-wide text-slate-500">Pending</span>
            <p class="text-2xl font-bold text-amber-300">{metrics.pendingRequests}</p>
          </div>
        </div>
        <ul class="space-y-4 text-sm">
          {#each demoRequests as request}
            <li class="p-4 bg-slate-900/60 border border-slate-700/40 rounded-lg">
              <div class="flex justify-between items-start">
                <div>
                  <p class="text-slate-200 font-medium">{request.title}</p>
                  <p class="text-slate-400 text-xs mt-1">
                    {dashboardUsers.find(u => u.id === request.userId)?.name || request.userId} • Submitted {formatDateTime(request.submittedAt)}
                  </p>
                </div>
                <span class="text-xs px-2 py-1 rounded-full {request.status === 'completed' ? 'bg-green-500/20 text-green-300' : request.status === 'in-flight' ? 'bg-blue-500/20 text-blue-200' : request.status === 'pending' ? 'bg-yellow-500/20 text-yellow-200' : 'bg-red-500/20 text-red-200'}">{request.status}</span>
              </div>
              <p class="text-slate-300 text-sm mt-3">Targets: {request.targetApps.join(', ')}</p>
              <p class="text-slate-500 text-xs mt-2">
                Approvals: {request.approvals.map((a: any) => `${a.stage}: ${a.status === 'approved' ? '✅' : a.status === 'pending' ? '🕒' : '⛔️'}`).join(' · ')}
              </p>
            </li>
          {/each}
        </ul>
        {#if demoRequests.length === 0}
          <p class="text-sm text-slate-400">No pending requests at the moment.</p>
        {/if}
      </div>

      <!-- Demo Users Table -->
      <div class="glass-effect p-6 rounded-xl border border-slate-700/50 overflow-x-auto">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h3 class="text-xl font-semibold text-slate-100">Demo Users</h3>
            <p class="text-slate-400 text-sm">Sample personas with roles, statuses, and recent activity.</p>
          </div>
          <div class="text-right">
            <span class="text-xs uppercase tracking-wide text-slate-500">Active</span>
            <p class="text-2xl font-bold text-blue-300">{metrics.activeUsers}</p>
          </div>
        </div>

        <div class="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
          <select
            bind:value={selectedPersonaId}
            class="w-full lg:w-64 px-3 py-2 bg-slate-900/70 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">Highlight a persona</option>
            {#each dashboardUsers as user}
              <option value={user.id}>{user.name} • {user.role} ({user.status})</option>
            {/each}
          </select>
          <button
            on:click={clearPersonaPreview}
            class="px-3 py-2 text-xs uppercase tracking-wide rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Clear
          </button>
        </div>

        {#if selectedUser}
          <div class="border border-slate-700/60 bg-slate-900/70 rounded-lg p-4 mb-4 text-sm text-slate-200">
            <div class="flex justify-between items-start mb-2">
              <div>
                <p class="font-semibold">{selectedUser.name} - {selectedUser.company}</p>
                <p class="text-slate-400 text-xs">{selectedUser.role} • {selectedUser.department}</p>
              </div>
              <span class="text-xs px-2 py-1 rounded-full {getStatusClass(selectedUser.status)}">{selectedUser.status}</span>
            </div>
            <dl class="grid grid-cols-2 gap-3 text-xs text-slate-300">
              <div>
                <dt class="text-slate-500">Last Active</dt>
                <dd>{formatDateTime(selectedUser.lastActive)}</dd>
              </div>
              <div>
                <dt class="text-slate-500">Risk Level</dt>
                <dd>{selectedUser.riskLevel}</dd>
              </div>
              <div class="col-span-2">
                <dt class="text-slate-500">Persona Focus</dt>
                <dd class="mt-1">{selectedUser.persona} - Managed by {selectedUser.manager} ({selectedUser.location})</dd>
              </div>
            </dl>
          </div>
        {/if}

        <table class="min-w-full text-left text-sm">
          <thead class="text-slate-400 uppercase tracking-wide text-xs">
            <tr>
              <th class="py-2">User</th>
              <th class="py-2">Role</th>
              <th class="py-2">Status</th>
              <th class="py-2">Last Active</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-700">
            {#each filteredUsers as user}
              <tr class="transition-colors duration-150 {user.id === selectedPersonaId ? 'bg-blue-500/10 border border-blue-500/30' : ''}">
                <td class="py-3">
                  <div class="font-medium text-slate-200">{user.name}</div>
                  <div class="text-slate-400 text-xs">{user.email}</div>
                </td>
                <td class="py-3 text-slate-300">{user.role}</td>
                <td class="py-3">
                  <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold {getStatusClass(user.status)}">{user.status}</span>
                </td>
                <td class="py-3 text-slate-300">{formatDateTime(user.lastActive)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>

    <!-- Recent Activity -->
    <div class="glass-effect p-6 rounded-xl border border-slate-700/50">
      <h2 class="text-2xl font-semibold mb-6 text-slate-100">Recent Activity</h2>
      <div class="space-y-4">
        {#each activity as entry}
          <div class="flex items-center space-x-4 p-4 bg-slate-800/50 rounded-lg">
            <div class="w-10 h-10 {entry.type === 'security' ? 'bg-green-500/20' : entry.type === 'automation' ? 'bg-purple-500/20' : entry.type === 'compliance' ? 'bg-yellow-500/20' : 'bg-blue-500/20'} rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 {getActivityIcon(entry.type)}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
            <div class="flex-1">
              <p class="text-slate-100 font-medium">{entry.title}</p>
              <p class="text-slate-400 text-sm">{entry.description}</p>
            </div>
            <span class="text-slate-500 text-sm">{entry.relativeTime}</span>
          </div>
        {/each}
      </div>
      {#if activity.length === 0}
        <p class="text-sm text-slate-400">No recent activity yet. Trigger onboarding actions to populate the feed.</p>
      {/if}
    </div>
  </main>

  <!-- Footer -->
  <footer class="glass-effect border-t border-slate-700/50 mt-16">
    <div class="container mx-auto px-6 py-8">
      <div class="flex flex-col md:flex-row justify-between items-center">
        <div class="flex items-center space-x-2 mb-4 md:mb-0">
          <div class="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded flex items-center justify-center">
            <span class="text-white font-bold text-xs">AI</span>
          </div>
          <span class="text-slate-400">© 2025 AtlasIT. Enterprise IT Automation Platform.</span>
        </div>
        <div class="flex space-x-6 text-sm text-slate-400">
          <span class="hover:text-slate-300 transition-colors">Privacy</span>
          <span class="hover:text-slate-300 transition-colors">Terms</span>
          <span class="hover:text-slate-300 transition-colors">Support</span>
        </div>
      </div>
    </div>
  </footer>
</div>

<style>
  .glass-effect {
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.1);
  }

  .demo-banner {
    background: linear-gradient(90deg, rgba(37,99,235,0.25), rgba(168,85,247,0.25));
    border: 1px solid rgba(59,130,246,0.35);
    border-radius: 0.75rem;
    color: #bfdbfe;
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    padding: 0.6rem 1rem;
    text-align: center;
    margin: 1.5rem auto 0;
    max-width: 60rem;
  }

  .nav-link {
    transition: all 0.2s ease;
  }

  .nav-link:hover {
    transform: translateY(-1px);
  }
</style>
