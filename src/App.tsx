import { Link, Route, Routes } from 'react-router-dom';
import Start from './routes/Start';
import Practice from './routes/Practice';
import Summary from './routes/Summary';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Start />} />
      <Route path="/practice" element={<Practice />} />
      <Route path="/summary/:sessionId" element={<Summary />} />
      <Route path="*" element={<div style={{ padding: 24 }}><Link to="/">Back to start</Link></div>} />
    </Routes>
  );
}

// cleaned duplicate template
