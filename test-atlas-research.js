const fetch = require('node-fetch');

async function testAtlasITResearch() {
  try {
    console.log('Testing AtlasIT market research...');

    const response = await fetch('http://localhost:5050/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        step: 'comprehensive_research',
        context: 'AtlasIT market value, valuation, competitive position, and growth potential'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Research completed successfully!');
    console.log('Summary:', data.summary);
    console.log('Top insights:');

    // Display key findings
    if (data.insights) {
      console.log('\n=== MARKET TRENDS ===');
      if (data.insights.rss && data.insights.rss.length > 0) {
        data.insights.rss.slice(0, 3).forEach((insight, i) => {
          console.log(`${i+1}. ${insight.title}`);
          if (insight.trends && insight.trends.topTrends) {
            console.log(`   Top trends: ${insight.trends.topTrends.map(t => t.trend).join(', ')}`);
          }
        });
      }

      console.log('\n=== MARKET SIZE INDICATORS ===');
      let totalMarketValue = 0;
      let marketMentions = 0;

      [...(data.insights.rss || []), ...(data.insights.api || []), ...(data.insights.web || [])].forEach(insight => {
        if (insight.trends && insight.trends.marketSize) {
          insight.trends.marketSize.forEach(size => {
            console.log(`- ${size.raw} (Context: ${size.context.substring(0, 100)}...)`);
            totalMarketValue += size.value;
            marketMentions++;
          });
        }
      });

      if (marketMentions > 0) {
        console.log(`\nAverage market value mentioned: $${(totalMarketValue / marketMentions / 1000000).toFixed(0)}M`);
      }
    }

    return data;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

testAtlasITResearch();
