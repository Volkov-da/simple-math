import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function Start() {
  const navigate = useNavigate();
  const [lengthSec, setLengthSec] = useState<30 | 60 | 120>(60);

  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedLength = localStorage.getItem('lengthSec');
        if (savedLength) setLengthSec(Number(savedLength) as 30 | 60 | 120);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  const start = () => {
    // Ensure default settings are saved if they don't exist
    try {
      if (!localStorage.getItem('ops')) {
        localStorage.setItem('ops', JSON.stringify({
          addition: true,
          subtraction: true,
          multiplication: true,
          division: true,
          percent: true,
        }));
      }
      if (!localStorage.getItem('digits')) {
        localStorage.setItem('digits', JSON.stringify({
          addition: 2,
          subtraction: 2,
          multiplication: 1,
          division: 1,
          percent: 2,
        }));
      }
      if (!localStorage.getItem('lengthSec')) {
        localStorage.setItem('lengthSec', String(lengthSec));
      }
    } catch (error) {
      console.error('Error saving default settings:', error);
    }
    navigate('/practice');
  };

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Math Practice</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link 
            to="/statistics" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              textDecoration: 'none', 
              color: '#666',
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid #dee2e6',
              backgroundColor: '#f8f9fa'
            }}
            title="Statistics"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18"/>
              <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
            </svg>
          </Link>
          <Link 
            to="/settings" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              textDecoration: 'none', 
              color: '#666',
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid #dee2e6',
              backgroundColor: '#f8f9fa'
            }}
            title="Settings"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </Link>
        </div>
      </div>
      <p>Quick timed arithmetic practice. Keyboard only, instant feedback.</p>
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <button onClick={start} style={{ fontSize: 24, padding: '16px 32px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Start Practice
        </button>
      </div>
    </div>
  );
}


