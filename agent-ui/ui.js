import express from 'express';
import open from 'open';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/done', (req, res) => {
  const device = req.body;

  if (!device.device_id || !device.device_token || !device.company_id) {
    return res.status(400).json({ error: 'Invalid device payload' });
  }

  const devicePath = path.join(__dirname, '../device.json');

  fs.writeFileSync(
    devicePath,
    JSON.stringify(device, null, 2),
    'utf8'
  );

  // Install Windows service
  exec('node service.cjs', { cwd: path.join(__dirname, '..') }, err => {
    if (err) {
      console.error('Service install failed:', err);
    }
  });

  res.json({ ok: true });
  process.exit(0);
});

const PORT = 5050;
app.listen(PORT, () => {
  console.log(`Agent UI running on http://localhost:${PORT}`);
  open(`http://localhost:${PORT}`);
});
