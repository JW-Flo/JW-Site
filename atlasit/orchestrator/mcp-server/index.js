import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as OAuth2Strategy } from "passport-oauth2";
import dotenv from "dotenv";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

dotenv.config();

// --- Authentication Helpers -------------------------------------------------
const BEARER_TOKEN =
  process.env.MCP_BEARER_TOKEN ||
  (process.env.NODE_ENV === "production" ? null : "atlasit-demo-token");
function requireBearerToken(req, res, next) {
  const auth = req.headers["authorization"];
  if (!auth || !auth.startsWith("Bearer ")) {
    console.warn(`[mcp] request ${req.id} rejected: missing bearer token`);
    return res.status(401).json({ error: "Missing or invalid bearer token" });
  }
  if (!BEARER_TOKEN) {
    console.error(`[mcp] request ${req.id} blocked: bearer token not configured`);
    return res.status(503).json({ error: "Bearer token not configured" });
  }
  const provided = Buffer.from(auth.split(" ")[1]);
  const expected = Buffer.from(BEARER_TOKEN);
  if (
    provided.length !== expected.length ||
    !crypto.timingSafeEqual(provided, expected)
  ) {
    console.warn(`[mcp] request ${req.id} rejected: bearer mismatch`);
    return res.status(403).json({ error: "Forbidden" });
  }
  console.info(`[mcp] request ${req.id} authenticated via bearer token`);
  return next();
}

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

// --- SQLite Persistent Storage ---------------------------------------------
let db;
async function initDb() {
  if (db) return db;
  db = await open({
    filename: process.env.MCP_DB_PATH || "./mcp-docs.sqlite",
    driver: sqlite3.Database,
  });
  await db.exec(`CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT,
    text TEXT,
    url TEXT,
    metadata TEXT
  )`);
  await db.exec(`CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    time INTEGER,
    tool TEXT,
    request TEXT,
    response TEXT,
    status INTEGER
  )`);
  const shouldSeed = process.env.MCP_SEED_DOCS !== "false";
  if (shouldSeed) {
    const count = (await db.get("SELECT COUNT(*) AS c FROM documents")).c;
    if (count === 0) {
      await db.run(
        "INSERT INTO documents (id, title, text, url, metadata) VALUES (?, ?, ?, ?, ?)",
        "doc-1",
        "AtlasIT Overview",
        "AtlasIT platform high-level overview document.",
        "https://mcp.atlasit.pro/docs/atlasit-overview",
        JSON.stringify({ source: "demo", category: "overview" })
      );
      await db.run(
        "INSERT INTO documents (id, title, text, url, metadata) VALUES (?, ?, ?, ?, ?)",
        "doc-2",
        "MCP Integration Guide",
        "Guide describing how the MCP server integrates with external tools.",
        "https://mcp.atlasit.pro/docs/mcp-integration",
        JSON.stringify({ source: "demo", category: "integration" })
      );
    }
  }
  return db;
}
const dbPromise = initDb();

// --- Modular Tool API -------------------------------------------------------
const tools = {};
function registerTool(name, handler) {
  tools[name] = handler;
}

registerTool("search", async (req) => {
  const query = (req.body?.query || "").toLowerCase();
  const store = await dbPromise;
  const docs = await store.all(
    "SELECT id, title, url FROM documents WHERE title LIKE ? OR text LIKE ?",
    `%${query}%`,
    `%${query}%`
  );
  return { results: docs };
});

registerTool("fetch", async (req) => {
  const id = req.body?.id;
  if (!id) throw new Error("Missing id");
  const store = await dbPromise;
  const doc = await store.get("SELECT * FROM documents WHERE id = ?", id);
  if (!doc) throw new Error("Not found");
  return {
    id: doc.id,
    title: doc.title,
    text: doc.text,
    url: doc.url,
    metadata: JSON.parse(doc.metadata),
  };
});

// --- Express App ------------------------------------------------------------
const app = express();
const sseClients = new Set();

function broadcastSse(data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of sseClients) {
    res.write(payload);
  }
}

app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  req.id = crypto.randomUUID();
  next();
});

const sessionSecret =
  process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 1000,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

const OAUTH_CONFIG = {
  authorizationURL: process.env.OAUTH_AUTH_URL,
  tokenURL: process.env.OAUTH_TOKEN_URL,
  clientID: process.env.OAUTH_CLIENT_ID,
  clientSecret: process.env.OAUTH_CLIENT_SECRET,
  callbackURL: process.env.OAUTH_CALLBACK_URL,
};
const oauthConfigured =
  OAUTH_CONFIG.authorizationURL &&
  OAUTH_CONFIG.tokenURL &&
  OAUTH_CONFIG.clientID &&
  OAUTH_CONFIG.clientSecret &&
  OAUTH_CONFIG.callbackURL;

if (oauthConfigured) {
  passport.use(
    new OAuth2Strategy(
      OAUTH_CONFIG,
      (accessToken, refreshToken, profile, cb) => {
        console.info("[mcp] OAuth access token issued");
        return cb(null, { accessToken, profile });
      }
    )
  );
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj, done) => done(null, obj));

  app.get("/auth", passport.authenticate("oauth2"));
  app.get(
    "/callback",
    passport.authenticate("oauth2", { failureRedirect: "/" }),
    (req, res) => {
      console.info(`[mcp] OAuth callback success request=${req.id}`);
      res.redirect("/");
    }
  );
}

function requireOAuth(req, res, next) {
  if (!oauthConfigured) return next();
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  console.warn(`[mcp] request ${req.id} rejected: OAuth authentication required`);
  return res.status(401).json({ error: "Authentication required" });
}

app.get("/sse", requireOAuth, requireBearerToken, (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
  sseClients.add(res);
  res.write(`retry: 10000\n\n`);
  broadcastSse({ type: "heartbeat", timestamp: Date.now(), requestId: req.id });

  req.on("close", () => {
    sseClients.delete(res);
    res.end();
  });
});

setInterval(() => {
  if (sseClients.size > 0) {
    broadcastSse({ type: "heartbeat", timestamp: Date.now() });
  }
}, 10000);

app.get("/", (_req, res) => {
  res.send("AtlasIT MCP Server is running.");
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", time: Date.now() });
});

async function invokeTool(name, req, res) {
  const handler = tools[name];
  if (!handler) return res.status(404).json({ error: "Tool not found" });
  const store = await dbPromise;
  try {
    const result = await handler(req);
    await store.run(
      "INSERT INTO logs (time, tool, request, response, status) VALUES (?, ?, ?, ?, ?)",
      Date.now(),
      name,
      JSON.stringify(req.body),
      JSON.stringify(result),
      200
    );
    return res.json({
      content: [
        {
          type: "text",
          text: JSON.stringify(result),
        },
      ],
    });
  } catch (err) {
    await store.run(
      "INSERT INTO logs (time, tool, request, response, status) VALUES (?, ?, ?, ?, ?)",
      Date.now(),
      name,
      JSON.stringify(req.body),
      JSON.stringify({ error: err.message }),
      500
    );
    return res.status(500).json({ error: err.message });
  }
}

app.post(
  "/tool/:name",
  requireOAuth,
  requireBearerToken,
  limiter,
  (req, res) => {
    const name = req.params.name;
    return invokeTool(name, req, res);
  }
);

app.post("/search", requireOAuth, requireBearerToken, limiter, (req, res) => {
  return invokeTool("search", req, res);
});

app.post("/fetch", requireOAuth, requireBearerToken, limiter, (req, res) => {
  return invokeTool("fetch", req, res);
});

app.use((err, _req, res, _next) => {
  console.error("[mcp] Unhandled error", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3000;
dbPromise
  .then(() => {
    app.listen(PORT, () => {
      console.log(`MCP Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize MCP database", error);
    process.exit(1);
  });
