require.extensions['.css'] = () => {};
require('tsx/cjs/api');
require('child_process').execSync('npx tsx scripts/tournament.ts', { stdio: 'inherit' });
