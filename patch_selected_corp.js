const fs = require('fs');
const file = 'games/acquire/src/components/AcquireBoard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /\{selectedCorp && \([\s\S]*?<h3 className=\{`corp-name \$\{selectedCorp\.toLowerCase\(\)\}`\} style=\{\{ marginBottom: '1rem', display: 'inline-block' \}\}>\{selectedCorp\} Details<\/h3>/,
  `{selectedCorp && (
          <Modal isOpen={true} title={\`\${selectedCorp} Details\`} onClose={() => setSelectedCorp(null)}>
            <div>`
);

content = content.replace(
  /<button onClick=\{\(\) => setSelectedCorp\(null\)\} style=\{\{ marginTop: '1\.5rem', width: '100%' \}\}>Close<\/button>\n            <\/div>\n          <\/div>\n        \)\}/,
  '<button className="btn primary" onClick={() => setSelectedCorp(null)} style={{ marginTop: \'1.5rem\', width: \'100%\' }}>Close</button>\n            </div>\n          </Modal>\n        )}'
);

fs.writeFileSync(file, content);
