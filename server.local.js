const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Get all HTML files and create routes without .html extension
const htmlFiles = fs.readdirSync(__dirname)
  .filter(file => file.endsWith('.html') && file !== 'index.html')
  .map(file => file.replace('.html', ''));

// Route for the home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Create routes for each HTML file (without .html extension)
// These routes must be defined BEFORE static middleware
htmlFiles.forEach(routeName => {
  app.get(`/${routeName}`, (req, res) => {
    const filePath = path.join(__dirname, `${routeName}.html`);
    console.log(`[ROUTE] Matched: GET /${routeName} -> serving ${filePath}`);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      console.log(`[ERROR] File not found: ${filePath}`);
      res.status(404).sendFile(path.join(__dirname, 'page-not-found.html'));
    }
  });
});

// Serve static files from assets directory
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Serve other static files (like favicon.ico, etc.) but NOT routes
app.use((req, res, next) => {
  // Skip routes that don't have file extensions (these are handled by routes above)
  if (!req.path.includes('.')) {
    return next();
  }
  
  const filePath = path.join(__dirname, req.path);
  
  // Skip HTML files - routes handle those
  if (req.path.endsWith('.html')) {
    return next();
  }
  
  // For other files, check if they exist and serve them
  if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
    res.sendFile(filePath);
  } else {
    next();
  }
});

// Handle 404 for undefined routes (must be last)
app.use((req, res) => {
  console.log(`[404] Route not found: ${req.method} ${req.path}`);
  res.status(404).sendFile(path.join(__dirname, 'page-not-found.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`\n=== Server Started ===`);
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Open your browser and navigate to http://localhost:${PORT}`);
  console.log(`\nRegistered routes:`);
  console.log(`  GET /`);
  htmlFiles.forEach(route => console.log(`  GET /${route}`));
  console.log(`\nTotal routes: ${htmlFiles.length + 1}`);
  console.log(`=====================\n`);
});

