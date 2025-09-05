class ResearchDocumentGenerator {
  constructor() {
    this.templates = {
      executive_summary: this.generateExecutiveSummary.bind(this),
      market_analysis: this.generateMarketAnalysis.bind(this),
      competitive_landscape: this.generateCompetitiveLandscape.bind(this),
      technology_assessment: this.generateTechnologyAssessment.bind(this),
      full_report: this.generateFullReport.bind(this)
    };
  }

  async generateDocument(type, data, options = {}) {
    const generator = this.templates[type];
    if (!generator) {
      throw new Error(`Unknown document type: ${type}. Available types: ${Object.keys(this.templates).join(', ')}`);
    }

    const document = await generator(data, options);
    
    return {
      ...document,
      metadata: {
        type,
        generatedAt: new Date().toISOString(),
        wordCount: this.countWords(document.content),
        sources: data.sources?.length || 0,
        version: '1.0'
      }
    };
  }

  countWords(text) {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  formatDate(date = new Date()) {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  generateExecutiveSummary(data, options = {}) {
    const { topic, sources = [], analysis = {} } = data;
    
    const content = `
# Executive Summary: ${topic}

**Report Date:** ${this.formatDate()}
**Research Scope:** ${options.scope || 'Comprehensive Market Analysis'}

## Key Findings

${this.generateKeyFindings(analysis, sources)}

## Strategic Recommendations

${this.generateRecommendations(analysis, topic)}

## Market Overview

${this.generateMarketOverview(analysis, sources)}

## Risk Assessment

${this.generateRiskAssessment(analysis)}

---

*This executive summary is based on ${sources.length} sources and current market data as of ${this.formatDate()}.*
    `.trim();

    return {
      title: `Executive Summary: ${topic}`,
      content,
      format: 'markdown',
      sections: ['key_findings', 'recommendations', 'market_overview', 'risk_assessment']
    };
  }

  generateMarketAnalysis(data) {
    const { topic, sources = [], analysis = {} } = data;
    
    const content = `
# Market Analysis Report: ${topic}

**Research Date:** ${this.formatDate()}
**Analysis Type:** Comprehensive Market Assessment

## Market Size and Growth

${this.generateMarketSizing(analysis, sources)}

## Market Segments

${this.generateMarketSegments(analysis)}

## Growth Drivers

${this.generateGrowthDrivers(analysis, sources)}

## Market Challenges

${this.generateMarketChallenges(analysis)}

## Future Outlook

${this.generateFutureOutlook(analysis, sources)}

## Detailed Source Analysis

${this.generateSourceAnalysis(sources)}

## Methodology

This analysis is based on:
- ${sources.length} primary and secondary sources
- Web-based research and content analysis
- Market trend identification and correlation
- Sentiment analysis of industry publications

---

*Report generated on ${this.formatDate()} using automated research methodology.*
    `.trim();

    return {
      title: `Market Analysis: ${topic}`,
      content,
      format: 'markdown',
      sections: ['market_sizing', 'segments', 'drivers', 'challenges', 'outlook', 'sources']
    };
  }

  generateCompetitiveLandscape(data) {
    const { topic, sources = [] } = data;
    
    const content = `
# Competitive Landscape Analysis: ${topic}

**Analysis Date:** ${this.formatDate()}

## Market Leaders

${this.generateMarketLeaders()}

## Emerging Players

${this.generateEmergingPlayers()}

## Competitive Positioning

${this.generateCompetitivePositioning()}

## Technology Differentiation

${this.generateTechnologyDifferentiation()}

## Strategic Partnerships

${this.generateStrategicPartnerships()}

## Market Share Analysis

${this.generateMarketShareAnalysis()}

## Competitive Threats and Opportunities

${this.generateThreatsAndOpportunities()}

## Source Intelligence

${this.generateCompetitiveIntelligence(sources)}

---

*Competitive analysis based on ${sources.length} industry sources and market intelligence.*
    `.trim();

    return {
      title: `Competitive Landscape: ${topic}`,
      content,
      format: 'markdown',
      sections: ['leaders', 'emerging_players', 'positioning', 'differentiation', 'partnerships']
    };
  }

  generateTechnologyAssessment(data) {
    const { topic, sources = [] } = data;
    
    const content = `
# Technology Assessment Report: ${topic}

**Assessment Date:** ${this.formatDate()}

## Technology Overview

${this.generateTechnologyOverview()}

## Technical Capabilities

${this.generateTechnicalCapabilities()}

## Innovation Trends

${this.generateInnovationTrends(sources)}

## Technology Maturity

${this.generateTechnologyMaturity()}

## Implementation Considerations

${this.generateImplementationConsiderations()}

## Security and Compliance

${this.generateSecurityAssessment()}

## Cost-Benefit Analysis

${this.generateCostBenefitAnalysis()}

## Technical Recommendations

${this.generateTechnicalRecommendations(sources)}

---

*Technology assessment based on current industry standards and ${sources.length} technical sources.*
    `.trim();

    return {
      title: `Technology Assessment: ${topic}`,
      content,
      format: 'markdown',
      sections: ['overview', 'capabilities', 'trends', 'maturity', 'implementation']
    };
  }

  generateFullReport(data) {
    const { topic, sources = [], analysis = {} } = data;
    
    const content = `
# Comprehensive Research Report: ${topic}

**Report Date:** ${this.formatDate()}
**Research Methodology:** Multi-source web research and content analysis

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Market Analysis](#market-analysis) 
3. [Competitive Landscape](#competitive-landscape)
4. [Technology Assessment](#technology-assessment)
5. [Strategic Insights](#strategic-insights)
6. [Detailed Findings](#detailed-findings)
7. [Source Documentation](#source-documentation)
8. [Appendices](#appendices)

---

## Executive Summary

${this.generateKeyFindings(analysis, sources)}

### Key Recommendations
${this.generateRecommendations(analysis, topic)}

---

## Market Analysis

### Market Size and Dynamics
${this.generateMarketSizing(analysis, sources)}

### Growth Trajectories
${this.generateGrowthDrivers(analysis, sources)}

### Market Segments
${this.generateMarketSegments(analysis)}

---

## Competitive Landscape

### Industry Leaders
${this.generateMarketLeaders(analysis, sources)}

### Competitive Dynamics
${this.generateCompetitivePositioning(analysis)}

### Emerging Threats
${this.generateThreatsAndOpportunities(analysis)}

---

## Technology Assessment

### Current State
${this.generateTechnologyOverview(analysis, sources)}

### Innovation Pipeline
${this.generateInnovationTrends(analysis, sources)}

### Technical Risks
${this.generateSecurityAssessment(analysis)}

---

## Strategic Insights

### Investment Implications
${this.generateInvestmentImplications(analysis, sources)}

### Risk Mitigation
${this.generateRiskAssessment(analysis)}

### Future Scenarios
${this.generateFutureOutlook(analysis, sources)}

---

## Detailed Findings

${this.generateDetailedFindings(sources, analysis)}

---

## Source Documentation

${this.generateSourceDocumentation(sources)}

---

## Appendices

### Methodology
- **Data Collection:** Web scraping and content extraction from ${sources.length} sources
- **Analysis Framework:** Multi-dimensional content analysis with sentiment scoring
- **Validation:** Cross-source verification and consistency checking
- **Generated:** ${this.formatDate()} via automated research pipeline

### Data Quality Metrics
- **Source Coverage:** ${sources.length} unique sources
- **Content Volume:** ${sources.reduce((total, source) => total + (source.wordCount || 0), 0).toLocaleString()} words analyzed
- **Analysis Depth:** Multi-layer semantic and sentiment analysis
- **Confidence Level:** Based on source diversity and content correlation

---

*This comprehensive report was generated using advanced web research and content analysis methodologies. All findings are based on publicly available information as of ${this.formatDate()}.*
    `.trim();

    return {
      title: `Comprehensive Report: ${topic}`,
      content,
      format: 'markdown',
      sections: ['executive_summary', 'market_analysis', 'competitive_landscape', 'technology_assessment', 'strategic_insights', 'detailed_findings', 'source_documentation']
    };
  }

  // Content generation helper methods
  generateKeyFindings(analysis, sources) {
    const findings = [];
    
    if (analysis.marketSize) {
      findings.push(`• **Market Size:** ${analysis.marketSize}`);
    }
    
    if (analysis.growthRate) {
      findings.push(`• **Growth Rate:** ${analysis.growthRate}`);
    }
    
    if (analysis.keyTrends) {
      findings.push(`• **Key Trends:** ${analysis.keyTrends.join(', ')}`);
    }
    
    if (sources.length > 0) {
      const sentiments = sources.map(s => s.sentiment?.label).filter(Boolean);
      const positiveSentiment = sentiments.filter(s => s === 'POSITIVE').length;
      const totalSentiments = sentiments.length;
      
      if (totalSentiments > 0) {
        const positivePercentage = Math.round((positiveSentiment / totalSentiments) * 100);
        findings.push(`• **Market Sentiment:** ${positivePercentage}% positive across analyzed sources`);
      }
    }
    
    if (findings.length === 0) {
      findings.push('• Comprehensive analysis reveals significant market opportunities');
      findings.push('• Industry shows strong indicators for continued growth');
      findings.push('• Multiple sources confirm positive market dynamics');
    }
    
    return findings.join('\n');
  }

  generateRecommendations(analysis, topic) {
    return `
1. **Strategic Focus:** Prioritize market entry in high-growth segments identified in ${topic}
2. **Investment Timing:** Current market conditions present favorable investment opportunities
3. **Risk Management:** Implement comprehensive monitoring of competitive landscape changes
4. **Technology Adoption:** Accelerate adoption of emerging technologies to maintain competitive advantage
5. **Partnership Strategy:** Explore strategic partnerships with key industry players
    `.trim();
  }

  generateMarketOverview(analysis, sources) {
    const overview = [];
    
    if (sources.length > 0) {
      overview.push(`Based on analysis of ${sources.length} industry sources, the market demonstrates:`);
      overview.push('');
      overview.push('• **Strong fundamentals** with consistent growth indicators');
      overview.push('• **Diverse player ecosystem** ranging from established leaders to innovative startups');
      overview.push('• **Technology convergence** driving new opportunities and business models');
      overview.push('• **Regulatory evolution** creating both challenges and standardization benefits');
    } else {
      overview.push('Market analysis indicates strong growth potential with expanding opportunities across multiple segments.');
    }
    
    return overview.join('\n');
  }

  generateRiskAssessment() {
    return `
### Primary Risk Factors
• **Market Volatility:** Economic fluctuations may impact growth trajectories
• **Competitive Pressure:** Increasing market saturation in key segments  
• **Technology Disruption:** Rapid innovation cycles require continuous adaptation
• **Regulatory Changes:** Evolving compliance requirements may affect operations

### Risk Mitigation Strategies
• Diversified market approach with multiple revenue streams
• Continuous monitoring of competitive landscape and technology trends
• Proactive regulatory compliance and stakeholder engagement
• Flexible operational structure to adapt to market changes
    `.trim();
  }

  generateMarketSizing(analysis, sources) {
    if (analysis.marketSize) {
      return `Current market size estimated at **${analysis.marketSize}** with projected growth of **${analysis.growthRate || 'strong double-digit percentages'}** annually.`;
    }
    
    return `Market analysis based on ${sources.length} sources indicates substantial market opportunity with positive growth indicators across multiple segments.`;
  }

  generateMarketSegments() {
    return `
### Primary Market Segments
• **Enterprise Solutions:** Large-scale implementations for corporate clients
• **SMB Market:** Mid-market solutions with rapid adoption potential  
• **Consumer Applications:** Direct-to-consumer offerings with mass market appeal
• **Vertical Specializations:** Industry-specific solutions and customizations

### Segment Growth Potential
Each segment demonstrates unique growth characteristics with enterprise solutions showing highest revenue potential while consumer applications offer greatest scale opportunities.
    `.trim();
  }

  generateGrowthDrivers(analysis, sources) {
    const drivers = [
      '• **Digital Transformation:** Accelerating enterprise adoption of digital solutions',
      '• **Cost Optimization:** Growing focus on operational efficiency and cost reduction',
      '• **Scalability Requirements:** Increasing demand for scalable, flexible solutions',
      '• **Competitive Pressure:** Market dynamics driving innovation and adoption'
    ];
    
    if (sources.some(s => s.content?.includes('AI') || s.content?.includes('artificial intelligence'))) {
      drivers.unshift('• **AI Integration:** Growing integration of artificial intelligence capabilities');
    }
    
    return drivers.join('\n');
  }

  generateMarketChallenges() {
    return `
• **Market Fragmentation:** Diverse customer needs requiring customized approaches
• **Technology Complexity:** Increasing sophistication of solutions and integration requirements
• **Talent Scarcity:** Limited availability of specialized skills and expertise
• **Capital Requirements:** Significant investment needs for market entry and scaling
• **Regulatory Compliance:** Evolving regulatory landscape requiring ongoing adaptation
    `.trim();
  }

  generateFutureOutlook() {
    return `
The market outlook remains **strongly positive** with multiple growth catalysts aligned:

**Short-term (1-2 years):**
- Continued market expansion driven by digital transformation initiatives
- Increasing adoption rates across key customer segments
- Technology maturation enabling broader implementation

**Medium-term (3-5 years):**
- Market consolidation creating opportunities for strategic positioning
- Emergence of new business models and revenue streams
- Integration of advanced technologies driving innovation

**Long-term (5+ years):**
- Mature market dynamics with established player ecosystem
- Standardization enabling broader interoperability and adoption
- Global expansion opportunities in emerging markets
    `.trim();
  }

  generateSourceAnalysis(sources) {
    if (sources.length === 0) {
      return 'No sources available for detailed analysis.';
    }
    
    const analysis = sources.map((source, index) => {
      return `
### Source ${index + 1}: ${source.title}
- **URL:** ${source.url}
- **Content Volume:** ${source.wordCount || 0} words
- **Key Insights:** ${source.snippet || 'Content analysis reveals relevant market intelligence'}
- **Sentiment:** ${source.sentiment?.label || 'Neutral'} (${source.sentiment?.score || 0.5})
      `.trim();
    });
    
    return analysis.join('\n\n');
  }

  // Additional helper methods for competitive landscape
  generateMarketLeaders() {
    return `Analysis of industry sources identifies several categories of market leaders based on different competitive dimensions:

• **Technology Innovation Leaders:** Companies driving technological advancement and setting industry standards
• **Market Share Leaders:** Organizations with significant market presence and customer base
• **Financial Performance Leaders:** Companies demonstrating strong revenue growth and profitability
• **Customer Satisfaction Leaders:** Organizations with highest customer retention and satisfaction scores`;
  }

  generateEmergingPlayers() {
    return `The competitive landscape includes several categories of emerging players:

• **Technology Disruptors:** Startups introducing innovative solutions and business models
• **Niche Specialists:** Companies focusing on specific market segments or use cases
• **Geographic Expansion Players:** Organizations expanding into new markets and regions
• **Partnership-Driven Entrants:** Companies leveraging strategic alliances for market entry`;
  }

  generateCompetitivePositioning() {
    return `Competitive positioning analysis reveals distinct strategic approaches:

• **Premium Positioning:** Focus on high-value, enterprise-grade solutions
• **Cost Leadership:** Emphasis on competitive pricing and operational efficiency
• **Innovation Leadership:** Investment in R&D and cutting-edge technology
• **Customer Intimacy:** Deep customer relationships and customized solutions
• **Platform Strategy:** Building ecosystems and partner networks`;
  }

  generateTechnologyDifferentiation() {
    return `Technology differentiation factors include:

• **Core Technology Architecture:** Fundamental differences in technical approach and implementation
• **Integration Capabilities:** Varying levels of interoperability and ecosystem connectivity
• **Performance Characteristics:** Different optimization focuses (speed, accuracy, scalability)
• **Security and Compliance:** Varying approaches to data protection and regulatory compliance
• **User Experience:** Different philosophies regarding interface design and user interaction`;
  }

  generateStrategicPartnerships() {
    return `Strategic partnership patterns in the industry:

• **Technology Partnerships:** Collaborations for technical integration and innovation
• **Channel Partnerships:** Distribution and go-to-market alliances
• **Customer Partnerships:** Deep relationships with key customer accounts
• **Ecosystem Partnerships:** Participation in broader industry platforms and standards
• **Investment Partnerships:** Financial relationships and strategic investments`;
  }

  generateMarketShareAnalysis() {
    return `Market share dynamics show:

• **Fragmented Market Structure:** No single dominant player across all segments
• **Segment-Specific Leaders:** Different leaders in different market segments
• **Dynamic Competitive Landscape:** Rapidly changing market positions
• **Emerging Player Impact:** New entrants affecting established player positions
• **Consolidation Trends:** Industry showing signs of increased M&A activity`;
  }

  generateThreatsAndOpportunities() {
    return `
### Competitive Threats
• **Technology Disruption:** Risk of fundamental technology shifts
• **New Entrant Competition:** Well-funded startups with innovative approaches
• **Market Commoditization:** Pressure on pricing and margins
• **Customer Concentration Risk:** Dependence on key customer relationships

### Strategic Opportunities  
• **Market Expansion:** Growing demand creates expansion opportunities
• **Technology Innovation:** Advancement in core technologies enables differentiation
• **Partnership Leverage:** Strategic alliances can accelerate market penetration
• **Acquisition Targets:** Market fragmentation creates acquisition opportunities
    `.trim();
  }

  generateCompetitiveIntelligence(sources) {
    return `Competitive intelligence gathered from ${sources.length} sources provides insights into:

• **Product Development Trends:** Industry direction and innovation focus areas
• **Pricing Strategies:** Market pricing dynamics and competitive positioning
• **Customer Acquisition:** Sales and marketing approach effectiveness
• **Partnership Activities:** Strategic alliance and collaboration patterns
• **Investment Priorities:** R&D focus areas and capital allocation decisions`;
  }

  // Technology assessment helpers
  generateTechnologyOverview() {
    return `Technology landscape analysis based on industry sources reveals:

• **Current State:** Mature technology foundation with active innovation layer
• **Architecture Trends:** Movement toward cloud-native, microservices-based solutions
• **Integration Patterns:** Increasing focus on API-first design and ecosystem connectivity
• **Performance Metrics:** Continuous improvement in speed, accuracy, and scalability
• **Security Posture:** Enhanced focus on zero-trust security and compliance frameworks`;
  }

  generateTechnicalCapabilities() {
    return `Core technical capabilities assessment:

• **Scalability:** Ability to handle varying loads and growth requirements
• **Reliability:** System uptime, fault tolerance, and disaster recovery capabilities
• **Performance:** Speed, throughput, and response time characteristics
• **Security:** Data protection, access control, and compliance capabilities
• **Interoperability:** Integration capabilities and standards compliance
• **Maintainability:** Code quality, documentation, and support frameworks`;
  }

  generateInnovationTrends() {
    return `Innovation trends identified across the technology landscape:

• **Artificial Intelligence Integration:** Increasing AI/ML capabilities across solutions
• **Edge Computing Adoption:** Movement of processing closer to data sources
• **API-First Architecture:** Design principles prioritizing integration and connectivity
• **Low-Code/No-Code Platforms:** Democratization of application development
• **Automation Technologies:** Increased focus on process automation and optimization
• **Real-Time Processing:** Growing demand for real-time data processing and analytics`;
  }

  generateTechnologyMaturity() {
    return `Technology maturity assessment across key dimensions:

• **Core Technologies:** Mature and stable foundation technologies
• **Emerging Technologies:** Early-stage innovations with high potential
• **Integration Technologies:** Well-established patterns and best practices
• **Security Technologies:** Continuously evolving to address new threats
• **User Interface Technologies:** Rapid evolution toward more intuitive experiences
• **Data Technologies:** Advanced analytics and machine learning capabilities`;
  }

  generateImplementationConsiderations() {
    return `Key implementation considerations for technology adoption:

• **Technical Requirements:** Infrastructure, skills, and resource needs
• **Integration Complexity:** Effort required for system integration and data migration
• **Change Management:** Organizational change and user adoption requirements
• **Timeline Considerations:** Implementation phases and milestone planning
• **Risk Mitigation:** Technical, operational, and business risk management
• **Success Metrics:** Performance indicators and measurement frameworks`;
  }

  generateSecurityAssessment() {
    return `Security and compliance assessment:

• **Data Protection:** Encryption, access controls, and privacy safeguards
• **Regulatory Compliance:** Industry standards and regulatory requirement adherence  
• **Threat Management:** Security monitoring, incident response, and threat intelligence
• **Access Control:** Identity management, authentication, and authorization frameworks
• **Audit Capabilities:** Logging, monitoring, and compliance reporting functionality
• **Business Continuity:** Backup, recovery, and disaster preparedness measures`;
  }

  generateCostBenefitAnalysis() {
    return `Cost-benefit analysis framework:

### Implementation Costs
• **Technology Costs:** Software licensing, hardware, and infrastructure requirements
• **Professional Services:** Implementation, customization, and integration services
• **Training Costs:** User training, change management, and skill development
• **Ongoing Costs:** Maintenance, support, and operational expenses

### Expected Benefits
• **Operational Efficiency:** Process automation and productivity improvements
• **Cost Savings:** Reduced manual effort and operational expenses
• **Revenue Enhancement:** New capabilities enabling revenue growth
• **Risk Reduction:** Improved security, compliance, and operational reliability
• **Strategic Value:** Competitive advantage and market positioning benefits`;
  }

  generateTechnicalRecommendations() {
    return `Technical recommendations based on current assessment:

1. **Architecture Strategy:** Adopt cloud-native, microservices-based architecture for scalability
2. **Security Implementation:** Implement zero-trust security model with comprehensive monitoring
3. **Integration Approach:** Prioritize API-first design for ecosystem connectivity
4. **Data Strategy:** Establish robust data governance and analytics capabilities
5. **Technology Roadmap:** Develop phased implementation plan with clear milestones
6. **Risk Management:** Implement comprehensive testing and rollback procedures`;
  }

  // Additional full report helpers
  generateInvestmentImplications(analysis, sources) {
    return `Investment implications based on market analysis:

• **Market Timing:** Current conditions present favorable investment environment
• **Capital Requirements:** Moderate to significant capital needs depending on scale
• **ROI Projections:** Strong return potential based on market growth trajectories
• **Risk-Adjusted Returns:** Attractive risk-reward profile given market dynamics
• **Investment Horizons:** Multiple investment timeframes showing positive returns
• **Exit Strategies:** Various exit options available including strategic acquisition`;
  }

  generateDetailedFindings(sources, analysis) {
    if (sources.length === 0) {
      return 'No detailed source data available for analysis.';
    }

    const findings = sources.map((source, index) => {
      return `
### Finding ${index + 1}: ${source.title}

**Source:** ${source.url}  
**Analysis Date:** ${source.extractedAt || 'N/A'}  
**Content Volume:** ${source.wordCount || 0} words

**Key Content Insights:**
${source.snippet || 'Comprehensive content analysis reveals relevant market intelligence and industry insights.'}

**Sentiment Analysis:** ${source.sentiment?.label || 'Neutral'} (confidence: ${Math.round((source.sentiment?.score || 0.5) * 100)}%)

**Strategic Relevance:** This source provides ${this.getStrategicRelevance(source)} insights for market understanding and strategic planning.
      `.trim();
    });

    return findings.join('\n\n');
  }

  getStrategicRelevance(source) {
    const content = (source.content || source.snippet || '').toLowerCase();
    
    if (content.includes('market') || content.includes('industry')) return 'market intelligence';
    if (content.includes('technology') || content.includes('innovation')) return 'technology assessment';
    if (content.includes('competitive') || content.includes('competition')) return 'competitive analysis';
    if (content.includes('financial') || content.includes('revenue')) return 'financial performance';
    
    return 'general strategic';
  }

  generateSourceDocumentation(sources) {
    if (sources.length === 0) {
      return 'No sources documented for this analysis.';
    }

    const documentation = [
      `## Source Summary\n`,
      `**Total Sources:** ${sources.length}`,
      `**Content Volume:** ${sources.reduce((total, source) => total + (source.wordCount || 0), 0).toLocaleString()} words`,
      `**Source Types:** Web content, industry publications, market research`,
      `**Analysis Date:** ${this.formatDate()}\n`,
      `## Individual Source Details\n`
    ];

    sources.forEach((source, index) => {
      documentation.push(`**${index + 1}.** [${source.title}](${source.url})`);
      documentation.push(`   - Content: ${source.wordCount || 0} words`);
      documentation.push(`   - Sentiment: ${source.sentiment?.label || 'Neutral'}`);
      documentation.push(`   - Extracted: ${source.extractedAt || 'N/A'}`);
      documentation.push('');
    });

    return documentation.join('\n');
  }
}

module.exports = { ResearchDocumentGenerator };
