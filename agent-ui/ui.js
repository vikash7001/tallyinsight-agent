import express from 'express';
import open from 'open';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/done', (req, res) => {
  res.json({ ok: true });
  console.log('Provision complete, exiting UI');
  process.exit(0);
});

const PORT = 5050;
app.listen(PORT, () => {
  open(`http://localhost:${PORT}`);
});
