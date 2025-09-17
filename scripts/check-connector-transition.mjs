#!/usr/bin/env node
import 'dotenv/config';

const connectors = [
  {
    name: 'Microsoft 365',
    id: 'office365',
    env: ['OFFICE365_CLIENT_ID', 'OFFICE365_CLIENT_SECRET', 'OFFICE365_TENANT_ID', 'OFFICE365_SCOPE'],
    flagEnv: 'FF_OFFICE365_SIMULATION',
  },
  {
    name: 'Active Directory',
    id: 'activeDirectory',
    env: ['AD_USERNAME', 'AD_PASSWORD'],
    flagEnv: 'FF_ACTIVE_DIRECTORY_SIMULATION',
  },
  {
    name: 'Google Workspace',
    id: 'google-workspace',
    env: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_ADMIN_EMAIL', 'GOOGLE_SCOPE'],
    flagEnv: 'FF_GOOGLE_SIMULATION',
  },
  {
    name: 'Slack',
    id: 'slack-enterprise',
    env: ['SLACK_BOT_TOKEN', 'SLACK_SIGNING_SECRET'],
    flagEnv: 'FF_SLACK_SIMULATION',
  },
  {
    name: 'Jira Cloud',
    id: 'jira-cloud',
    env: ['JIRA_BASE_URL', 'JIRA_CLIENT_EMAIL', 'JIRA_API_TOKEN'],
    flagEnv: 'FF_JIRA_SIMULATION',
  },
  {
    name: 'Confluence Cloud',
    id: 'confluence-cloud',
    env: ['CONFLUENCE_BASE_URL', 'CONFLUENCE_CLIENT_EMAIL', 'CONFLUENCE_API_TOKEN'],
    flagEnv: 'FF_CONFLUENCE_SIMULATION',
  },
  {
    name: 'Dropbox Business',
    id: 'dropbox-business',
    env: ['DROPBOX_TEAM_TOKEN'],
    flagEnv: 'FF_DROPBOX_SIMULATION',
  },
  {
    name: 'Paycom Manual',
    id: 'paycom-manual',
    env: ['PAYCOM_API_KEY'],
    flagEnv: 'FF_PAYCOM_SIMULATION',
  },
];

const parseSimulationFlag = (value) => {
  if (typeof value === 'undefined') return undefined;
  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'on', 'enabled', 'simulate', 'simulation'].includes(normalized)) {
    return true;
  }
  if (['false', '0', 'no', 'off', 'disabled', 'prod', 'production', 'live'].includes(normalized)) {
    return false;
  }
  return undefined;
};

const missingByConnector = connectors.map((connector) => {
  const missing = connector.env.filter((key) => {
    const value = process.env[key];
    return !value || value.trim() === '' || value.trim().toLowerCase() === 'changeme';
  });

  const flagValue = connector.flagEnv ? process.env[connector.flagEnv] : undefined;
  const simulationEnabled = parseSimulationFlag(flagValue);

  return {
    ...connector,
    missing,
    flagValue,
    simulationEnabled,
  };
});
const blocking = missingByConnector.filter(
  (item) => item.simulationEnabled === false && item.missing.length > 0,
);
const allGood = blocking.length === 0;

console.log('\nConnector Transition Readiness');
console.log('===============================\n');

missingByConnector.forEach((item) => {
  const flagDisplay = item.flagEnv
    ? ` (flag ${item.flagEnv}=${item.flagValue ?? 'undefined'})`
    : '';

  if (item.missing.length === 0) {
    console.log(`✅ ${item.name} (${item.id})${flagDisplay}: ready for production credentials.`);
  } else {
    const prefix = item.simulationEnabled === false ? '⛔' : '⚠️';
    console.log(
      `${prefix} ${item.name} (${item.id})${flagDisplay}: missing ${item.missing.length} env value(s).`,
    );
    item.missing.forEach((envKey) => {
      console.log(`   - ${envKey}`);
    });
  }
  console.log('');
});

if (!allGood) {
  console.log(
    'Some connectors are configured for production while required environment variables are missing. Set the missing secrets and re-run this check.',
  );
  process.exitCode = 1;
} else {
  console.log(
    'All connectors are either in simulation mode or have the required environment variables. Proceed with the production transition steps when ready.',
  );
}
