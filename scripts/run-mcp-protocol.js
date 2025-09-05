const fetch = require('node-fetch');

const steps = [
  { step: 'context_ingestion', context: 'Gather comprehensive repo and code context for AtlasIT platform analysis' },
  { step: 'wlan_market_scan', context: 'Analyze current market trends in IT automation and management' },
  { step: 'wlan_competitor_scan', context: 'Identify key competitors and market positioning' },
  { step: 'wlan_pricing_scan', context: 'Research pricing models and market rates' },
  { step: 'persona_research', context: 'Understand target user profiles and pain points' },
  { step: 'repo_feature_mapping', context: 'Map implemented features against market needs' },
  { step: 'synthesis_recommendations', context: 'Generate comprehensive market validation report' }
];

async function runProtocol() {
  let accumulatedData = {};
  const results = [];

  console.log('🚀 Starting AtlasIT Market Research Protocol');
  console.log('=' .repeat(50));

  for (let i = 0; i < steps.length; i++) {
    const { step, context } = steps[i];
    console.log(`\n📊 Step ${i + 1}/${steps.length}: ${step}`);
    console.log(`Context: ${context}`);

    try {
      const payload = { step, context, ...accumulatedData };
      const response = await fetch('http://localhost:5050/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ ${step} completed successfully`);

      // Merge results into accumulated data
      accumulatedData = { ...accumulatedData, ...data };
      results.push({ step, success: true, data });

    } catch (error) {
      console.error(`❌ Error in step ${step}:`, error.message);
      results.push({ step, success: false, error: error.message });
    }
  }

  console.log('\n' + '=' .repeat(50));
  console.log('🎯 Protocol Complete!');
  console.log(`Successful steps: ${results.filter(r => r.success).length}/${steps.length}`);

  if (results.some(r => r.success && r.step === 'synthesis_recommendations')) {
    console.log('\n📄 Report generated: ./docs/MarketProductValidationReport.md');
    console.log('🔍 Check the report for detailed market analysis and recommendations');
  }

  return results;
}

// Health check before starting
async function checkServer() {
  try {
    const response = await fetch('http://localhost:5050/health');
    if (response.ok) {
      console.log('✅ MCP Server is healthy');
      return true;
    }
  } catch (error) {
    console.log('❌ MCP Server not responding. Please start the server first:');
    console.log('   node scripts/mcp-server.js');
    console.log(`   Error details: ${error.message}`);
    return false;
  }
  return false;
}

// Main execution
async function main() {
  const serverHealthy = await checkServer();
  if (!serverHealthy) {
    process.exit(1);
  }

  try {
    await runProtocol();
  } catch (error) {
    console.error('💥 Protocol execution failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runProtocol, checkServer };
