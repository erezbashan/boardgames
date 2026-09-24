const child_process = require('child_process');
child_process.execSync('npm run build', { cwd: 'deployments/backend' });
console.log('Built backend');
