#!/usr/bin/env node

/**
 * Comprehensive Functionality Test
 * Tests all key website components and integrations
 */

import { execSync } from 'child_process';
import process from 'process';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4321';
const tests = [];

// Test utilities
function addTest(name, testFn) {
  tests.push({ name, testFn });
}

async function runTests() {
  console.log('🧪 Running Comprehensive Functionality Tests\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(`⏳ ${test.name}...`);
      await test.testFn();
      console.log(`✅ ${test.name} - PASSED\n`);
      passed++;
    } catch (error) {
      console.log(`❌ ${test.name} - FAILED`);
      console.log(`   Error: ${error.message}\n`);
      failed++;
    }
  }
  
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Website is fully functional.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
    process.exit(1);
  }
}

// Page Loading Tests
addTest('Homepage loads correctly', async () => {
  const response = await fetch(`${BASE_URL}/`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  if (!html.includes('Joe Whittle')) throw new Error('Missing main heading');
  if (!html.includes('Cybersecurity Engineer')) throw new Error('Missing subtitle');
});

addTest('Projects page loads with content', async () => {
  const response = await fetch(`${BASE_URL}/projects`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  if (!html.includes('Projects')) throw new Error('Missing projects heading');
});

addTest('Demo page loads with interactive elements', async () => {
  const response = await fetch(`${BASE_URL}/demo`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  if (!html.includes('Live Demos')) throw new Error('Missing demo heading');
});

addTest('Guestbook page loads with form', async () => {
  const response = await fetch(`${BASE_URL}/guestbook`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  if (!html.includes('guestbook-form')) throw new Error('Missing guestbook form');
});

addTest('Workflows page loads', async () => {
  const response = await fetch(`${BASE_URL}/workflows`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
});

addTest('Resume page loads', async () => {
  const response = await fetch(`${BASE_URL}/resume`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
});

// API Endpoint Tests
addTest('Guestbook stats API responds', async () => {
  const response = await fetch(`${BASE_URL}/api/guestbook/stats`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (typeof data.total !== 'number') throw new Error('Invalid response format');
});

addTest('Game score processor API responds', async () => {
  const response = await fetch(`${BASE_URL}/api/workflows/game-score-processor`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (!data.message) throw new Error('Invalid response format');
});

addTest('Geo API responds', async () => {
  const response = await fetch(`${BASE_URL}/api/geo`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (!data.ip) throw new Error('Invalid response format');
});

// Static File Tests  
addTest('GameManager.js loads', async () => {
  const response = await fetch(`${BASE_URL}/GameManager.js`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const content = await response.text();
  if (!content.includes('class GameManager')) throw new Error('Invalid GameManager file');
});

addTest('GameOverlay.js loads', async () => {
  const response = await fetch(`${BASE_URL}/GameOverlay.js`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const content = await response.text();
  if (!content.includes('class GameOverlay')) throw new Error('Invalid GameOverlay file');
});

addTest('Game files are accessible', async () => {
  const games = ['AsteroidsGame.js', 'TetrisGame.js', 'PacManGame.js', 'SpaceInvadersGame.js', 'MenuGame.js'];
  for (const game of games) {
    const response = await fetch(`${BASE_URL}/games/${game}`);
    if (!response.ok) throw new Error(`${game} not accessible: HTTP ${response.status}`);
  }
});

// CSS and Assets Tests
addTest('Main CSS loads without errors', async () => {
  const response = await fetch(`${BASE_URL}/`);
  const html = await response.text();
  if (!html.includes('global.css')) throw new Error('CSS not linked');
});

addTest('Favicon loads', async () => {
  const response = await fetch(`${BASE_URL}/favicon.svg`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
});

// Build Test
addTest('Project builds without errors', async () => {
  try {
    execSync('npm run build', { 
      cwd: '/Users/jw/Projects/JW-Site',
      stdio: 'pipe',
      timeout: 30000
    });
  } catch (error) {
    throw new Error(`Build failed: ${error.message}`);
  }
});

// Run all tests
runTests().catch(console.error);
