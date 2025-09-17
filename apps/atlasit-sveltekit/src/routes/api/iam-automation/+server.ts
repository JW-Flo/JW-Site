import { json, type RequestHandler } from '@sveltejs/kit';
import {
  getIamAutomationSection,
  getIamAutomationAnalytics,
  recordLifecycleEvent,
  resetIamAutomationState,
} from '$lib/demo/iamAutomation';

export const GET: RequestHandler = ({ url }) => {
  try {
    const type = url.searchParams.get('type');
    const payload = getIamAutomationSection(type);
    return json(payload, {
      headers: {
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error resolving IAM automation data:', error);
    return json({ error: 'Failed to resolve IAM automation data' }, { status: 400 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body?.action;

    if (action === 'reset') {
      resetIamAutomationState();

      const events = [
        recordLifecycleEvent({
          persona: 'Maya Patel',
          type: 'joiner',
          summary: 'Paycom profile attributes synced to Okta; automated provisioning restarted.',
          automated: true,
          surfacedIn: ['dashboard', 'onboarding', 'orchestrator'],
        }),
        recordLifecycleEvent({
          persona: 'Andre Lowe',
          type: 'mover',
          summary: 'Paycom department change triggered Okta mover workflow and Salesforce updates.',
          automated: true,
          surfacedIn: ['dashboard', 'onboarding'],
        }),
        recordLifecycleEvent({
          persona: 'Paige Dorsey',
          type: 'leaver',
          summary: 'Paycom exit event requires manual payroll confirmation; Okta staged deactivation set.',
          automated: false,
          surfacedIn: ['dashboard', 'onboarding', 'marketplace'],
        }),
      ];

      return json({ ok: true, events, analytics: getIamAutomationAnalytics() });
    }

    if (action === 'record-lifecycle') {
      const event = recordLifecycleEvent({
        persona: body?.persona,
        type: body?.type,
        summary: body?.summary,
        automated: body?.automated,
        surfacedIn: body?.surfacedIn,
      });
      return json({ ok: true, event });
    }

    return json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating IAM automation data:', error);
    return json({ error: 'Failed to update IAM automation data' }, { status: 500 });
  }
};
