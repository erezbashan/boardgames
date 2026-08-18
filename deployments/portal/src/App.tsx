import { Routes, Route } from 'react-router-dom';
import { GameSelector } from './routes/GameSelector';
import { GameLobbyWrapper } from './routes/GameLobbyWrapper';
import { ActiveGameWrapper } from './routes/ActiveGameWrapper';
import { SimulationWrapper } from './routes/SimulationWrapper';

function App() {
  return (
    <Routes>
      <Route path="/" element={<GameSelector />} />
      <Route path="/:gameType" element={<GameLobbyWrapper />} />
      <Route path="/:gameType/:gameId" element={<ActiveGameWrapper />} />
      <Route path="/simulation/head-to-head/:gameType" element={<SimulationWrapper />} />
      <Route path="/simulation/genetic/:gameType" element={<SimulationWrapper />} />
      <Route path="/simulation/genetic/:gameType/:simId" element={<SimulationWrapper />} />
      <Route path="/simulation/qlearning/:gameType" element={<SimulationWrapper />} />
      <Route path="/simulation/qlearning/:gameType/:simId" element={<SimulationWrapper />} />
      <Route path="/simulation/tournament/:gameType" element={<SimulationWrapper />} />
      <Route path="/simulation/tournament/:gameType/:simId" element={<SimulationWrapper />} />
    </Routes>
  );
}

export default App;
