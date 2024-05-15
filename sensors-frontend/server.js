import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const app = express();
const port = process.env.PORT || 8000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// All other routes should serve the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
