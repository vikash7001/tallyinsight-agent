import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { XMLParser } from 'fast-xml-parser';

/* =========================
   PATH SETUP
========================= */
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEVICE_FILE = path.join(__dirname, 'device.json');

/* =========================
   TALLY CONFIG
========================= */
const TALLY_HOST = 'localhost';
const TALLY_PORT = 9000;

/* =========================
   BACKEND CONFIG
========================= */
const BACKEND_HOST = 'tallyinsight-backend-1.onrender.com';
const STOCK_PATH = '/agent/stock';

/* =========================
   TALLY XML REQUEST
========================= */
const TALLY_XML = `
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>Stock Items</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="Stock Items">
            <TYPE>StockItem</TYPE>
            <FETCH>GUID,NAME,BASEUNITS,CLOSINGBALANCE</FETCH>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>
`;

/* =========================
   LOAD DEVICE (STRICT)
========================= */
function loadDevice() {
  if (!fs.existsSync(DEVICE_FILE)) {
    throw new Error('device.json not found. Agent is not provisioned.');
  }

  const device = JSON.parse(fs.readFileSync(DEVICE_FILE, 'utf8'));

  if (!device.device_id || !device.device_token || !device.company_id) {
    throw new Error('Invalid device.json');
  }

  return device;
}

/* =========================
   PULL FROM TALLY
========================= */
function pullFromTally() {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: TALLY_HOST,
        port: TALLY_PORT,
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml',
          'Content-Length': Buffer.byteLength(TALLY_XML)
        }
      },
      res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => resolve(data));
      }
    );

    req.on('error', reject);
    req.write(TALLY_XML);
    req.end();
  });
}

/* =========================
   PARSE STOCK ITEMS
========================= */
function parseStockItems(xml) {
  const parser = new XMLParser({ ignoreAttributes: false });
  const json = parser.parse(xml);

  const items =
    json?.ENVELOPE?.BODY?.DATA?.COLLECTION?.STOCKITEM || [];

  const list = Array.isArray(items) ? items : [items];

  return list
    .map(i => {
      const guid = i?.GUID?.['#text'] || null;
      const name =
        i?.['LANGUAGENAME.LIST']?.['NAME.LIST']?.NAME || null;
      const uom = i?.BASEUNITS?.['#text'] || null;
      const qtyRaw = i?.CLOSINGBALANCE?.['#text'] || '0';
      const qty = Number(String(qtyRaw).replace(/[^\d.-]/g, ''));

      return {
        tally_guid: guid,
        item_name: name,
        uom,
        quantity: qty
      };
    })
    .filter(i => i.tally_guid && i.item_name);
}

/* =========================
   PUSH TO BACKEND
========================= */
function pushToBackend(items, device) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ items });

    const req = https.request(
      {
        hostname: BACKEND_HOST,
        path: STOCK_PATH,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          'x-device-id': device.device_id,
          'x-device-token': device.device_token
        }
      },
      res => {
        let body = '';
        res.on('data', chunk => (body += chunk));
        res.on('end', () => resolve(body));
      }
    );

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/* =========================
   ONE FULL SYNC
========================= */
async function runSync() {
  const device = loadDevice();

  const xml = await pullFromTally();
  const items = parseStockItems(xml);

  if (items.length === 0) return;

  await pushToBackend(items, device);
}

/* =========================
   ENTRY POINT
========================= */
if (process.argv[1] === url.fileURLToPath(import.meta.url)) {
  runSync().catch(err => {
    console.error('Agent failed:', err.message);
    process.exit(1);
  });
}

export default runSync;
