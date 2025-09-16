import { beforeAll, afterAll, describe, it, expect } from "vitest";
import axios from "axios";
import EventSource from "eventsource";
import { spawn } from "child_process";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const DEFAULT_PORT = Number(process.env.TEST_MCP_PORT || 3100);
const TOKEN = process.env.TEST_MCP_TOKEN || "atlasit-demo-token";

function tempDbPath(name) {
  return path.join(os.tmpdir(), `${name}-${Date.now()}.sqlite`);
}

async function waitForHealth(baseUrl, retries = 12) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await axios.get(`${baseUrl}/health`);
      if (res.status === 200) return;
    } catch (err) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error(`MCP server at ${baseUrl} did not become healthy in time`);
}

function startServer(envOverrides = {}) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const cwd = path.resolve(__dirname, "..");
  const port = envOverrides.PORT || DEFAULT_PORT;
  const child = spawn("node", ["index.js"], {
    cwd,
    env: {
      ...process.env,
      PORT: String(port),
      MCP_BEARER_TOKEN: TOKEN,
      MCP_DB_PATH: envOverrides.MCP_DB_PATH || tempDbPath("mcp-test"),
      MCP_SEED_DOCS: envOverrides.MCP_SEED_DOCS ?? "true",
      ...envOverrides,
    },
    stdio: "inherit",
  });
  const baseUrl = `http://localhost:${port}`;
  return { child, baseUrl };
}

function stopServer(child) {
  return new Promise((resolve) => {
    if (!child) return resolve();
    child.once("exit", () => resolve());
    child.kill();
  });
}

function authHeaders(token = TOKEN) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

describe("MCP Server Endpoints (no OAuth)", () => {
  let ctx;
  let baseUrl;

  beforeAll(async () => {
    ctx = startServer();
    baseUrl = ctx.baseUrl;
    await waitForHealth(baseUrl);
  }, 30_000);

  afterAll(async () => {
    await stopServer(ctx.child);
  });

  it("should return health status", async () => {
    const res = await axios.get(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    expect(res.data.status).toBe("ok");
  });

  it("should search documents", async () => {
    const res = await axios.post(`${baseUrl}/search`, { query: "atlas" }, { headers: authHeaders() });
    expect(res.status).toBe(200);
    expect(res.data.content[0].type).toBe("text");
    const results = JSON.parse(res.data.content[0].text).results;
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });

  it("should fetch a document", async () => {
    const res = await axios.post(`${baseUrl}/fetch`, { id: "doc-1" }, { headers: authHeaders() });
    expect(res.status).toBe(200);
    expect(res.data.content[0].type).toBe("text");
    const doc = JSON.parse(res.data.content[0].text);
    expect(doc.id).toBe("doc-1");
  });

  it("should invoke generic tool endpoint", async () => {
    const res = await axios.post(`${baseUrl}/tool/search`, { query: "integration" }, { headers: authHeaders() });
    expect(res.status).toBe(200);
    const payload = JSON.parse(res.data.content[0].text);
    expect(Array.isArray(payload.results)).toBe(true);
  });

  it("should reject requests without bearer token", async () => {
    await expect(axios.post(`${baseUrl}/search`, { query: "atlas" })).rejects.toMatchObject({
      response: { status: 401 },
    });
  });

  it("should reject requests with invalid bearer token", async () => {
    await expect(
      axios.post(`${baseUrl}/search`, { query: "atlas" }, { headers: authHeaders("invalid-token") })
    ).rejects.toMatchObject({ response: { status: 403 } });
  });

  it("should stream heartbeat events", async () => {
    await new Promise((resolve, reject) => {
      const es = new EventSource(`${baseUrl}/sse`, { headers: authHeaders() });
      const timer = setTimeout(() => {
        es.close();
        reject(new Error("SSE heartbeat timeout"));
      }, 5000);
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "heartbeat") {
            clearTimeout(timer);
            es.close();
            resolve();
          }
        } catch (err) {
          clearTimeout(timer);
          es.close();
          reject(err);
        }
      };
      es.onerror = (err) => {
        clearTimeout(timer);
        es.close();
        reject(err);
      };
    });
  });
});

describe("MCP Server OAuth enforcement", () => {
  let ctx;
  let baseUrl;
  const oauthPort = DEFAULT_PORT + 1;

  beforeAll(async () => {
    ctx = startServer({
      PORT: oauthPort,
      OAUTH_AUTH_URL: "https://auth.example.com/oauth2/authorize",
      OAUTH_TOKEN_URL: "https://auth.example.com/oauth2/token",
      OAUTH_CLIENT_ID: "demo-client",
      OAUTH_CLIENT_SECRET: "demo-secret",
      OAUTH_CALLBACK_URL: "https://example.com/callback",
    });
    baseUrl = ctx.baseUrl;
    await waitForHealth(baseUrl);
  }, 30_000);

  afterAll(async () => {
    await stopServer(ctx.child);
  });

  it("should require OAuth authentication when configured", async () => {
    await expect(
      axios.post(`${baseUrl}/search`, { query: "atlas" }, { headers: authHeaders() })
    ).rejects.toMatchObject({ response: { status: 401 } });
  });
});
