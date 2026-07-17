const fs = require('fs');
const glob = require('glob');

function fixFiles(pattern) {
  const files = glob.sync(pattern);
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    const oldContent = content;
    // Replace ctx.log(`👑 Player...`) -> ctx.log(`Player...`)
    content = content.replace(/ctx\.log\(\`(👑|☠️|🚀|🐺|🧒|🪡|🕸️|🦖|🦎|👾|🤖|🛡️|💨|🔋|💥|🦇|🌞)\s*/g, 'ctx.log(`');
    // Replace game.logs.push(`👑 Player...`) -> game.logs.push(`Player...`)
    content = content.replace(/game\.logs\.push\(\`(👑|☠️|🚀|🐺|🧒|🪡|🕸️|🦖|🦎|👾|🤖|🛡️|💨|🔋|💥|🦇|🌞)\s*/g, 'game.logs.push(`');
    
    if (content !== oldContent) {
      fs.writeFileSync(file, content);
      console.log('Fixed', file);
    }
  }
}

fixFiles('shared/src/cards/*.ts');
fixFiles('frontend/src/engine/gameEngine.ts');
