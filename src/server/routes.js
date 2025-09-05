const { handlers } = require('./handlers');

function setupRoutes(app) {
  // Add logging middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });

  app.get('/health', (req, res) => {
    console.log('Health endpoint called');
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  app.post('/mcp', async (req, res) => {
    const { step, context, ...accumulatedData } = req.body;
    console.log(`MCP endpoint called - Processing step: ${step}`);

    if (!handlers[step]) {
      return res.json({
        result: null,
        provider: "mcp-server",
        message: `Unknown step: ${step}. Available steps: ${Object.keys(handlers).join(', ')}`
      });
    }

    try {
      const result = await handlers[step](context, accumulatedData);
      console.log(`Step ${step} completed successfully`);
      
      // Remove any error fields from result if present
      if (result && typeof result === "object" && "error" in result) {
        const cleanResult = { ...result };
        delete cleanResult.error;
        res.json(cleanResult);
      } else {
        res.json(result);
      }
    } catch (err) {
      console.error(`Step ${step} failed:`, err.message);
      // Graceful fallback: always return a default output, never error
      res.json({
        result: null,
        provider: "mcp-server",
        message: `Step ${step} failed. Fallback: No output generated.`,
        error: err.message
      });
    }
  });
  
  // Catch-all error handler
  app.use((err, req, res) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });
}

module.exports = { setupRoutes };
