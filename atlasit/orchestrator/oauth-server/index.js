import express from "express";
import bodyParser from "body-parser";
import OAuth2Server from "oauth2-server";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const Request = OAuth2Server.Request;
const Response = OAuth2Server.Response;

const oauth = new OAuth2Server({
  model: {
    getAccessToken: async (token) => ({
      accessToken: token,
      accessTokenExpiresAt: new Date(Date.now() + 3600 * 1000),
      client: { id: "atlasit-client" },
      user: { id: "atlasit-user" },
    }),
    getClient: async (clientId, clientSecret) => ({
      id: clientId,
      grants: ["authorization_code", "refresh_token"],
      redirectUris: ["http://localhost:3000/callback"],
    }),
    saveAuthorizationCode: async (code, client, user) => ({
      authorizationCode: code.authorizationCode,
      expiresAt: code.expiresAt,
      redirectUri: code.redirectUri,
      client,
      user,
    }),
    getAuthorizationCode: async (code) => ({
      authorizationCode: code,
      expiresAt: new Date(Date.now() + 600 * 1000),
      redirectUri: "http://localhost:3000/callback",
      client: { id: "atlasit-client" },
      user: { id: "atlasit-user" },
    }),
    revokeAuthorizationCode: async () => true,
    saveToken: async (token, client, user) => ({
      accessToken: token.accessToken,
      accessTokenExpiresAt: token.accessTokenExpiresAt,
      client,
      user,
    }),
    getUser: async (username, password) => ({ id: "atlasit-user" }),
  },
});

app.post("/oauth/token", (req, res) => {
  const request = new Request(req);
  const response = new Response(res);
  oauth
    .token(request, response)
    .then((token) => {
      res.json(token);
    })
    .catch((err) => {
      res.status(err.code || 500).json(err);
    });
});

app.get("/secure", (req, res) => {
  const request = new Request(req);
  const response = new Response(res);
  oauth
    .authenticate(request, response)
    .then(() => {
      res.json({ message: "Secure data" });
    })
    .catch((err) => {
      res.status(err.code || 500).json(err);
    });
});

app.listen(4000, () => {
  console.log("OAuth2 server running on http://localhost:4000");
});
