const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>AtlasIT Platform</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        nav { background: #007bff; color: white; padding: 10px; }
        nav a { color: white; margin: 0 10px; text-decoration: none; }
        nav a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <nav>
        <a href="/">Home</a>
        <a href="/team/jw">Team JW</a>
        <a href="/team/jw/immersive">Immersive</a>
      </nav>
      <h1>AtlasIT Platform - Coming Soon</h1>
      <p>Powering Modern IT Solutions</p>
    </body>
    </html>
  `);
});

app.get('/team/jw', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>JW Profile - AtlasIT</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        nav { background: #007bff; color: white; padding: 10px; }
        nav a { color: white; margin: 0 10px; text-decoration: none; }
        nav a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <nav>
        <a href="/">Home</a>
        <a href="/team/jw">Team JW</a>
        <a href="/team/jw/immersive">Immersive</a>
      </nav>
      <h1>JW Profile</h1>
      <p>Joseph Whittle - Software Engineer</p>
      <a href="/team/jw/immersive">View Immersive Experience</a>
    </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`AtlasIT Platform running on port ${port}`);
});
