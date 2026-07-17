const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf8');

content = content.replace(
  `  useEffect(() => {
    if (gameState?.status === "GameOver") {
      setTimeout(() => {
        setShowStats(true);
      }, 3000);
    } else {
      setShowStats(false);
    }
  }, [gameState?.status]);`,
  `  useEffect(() => {
    let timerId: any;
    if (gameState?.status === "GameOver") {
      timerId = setTimeout(() => {
        setShowStats(true);
      }, 4000);
    } else {
      setShowStats(false);
    }
    return () => clearTimeout(timerId);
  }, [gameState?.status]);`
);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf8');
