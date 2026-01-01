const Service = require('node-windows').Service;
const path = require('path');

const svc = new Service({
  name: 'TallyInsight Agent',
  script: path.join(__dirname, 'runner.js')
});

svc.on('uninstall', () => {
  console.log('TallyInsight Agent service uninstalled');
});

svc.uninstall();
