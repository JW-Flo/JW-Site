// Simple environment setup - no encryption needed for research server
require('dotenv').config();
const express = require('express');
const { setupRoutes } = require('./routes');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5050;

setupRoutes(app);

if (require.main === module) {
  const server = app.listen(PORT, '127.0.0.1', () => {
    console.log(`MCP Server running on http://localhost:${PORT}`);
  });
  
  server.on('error', (err) => {
    console.error('Server error:', err);
  });
  
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
  
  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

module.exports = { app };
