const fetch = require('node-fetch');

const quickQueries = [
  { step: 'quick_market_query', context: 'Current IT automation market trends and opportunities' },
  { step: 'quick_competitor_query', context: 'Top IT automation competitors in 2024' },
  { step: 'quick_sentiment_query', context: 'IT professional sentiment on automation tools' },
  { step: 'quick_trend_query', context: 'Emerging trends in IT management' }
];

async function runQuickResearch() {
  console.log('🚀 AtlasIT Quick Research - AI-Powered Insights');
  console.log('=' .repeat(55));

  const results = [];

  for (let i = 0; i < quickQueries.length; i++) {
    const { step, context } = quickQueries[i];
    console.log(`\n⚡ Query ${i + 1}/${quickQueries.length}: ${step}`);
    console.log(`Context: ${context}`);

    const startTime = Date.now();

    try {
      const response = await fetch('http://localhost:5050/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step, context })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const executionTime = Date.now() - startTime;

      console.log(`✅ Completed in ${executionTime}ms`);
      console.log(`📊 Data points: ${data.dataPoints || 'N/A'}`);

      results.push({ step, success: true, data, executionTime });

    } catch (error) {
      console.error(`❌ Failed: ${error.message}`);
      results.push({ step, success: false, error: error.message });
    }
  }

  console.log('\n' + '=' .repeat(55));
  console.log('🎯 Quick Research Complete!');
  console.log(`Successful queries: ${results.filter(r => r.success).length}/${quickQueries.length}`);
  console.log(`Average execution time: ${Math.round(results.filter(r => r.success).reduce((sum, r) => sum + r.executionTime, 0) / results.filter(r => r.success).length)}ms`);

  // Generate quick insights summary
  const successfulResults = results.filter(r => r.success);

  if (successfulResults.length > 0) {
    console.log('\n🔍 Key Insights Summary:');

    successfulResults.forEach(result => {
      console.log(`\n${result.step.toUpperCase()}:`);
      if (result.data.insights) {
        result.data.insights.slice(0, 2).forEach(insight => {
          console.log(`  • ${insight.summary || insight} (${insight.sentiment?.label || 'N/A'})`);
        });
      } else if (result.data.topCompetitors) {
        console.log(`  • Top: ${result.data.topCompetitors.slice(0, 3).join(', ')}`);
      } else if (result.data.overallSentiment) {
        const sentimentStr = Object.entries(result.data.overallSentiment).map(([s, c]) => `${s}: ${c}`).join(', ');
        console.log(`  • Sentiment: ${sentimentStr}`);
      } else if (result.data.trends) {
        result.data.trends.slice(0, 2).forEach(trend => {
          console.log(`  • ${trend}`);
        });
      }
    });
  }

  return results;
}

// Health check before starting
async function checkServer() {
  try {
    const response = await fetch('http://localhost:5050/health');
    if (response.ok) {
      console.log('✅ MCP Server is healthy and ready');
      return true;
    }
  } catch (error) {
    console.log('❌ MCP Server not responding. Please start the server first:');
    console.log('   node /Users/jw/Projects/JW-Site/scripts/mcp-server.js');
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
    await runQuickResearch();
  } catch (error) {
    console.error('💥 Quick research failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runQuickResearch, checkServer };
