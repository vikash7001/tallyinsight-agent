const Service = require('node-windows').Service;
const path = require('path');

const svc = new Service({
  name: 'TallyInsight Agent',
  description: 'Automatically syncs Tally stock to TallyInsight every 15 minutes',
  script: path.join(__dirname, 'runner.js'),
  wait: 2,
  grow: 0.5,
  maxRetries: 10,
  maxRestarts: 10
});

svc.on('install', () => {
  svc.start();
});

svc.install();
