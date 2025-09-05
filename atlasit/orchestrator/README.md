# AtlasIT Orchestrator Service

The Orchestrator Service is the central MCP-based workflow orchestration system for the AtlasIT platform. It provides comprehensive workflow management, execution tracking, and API orchestration capabilities.

## Features

- **Workflow Management**: Create, read, update, and delete workflows with complex step definitions
- **Execution Engine**: Execute workflows with input/output handling and status tracking
- **MCP Integration**: Model Context Protocol support for AI-powered workflow orchestration
- **Rate Limiting**: Built-in rate limiting with Cloudflare KV storage
- **API Authentication**: Secure API key-based authentication
- **Database Persistence**: Cloudflare D1 for reliable data storage
- **Logging**: Comprehensive logging with execution tracking
- **Health Monitoring**: Built-in health check endpoints

## Architecture

The service is built with:
- **Hono**: Lightweight web framework for Cloudflare Workers
- **TypeScript**: Full type safety and modern JavaScript features
- **Zod**: Runtime type validation for API requests
- **Cloudflare D1**: SQLite-based database for data persistence
- **Cloudflare KV**: Key-value storage for caching and logs
- **Cloudflare Workers**: Serverless execution environment

## API Endpoints

### Health Check
- `GET /health` - Service health status

### Workflows
- `POST /api/workflows` - Create a new workflow
- `GET /api/workflows` - List workflows with optional filtering
- `GET /api/workflows/:id` - Get specific workflow
- `PUT /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow

### Executions
- `POST /api/executions` - Execute a workflow
- `GET /api/executions` - List executions with optional filtering
- `GET /api/executions/:id` - Get specific execution
- `POST /api/executions/:id/cancel` - Cancel running execution

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Build the Service**
   ```bash
   npm run build
   ```

3. **Configure Environment**
   - Update `wrangler.toml` with your Cloudflare resource IDs
   - Set API keys and rate limiting configuration

4. **Database Setup**
   - Run the migration files in order:
     - `migrations/001_create_workflows_table.sql`
     - `migrations/002_create_executions_table.sql`

5. **Deploy**
   ```bash
   npx wrangler deploy
   ```

## Development

### Local Development
```bash
# Install dependencies
npm install

# Build for development
npm run build

# Start local development server
npx wrangler dev
```

### Testing
```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Configuration

### Environment Variables
- `API_ALLOWED_KEYS`: Comma-separated list of valid API keys
- `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window (default: 100)
- `RATE_LIMIT_WINDOW_SECONDS`: Rate limit window in seconds (default: 60)

### Database Schema

#### Workflows Table
```sql
CREATE TABLE workflows (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  steps TEXT NOT NULL, -- JSON array of workflow steps
  triggers TEXT, -- JSON array of trigger types
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

#### Executions Table
```sql
CREATE TABLE executions (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  inputs TEXT NOT NULL, -- JSON object of execution inputs
  outputs TEXT, -- JSON object of execution outputs
  error TEXT, -- Error message if execution failed
  trigger TEXT, -- Trigger that initiated the execution
  started_at TEXT NOT NULL,
  completed_at TEXT, -- Completion timestamp
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (workflow_id) REFERENCES workflows(id)
);
```

## Workflow Definition

Workflows are defined as JSON objects with the following structure:

```json
{
  "tenantId": "tenant-123",
  "name": "Data Processing Pipeline",
  "description": "Process and analyze incoming data",
  "steps": [
    {
      "id": "step-1",
      "type": "http-request",
      "config": {
        "url": "https://api.example.com/data",
        "method": "GET"
      },
      "order": 1
    },
    {
      "id": "step-2",
      "type": "transform",
      "config": {
        "operation": "filter",
        "field": "status",
        "value": "active"
      },
      "order": 2
    }
  ],
  "triggers": ["webhook", "schedule"]
}
```

## Error Handling

The service uses consistent error codes:
- `WORKFLOW-001`: Missing required fields
- `WORKFLOW-002`: Workflow not found
- `WORKFLOW-003`: Invalid workflow data
- `EXECUTION-001`: Execution creation failed
- `EXECUTION-002`: Execution not found
- `EXECUTION-003`: Invalid execution data

## Security

- API key authentication required for all endpoints
- Rate limiting to prevent abuse
- Input validation with Zod schemas
- Secure error messages (no sensitive data leakage)

## Monitoring

- Health check endpoint at `/health`
- Comprehensive logging with request IDs
- Execution tracking with detailed logs
- Performance metrics collection

## Contributing

1. Follow TypeScript best practices
2. Add tests for new features
3. Update documentation
4. Use conventional commit messages
5. Ensure all tests pass before submitting PR

## License

This project is part of the AtlasIT platform and follows the same licensing terms.
