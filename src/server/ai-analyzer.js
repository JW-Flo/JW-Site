const fetch = require('node-fetch');

class AIAnalyzer {
  constructor() {
    this.cache = new Map();
    // AI features are optional - research works without them
    this.apiKey = process.env.CF_AI_GATEWAY_API_KEY || null;
    this.endpoints = {
      default: process.env.CF_AI_GATEWAY_ENDPOINT || null,
      llama3: process.env.CF_AI_LLAMA3_ENDPOINT || null,
      gpt: process.env.CF_AI_GPT_ENDPOINT || null,
      whisper: process.env.CF_AI_WHISPER_ENDPOINT || null
    };
    
    if (!this.apiKey || !this.endpoints.default) {
      console.log('AI features disabled - no API keys configured');
    }
  }

  async query(model, inputs, options = {}) {
    // Return graceful fallback if no API keys configured
    if (!this.apiKey || !this.endpoints.default) {
      throw new Error('AI services not configured');
    }
    
    // Map model to endpoint
    let endpoint = this.endpoints.default;
    if (model.includes("llama") || model.includes("bart-large-cnn")) {
      endpoint = this.endpoints.llama3 || endpoint;
    } else if (model.includes("gpt")) {
      endpoint = this.endpoints.gpt || endpoint;
    } else if (model.includes("whisper")) {
      endpoint = this.endpoints.whisper || endpoint;
    }

    // Prepare payload
    let payload = {};
    if (model.includes("bart-large-cnn") || model.includes("llama")) {
      payload = { prompt: inputs, max_tokens: options.max_length || 150 };
    } else if (model.includes("twitter-roberta-base-sentiment")) {
      payload = { prompt: `Analyze the sentiment of this text and respond with only: POSITIVE, NEGATIVE, or NEUTRAL followed by a confidence score (0-1):\n\n${inputs}` };
    } else if (model.includes("gpt")) {
      payload = { prompt: inputs };
    } else if (model.includes("whisper")) {
      payload = { audio: inputs };
    } else {
      payload = { prompt: inputs };
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.log(`Cloudflare AI Gateway error for ${model}: ${response.status} ${response.statusText}`);
        return this.getFallbackResponse(model, response.status);
      }

      const result = await response.json();
      console.log(`Cloudflare AI Gateway success for ${model}: ${JSON.stringify(result).substring(0, 200)}...`);
      return this.parseResult(model, result);
    } catch (err) {
      console.log(`Cloudflare AI Gateway fetch error for ${model}:`, err.message);
      return this.getFallbackResponse(model, err.message);
    }
  }

  getFallbackResponse(model, error) {
    if (model.includes("bart-large-cnn") || model.includes("llama")) {
      return { result: [{ summary_text: `AI summarization failed (${error}). Fallback: No summary generated.` }], provider: "cloudflare-ai-gateway" };
    } else if (model.includes("twitter-roberta-base-sentiment")) {
      return { result: [[{ label: "NEUTRAL", score: 0.5 }]], provider: "cloudflare-ai-gateway" };
    } else if (model.includes("gpt")) {
      return { result: { text: `AI output failed (${error}). Fallback: No response generated.` }, provider: "cloudflare-ai-gateway" };
    } else if (model.includes("whisper")) {
      return { result: { text: `AI transcription failed (${error}). Fallback: No transcription generated.` }, provider: "cloudflare-ai-gateway" };
    } else {
      return { result: {}, provider: "cloudflare-ai-gateway" };
    }
  }

  parseResult(model, result) {
    if (model.includes("bart-large-cnn") || model.includes("llama")) {
      return { result: [{ summary_text: result.response || result.result || result.text || "" }], provider: "cloudflare-ai-gateway" };
    } else if (model.includes("twitter-roberta-base-sentiment")) {
      const content = result.response || result.result || result.text || "";
      const lines = content.split("\n");
      const sentimentLine = lines.find(
        (line) => line.includes("POSITIVE") || line.includes("NEGATIVE") || line.includes("NEUTRAL")
      );
      if (sentimentLine) {
        const [label, scoreStr] = sentimentLine.split(" ");
        return {
          result: [[{ label: label || "NEUTRAL", score: parseFloat(scoreStr) || 0.5 }]],
          provider: "cloudflare-ai-gateway",
        };
      }
      return {
        result: [[{ label: "NEUTRAL", score: 0.5 }]],
        provider: "cloudflare-ai-gateway",
      };
    } else {
      return { result, provider: "cloudflare-ai-gateway" };
    }
  }

  async summarizeText(text, maxLength = 150) {
    try {
      const result = await this.query("facebook/bart-large-cnn", text, { max_length: maxLength });
      return result.result[0]?.summary_text || "No summary available";
    } catch (err) {
      console.log("Summary generation error:", err.message);
      return "Summary generation failed";
    }
  }

  async analyzeSentiment(text) {
    try {
      const result = await this.query("cardiffnlp/twitter-roberta-base-sentiment", text);
      return result.result[0]?.[0] || { label: "NEUTRAL", score: 0.5 };
    } catch (err) {
      console.log("Sentiment analysis error:", err.message);
      return { label: "NEUTRAL", score: 0.5 };
    }
  }

  async extractEntities(text) {
    try {
      // Simple entity extraction using patterns for now
      const entities = [];
      
      // Extract companies (simple pattern matching)
      const companyPatterns = [/\b[A-Z][a-z]+\s+(?:Inc|Corp|LLC|Ltd|Co)\b/g, /\b[A-Z]{2,}\b/g];
      companyPatterns.forEach(pattern => {
        const matches = text.match(pattern) || [];
        matches.forEach(match => {
          entities.push({ text: match, type: "ORG" });
        });
      });
      
      return entities;
    } catch (err) {
      console.log("Entity extraction error:", err.message);
      return [];
    }
  }

  async analyzeMarketTrends(text) {
    try {
      const summary = await this.summarizeText(text, 100);
      const sentiment = await this.analyzeSentiment(text);
      const entities = await this.extractEntities(text);
      
      // Extract key insights using simple patterns
      const insights = [];
      const insightPatterns = [
        /market size.*?\$[\d,.]+ billion/gi,
        /growth rate.*?[\d.]+%/gi,
        /trend.*?(?:increasing|decreasing|stable|growing)/gi
      ];
      
      insightPatterns.forEach(pattern => {
        const matches = text.match(pattern) || [];
        insights.push(...matches);
      });

      return {
        summary,
        sentiment,
        entities,
        keyInsights: insights.slice(0, 5)
      };
    } catch (err) {
      console.log("Market trends analysis error:", err.message);
      return {
        summary: "Analysis failed",
        sentiment: { label: "NEUTRAL", score: 0.5 },
        entities: [],
        keyInsights: []
      };
    }
  }
}

module.exports = { AIAnalyzer };
