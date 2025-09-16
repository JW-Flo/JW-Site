# AtlasIT Demo Roadmap

## Demo Data Expansion & Realism

- Add diverse personas (roles, permissions, activity patterns)
- Include edge cases (inactive users, pending onboarding, admin-only features)
- Add sample metrics for longer timeframes (weekly/monthly KPIs)

## Demo Experience Polish

- Add interactive onboarding steps (progress bar, tooltips, error states)
- Enable persona switching and preview in the dashboard
- Add “reset demo” button for quick walkthrough resets

## End-to-End Flow Validation

- Write integration tests for onboarding and dashboard using demo data
- Simulate user journeys: onboarding, dashboard review, persona switching
- Validate error handling and edge cases (missing data, invalid persona)

## Deployment & Maintenance Automation

- Add scripts to automate demo data refresh, KV clearing, and rebuilds
- Document how to deploy and update demo data for future demos

## UI/UX Enhancements

- Polish dashboard widgets (loading states, empty states, responsive layout)
- Add helpful messages and onboarding tips for demo users

## Security & Compliance

- Ensure demo endpoints are read-only and cannot leak or modify real data
- Add banners or labels to indicate “Demo Mode” throughout the UI
