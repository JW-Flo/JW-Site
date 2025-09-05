const { AIAnalyzer } = require('./ai-analyzer');
const { ResearchEngine } = require('./research-engine');

const aiAnalyzer = new AIAnalyzer();
const researchEngine = new ResearchEngine();

const handlers = {
  // Dynamic market research with comprehensive document generation
  comprehensive_research: async (context) => {
    console.log("Starting comprehensive research for:", context);
    
    const topic = context || "AI technology market";
    
    try {
      // Perform real web search
      const searchResults = await researchEngine.performWebSearch(topic, 15);
      
      // Generate comprehensive research document
      const researchDocument = await researchEngine.generateResearchDocument(
        topic, 
        searchResults, 
        'comprehensive'
      );
      
      return {
        topic,
        document: researchDocument,
        searchResults: searchResults.map(r => ({
          title: r.title,
          url: r.url,
          source: r.source,
          extracted: r.extracted
        })),
        metadata: {
          sources_analyzed: searchResults.length,
          content_extracted: searchResults.filter(r => r.extracted).length,
          research_depth: 'comprehensive',
          generated_at: new Date().toISOString()
        },
        provider: "atlasit-research-engine"
      };
    } catch (err) {
      console.log("Comprehensive research error:", err.message);
      return {
        error: "Research generation failed",
        fallback: "Dynamic research system temporarily unavailable",
        topic,
        timestamp: new Date().toISOString(),
        provider: "atlasit-research-engine"
      };
    }
  },

  // Market-specific research
  market_research: async (context) => {
    console.log("Starting market research for:", context);
    
    const topic = context || "Technology market analysis";
    
    try {
      const searchResults = await researchEngine.performWebSearch(`${topic} market size revenue growth`, 12);
      const researchDocument = await researchEngine.generateResearchDocument(topic, searchResults, 'market');
      
      return {
        topic,
        document: researchDocument,
        market_insights: {
          total_sources: searchResults.length,
          market_data_found: searchResults.filter(r => 
            r.content.toLowerCase().includes('market') || 
            r.content.toLowerCase().includes('revenue')
          ).length,
          sentiment_analysis: await aiAnalyzer.analyzeSentiment(
            searchResults.map(r => r.content).join(' ').substring(0, 2000)
          )
        },
        provider: "atlasit-research-engine"
      };
    } catch (err) {
      console.log("Market research error:", err.message);
      return {
        error: "Market research failed",
        topic,
        timestamp: new Date().toISOString(),
        provider: "atlasit-research-engine"
      };
    }
  },

  // Competitive intelligence
  competitive_intelligence: async (context) => {
    console.log("Starting competitive intelligence for:", context);
    
    const topic = context || "IT automation competitors";
    
    try {
      const searchResults = await researchEngine.performWebSearch(`${topic} competitive analysis companies`, 10);
      const researchDocument = await researchEngine.generateResearchDocument(topic, searchResults, 'competitive');
      
      // Extract competitor names using AI
      const allContent = searchResults.map(r => r.content).join(' ');
      const entities = await aiAnalyzer.extractEntities(allContent);
      const competitors = entities.filter(e => e.type === 'ORG').map(e => e.text);
      
      return {
        topic,
        document: researchDocument,
        competitive_analysis: {
          identified_competitors: competitors.slice(0, 15),
          competitive_sources: searchResults.length,
          market_positioning: "Analysis based on web research and AI extraction"
        },
        provider: "atlasit-research-engine"
      };
    } catch (err) {
      console.log("Competitive intelligence error:", err.message);
      return {
        error: "Competitive analysis failed",
        topic,
        timestamp: new Date().toISOString(),
        provider: "atlasit-research-engine"
      };
    }
  },

  // Quick market query (enhanced)
  quick_market_query: async (context) => {
    console.log("Processing enhanced quick market query...");
    
    const topic = context || "AI market trends";
    
    try {
      // Quick search with fewer results for speed
      const searchResults = await researchEngine.performWebSearch(topic, 5);
      const marketAnalysis = await researchEngine.generateMarketAnalysis(topic, searchResults);
      
      return {
        query: topic,
        quick_analysis: marketAnalysis,
        sources: searchResults.map(r => ({ title: r.title, source: r.source })),
        enhanced: true,
        timestamp: new Date().toISOString(),
        provider: "atlasit-research-engine"
      };
    } catch (err) {
      console.log("Quick market query error:", err.message);
      // Fallback to static data
      return {
        query: topic,
        analysis: {
          marketSize: "$157.5 billion by 2027",
          growthRate: "38.1% CAGR",
          keyTrends: [
            "Generative AI adoption accelerating",
            "Enterprise AI integration growing",
            "Edge AI deployment increasing",
            "AI governance becoming critical"
          ],
          sentiment: "POSITIVE"
        },
        enhanced: false,
        timestamp: new Date().toISOString(),
        provider: "atlasit-research-engine"
      };
    }
  },

  // AtlasIT platform research
  atlasit_research: async (context) => {
    console.log("Starting AtlasIT platform research...");
    
    const query = `${context || "IT automation platform"} enterprise software market`;
    
    try {
      const searchResults = await researchEngine.performWebSearch(query, 12);
      const researchDocument = await researchEngine.generateResearchDocument(
        "AtlasIT Platform Market Analysis", 
        searchResults, 
        'comprehensive'
      );
      
      // Additional AtlasIT-specific analysis
      const atlasitInsights = {
        target_market: "Enterprise IT automation and governance",
        market_opportunity: "Growing demand for integrated IT management solutions",
        competitive_advantage: "Comprehensive platform approach with AI-enhanced analytics",
        key_differentiators: [
          "Unified IT automation and security platform",
          "AI-powered predictive analytics",
          "Comprehensive compliance and governance tools",
          "Scalable cloud-native architecture"
        ]
      };
      
      return {
        platform: "AtlasIT",
        document: researchDocument,
        atlasit_insights: atlasitInsights,
        market_validation: {
          sources_analyzed: searchResults.length,
          market_demand_indicators: searchResults.filter(r => 
            r.content.toLowerCase().includes('automation') || 
            r.content.toLowerCase().includes('governance')
          ).length
        },
        provider: "atlasit-research-engine"
      };
    } catch (err) {
      console.log("AtlasIT research error:", err.message);
      return {
        platform: "AtlasIT",
        error: "Platform research failed",
        timestamp: new Date().toISOString(),
        provider: "atlasit-research-engine"
      };
    }
  },

  // Technology trend analysis
  technology_trends: async (context) => {
    console.log("Starting technology trends analysis...");
    
    const topic = context || "emerging technology trends";
    
    try {
      const searchResults = await researchEngine.performWebSearch(`${topic} 2024 predictions innovation`, 10);
      const trendsDocument = await researchEngine.generateResearchDocument(
        "Technology Trends Analysis", 
        searchResults, 
        'trends'
      );
      
      return {
        topic,
        document: trendsDocument,
        trends_analysis: {
          total_sources: searchResults.length,
          tech_trends_identified: searchResults.filter(r => 
            r.content.toLowerCase().includes('trend') || 
            r.content.toLowerCase().includes('innovation')
          ).length
        },
        provider: "atlasit-research-engine"
      };
    } catch (err) {
      console.log("Technology trends error:", err.message);
      return {
        error: "Technology trends analysis failed",
        topic,
        timestamp: new Date().toISOString(),
        provider: "atlasit-research-engine"
      };
    }
  },

  // AI-powered summarization (enhanced)
  ai_summarize: async (context, accumulatedData) => {
    console.log("Starting enhanced AI summarization...");
    
    const text = context || accumulatedData?.text || "No text provided for summarization";
    
    try {
      const summary = await aiAnalyzer.summarizeText(text, 200);
      const sentiment = await aiAnalyzer.analyzeSentiment(text);
      const entities = await aiAnalyzer.extractEntities(text);
      
      return {
        originalLength: text.length,
        summary,
        sentiment,
        entities: entities.slice(0, 10),
        enhanced: true,
        timestamp: new Date().toISOString(),
        provider: "atlasit-research-engine"
      };
    } catch (err) {
      console.log("AI summarization error:", err.message);
      return {
        error: "Summarization failed",
        fallback: "AI summarization is currently unavailable",
        timestamp: new Date().toISOString(),
        provider: "atlasit-research-engine"
      };
    }
  },

  // Context ingestion (enhanced)
  context_ingestion: async (context) => {
    console.log("Starting enhanced context ingestion...");
    
    try {
      // Use research engine to gather context about the topic
      const searchResults = await researchEngine.performWebSearch(context || "platform analysis", 5);
      const contextAnalysis = await researchEngine.generateMarketAnalysis(context, searchResults);
      
      return {
        analysis: {
          totalSources: searchResults.length,
          contextAnalysis,
          features: ["IT Automation", "Security", "Data Governance", "AI Analytics"],
          modules: ["AtlasIT Core", "Security Module", "Analytics Engine", "Research Engine"]
        },
        context: context || "AtlasIT platform analysis",
        enhanced: true,
        timestamp: new Date().toISOString(),
        provider: "atlasit-research-engine"
      };
    } catch (err) {
      console.log("Context ingestion error:", err.message);
      return {
        analysis: {
          totalFiles: 0,
          docFiles: 0,
          codeFiles: 0,
          features: ["IT Automation", "Security", "Data Governance"],
          modules: ["AtlasIT Core", "Security Module", "Analytics Engine"]
        },
        context: context || "AtlasIT platform analysis",
        enhanced: false,
        timestamp: new Date().toISOString(),
        provider: "atlasit-research-engine"
      };
    }
  }
};

module.exports = { handlers };

module.exports = { handlers };
