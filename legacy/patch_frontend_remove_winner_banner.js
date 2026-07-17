const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf8');

content = content.replace(`const [showWinnerBanner, setShowWinnerBanner] = useState(false);`, ``);

// And fix the useEffect which sets it
content = content.replace(
  `  useEffect(() => {
    if (gameState?.status === "GameOver") {
      setShowWinnerBanner(true);
      setTimeout(() => {
        setShowWinnerBanner(false);
        setShowStats(true);
      }, 3000);
    } else {
      setShowWinnerBanner(false);
      setShowStats(false);
    }
  }, [gameState?.status]);`,
  `  useEffect(() => {
    if (gameState?.status === "GameOver") {
      setTimeout(() => {
        setShowStats(true);
      }, 3000);
    } else {
      setShowStats(false);
    }
  }, [gameState?.status]);`
);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf8');
