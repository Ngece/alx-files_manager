const express = require('express');

const app = express();

// Set port based on the environment variable or default to 5000
const port = process.env.PORT || 5000;

// Load all routes from the file routes/index.js
const routes = require('./routes/index');

app.use('/', routes);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
