import { Link, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AuthButton } from './components/AuthButton';
import Start from './routes/Start';
import Practice from './routes/Practice';
import Summary from './routes/Summary';

export default function App() {
  return (
    <AuthProvider>
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
          <AuthButton />
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Start />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/summary/:sessionId" element={<Summary />} />
            <Route path="*" element={<div style={{ padding: 24 }}><Link to="/">Back to start</Link></div>} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

// cleaned duplicate template
