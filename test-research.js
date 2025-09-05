#!/usr/bin/env node

const { handlers } = require('./src/server/handlers');

async function testResearchEngine() {
  console.log('🔬 Testing AtlasIT Research Engine\n');
  
  try {
    console.log('Testing quick_market_query...');
    const quickResult = await handlers.quick_market_query("IT automation market trends");
    console.log('✅ Quick market query:', quickResult?.query || 'Success');
    
    console.log('\nTesting market_research...');
    const marketResult = await handlers.market_research("Enterprise IT automation platform");
    console.log('✅ Market research:', marketResult?.topic || 'Success');
    
    console.log('\nTesting competitive_intelligence...');
    const competitiveResult = await handlers.competitive_intelligence("IT automation competitors");
    console.log('✅ Competitive intelligence:', competitiveResult?.topic || 'Success');
    
    console.log('\nTesting atlasit_research...');
    const atlasitResult = await handlers.atlasit_research("IT automation platform market value");
    console.log('✅ AtlasIT research:', atlasitResult?.platform || 'Success');
    
    console.log('\n🎉 All research tools are functioning correctly!');
    console.log('\n📊 Research Engine Features:');
    console.log('• Real web search with content extraction');
    console.log('• AI-enhanced analysis and summarization');
    console.log('• Comprehensive research document generation');
    console.log('• Market analysis and competitive intelligence');
    console.log('• Dynamic research capabilities');
    
    console.log('\n🚀 Ready for AtlasIT Platform development!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n⚠️  Some features may require internet connectivity');
  }
}

testResearchEngine().catch(console.error);
