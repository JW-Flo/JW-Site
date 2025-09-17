import { afterEach, describe, expect, it } from 'vitest';
import {
  getIamAutomationSection,
  resetIamAutomationState,
  recordLifecycleEvent,
} from '../src/lib/demo/iamAutomation';

describe('iamAutomation demo data', () => {
  afterEach(() => {
    resetIamAutomationState();
  });

  it('exposes directory users with automation flags', () => {
    const users = getIamAutomationSection('users');
    expect(Array.isArray(users)).toBe(true);
    const paycomUser = (users as any[]).find((u) => u.systems.includes('Paycom HR'));
    expect(paycomUser).toBeDefined();
    expect(paycomUser.automationFlags.scimEnabled).toBe(false);
    expect(paycomUser.automationFlags.provisioningPolicy).toContain('Manual');
  });

  it('surfaces paycom manual steps inside workflow metadata', () => {
    const workflows = getIamAutomationSection('workflows') as any[];
    const joiner = workflows.find((wf) => wf.type === 'joiner');
    expect(joiner).toBeDefined();
    const paycomStep = joiner.steps.find((step: any) => step.system === 'Paycom HR');
    expect(paycomStep).toBeDefined();
    expect(paycomStep.state).toBe('manual_required');
    expect(paycomStep.notes).toContain('XaaS');
  });

  it('records lifecycle events with automation context', () => {
    const event = recordLifecycleEvent({
      persona: 'Test User',
      type: 'joiner',
      summary: 'Synthetic event for testing',
      automated: false,
    });

    const lifecycle = getIamAutomationSection('lifecycle') as any[];
    expect(lifecycle[0].id).toBe(event.id);
    expect(lifecycle[0].automated).toBe(false);
  });

  it('provides analytics with manual vs automated step counts', () => {
    const analytics = getIamAutomationSection('analytics') as any;
    expect(analytics.automatedSteps).toBeGreaterThan(analytics.manualSteps);
    const paycom = analytics.manualSystems.find((entry: any) => entry.system === 'Paycom HR');
    expect(paycom).toBeDefined();
    expect(analytics.paycomManualSteps).toBe(paycom.count);
  });

  it('rejects lifecycle events missing required fields', () => {
    expect(() => recordLifecycleEvent({ summary: 'missing persona' } as any)).toThrow(
      'Lifecycle events require persona, summary, and type',
    );
  });
});
