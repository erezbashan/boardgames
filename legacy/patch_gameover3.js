const fs = require('fs');
let content = fs.readFileSync('frontend/src/GameOverScreen.tsx', 'utf8');

content = content.replace(
  `import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';`,
  `import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';`
);

fs.writeFileSync('frontend/src/GameOverScreen.tsx', content, 'utf8');
