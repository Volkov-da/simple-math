import { Link, Route, Routes } from 'react-router-dom';
import Start from './routes/Start';
import Practice from './routes/Practice';
import Summary from './routes/Summary';
import Settings from './routes/Settings';
import Statistics from './routes/Statistics';

export default function App() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <header style={{ 
        padding: '16px 24px', 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e9ecef',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Link to="/" style={{ textDecoration: 'none', color: '#333', fontSize: '20px', fontWeight: 'bold' }}>
          Math Practice
        </Link>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Start />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/summary/:sessionId" element={<Summary />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/statistics" element={<Statistics />} />
        </Routes>
      </main>
    </div>
  );
}
