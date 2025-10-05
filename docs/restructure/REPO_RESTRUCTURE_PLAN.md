# Restructure Plan (JW-Site)

Goals

- Reduce root clutter; enforce src/ domain grouping.
- Standardize asset pipeline and lazy loading.

Planned Moves

- Loose images → public/assets/.
- Shared hooks → src/hooks/.
- One-off experimental pages → src/experimental/ (auto-reviewed monthly).

Process

1. Inventory + mapping.
2. PR per asset/content batch.
3. Lighthouse check after each structural move.
4. Feed entry (canonical repo) summarizing completion.
