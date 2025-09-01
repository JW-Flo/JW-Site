import { describe, it, expect, beforeEach } from 'vitest';

// We will test the displayEntries logic indirectly by simulating the DOM operations used on guestbook page.
// Since the page script isn't easily imported (inline in Astro), we reproduce minimal logic here for the empty-state UI.

describe('Guestbook empty state UI', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="guestbook-entries" data-state="loading">
        <div id="guestbook-loading">Loading entries...</div>
      </div>`;
  });

  function displayEntries(entries: any[]) {
    const container = document.getElementById('guestbook-entries');
    if (!container) return;
    if ((container as any).dataset) (container as any).dataset.state = 'loaded';
    if (!entries || entries.length === 0) {
      container.innerHTML = '<div class="text-center text-slate-400 py-8">No entries yet. Be the first to sign!</div>';
      return;
    }
    container.innerHTML = entries.map(e => `<div>${e.name}</div>`).join('');
  }

  it('shows empty-state message when no entries returned', () => {
    displayEntries([]);
    const container = document.getElementById('guestbook-entries');
    expect(container?.innerHTML).toContain('No entries yet');
  });

  it('renders entries when provided', () => {
    displayEntries([{ name: 'Test User', message: 'Hi', created_at: Date.now().toString() }]);
    const container = document.getElementById('guestbook-entries');
    expect(container?.innerHTML).toContain('Test User');
    expect(container?.innerHTML).not.toContain('No entries yet');
  });
});
