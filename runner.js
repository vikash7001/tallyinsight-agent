import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import url from 'url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================
   CONFIG
========================= */
const AGENT_PATH = path.join(__dirname, 'agent.js');
const INTERVAL_MS = 15 * 60 * 1000;

const LOG_DIR = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'agent.log');

/* =========================
   SAFE LOGGER
========================= */
function ensureLogFile() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }

  if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, '');
  }
}

function log(message) {
  try {
    ensureLogFile();
    const line = `[${new Date().toISOString()}] ${message}\n`;
    fs.appendFileSync(LOG_FILE, line);
  } catch {
    // NEVER crash the service because of logging
  }
}

/* =========================
   RUN AGENT
========================= */
function runAgent() {
  log('Starting stock sync');

  exec(`node "${AGENT_PATH}"`, (error, stdout, stderr) => {
    if (error) {
      log(`Agent error: ${error.message}`);
      return;
    }

    if (stderr) {
      log(`Agent stderr: ${stderr}`);
    }

    log('Stock sync completed');
  });
}

/* =========================
   SCHEDULER
========================= */

// run once immediately when service starts
runAgent();

// then every 15 minutes
setInterval(runAgent, INTERVAL_MS);
