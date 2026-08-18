import { useNavigate } from 'react-router-dom';

export function GameSelector() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: '40px', color: 'white', backgroundColor: '#1a1a2e', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '40px' }}>Erez Boardgames</h1>
      <div style={{ display: 'flex', gap: '20px' }}>
        <div 
          onClick={() => navigate('/flips')}
          style={{ background: 'rgba(255,255,255,0.1)', padding: '30px', borderRadius: '16px', cursor: 'pointer', textAlign: 'center', minWidth: '200px' }}
        >
          <h2>Flips</h2>
          <p>A simple test game</p>
        </div>
        <div 
          onClick={() => navigate('/king-of-tokyo')}
          style={{ background: 'rgba(255,255,255,0.1)', padding: '30px', borderRadius: '16px', cursor: 'pointer', textAlign: 'center', minWidth: '200px' }}
        >
          <h2>King of Tokyo</h2>
          <p>The main event</p>
        </div>
      </div>
    </div>
  );
}
