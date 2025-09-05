const express = require("express");
const app = express();
app.use(express.json());

const PORT = 5050;

app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.post("/test", (req, res) => {
  res.json({ message: "Test endpoint working", data: req.body });
});

app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
