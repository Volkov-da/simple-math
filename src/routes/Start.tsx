import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function Start() {
  const navigate = useNavigate();
  const [lengthSec, setLengthSec] = useState<30 | 60 | 120>(60);
  const [ops, setOps] = useState<{ [k: string]: boolean }>({
    addition: true,
    subtraction: true,
    multiplication: true,
    division: true,
    percent: true,
  });
  const [digits, setDigits] = useState<Record<string, number>>({
    addition: 2,
    subtraction: 2,
    multiplication: 1,
    division: 1,
    percent: 2, // controls number of digits for the base ("of" number)
  });

  useEffect(() => {
    const loadSettings = () => {
      try {
        // Load from localStorage
        const saved = localStorage.getItem('ops');
        if (saved) setOps(JSON.parse(saved));
        const savedDigits = localStorage.getItem('digits');
        if (savedDigits) setDigits(JSON.parse(savedDigits));
        const savedLength = localStorage.getItem('lengthSec');
        if (savedLength) setLengthSec(Number(savedLength) as 30 | 60 | 120);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  const start = () => {
    try {
      // Save to localStorage
      localStorage.setItem('lengthSec', String(lengthSec));
      localStorage.setItem('ops', JSON.stringify(ops));
      localStorage.setItem('digits', JSON.stringify(digits));
      localStorage.setItem('lastSettings', JSON.stringify({ lengthSec, ops, digits }));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
    navigate('/practice');
  };

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1>Math Practice</h1>
      <p>Quick timed arithmetic practice. Keyboard only, instant feedback.</p>
      <div style={{ marginTop: 16 }}>
        <label>
          Session length:
          <select value={lengthSec} onChange={e => setLengthSec(Number(e.target.value) as 30|60|120)} style={{ marginLeft: 8 }}>
            <option value={30}>30s</option>
            <option value={60}>60s</option>
            <option value={120}>120s</option>
          </select>
        </label>
      </div>
      <div style={{ marginTop: 16 }}>
        <fieldset>
          <legend>Operations</legend>
          {(['addition','subtraction','multiplication','division','percent'] as const).map(k => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', marginRight: 12 }}>
                <input type="checkbox" checked={!!ops[k]} onChange={e => setOps({ ...ops, [k]: e.target.checked })} />
                <span style={{ marginLeft: 6, textTransform: 'capitalize' }}>{k}</span>
              </label>
              <label style={{ marginLeft: 12, opacity: ops[k] ? 1 : 0.5 }}>
                {k === 'percent' ? 'base digits:' : 'digits:'}
                <select
                  value={digits[k]}
                  onChange={e => setDigits({ ...digits, [k]: Number(e.target.value) })}
                  disabled={!ops[k]}
                  style={{ marginLeft: 6 }}
                >
                  {[1,2,3,4].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </label>
            </div>
          ))}
        </fieldset>
      </div>
      <div style={{ marginTop: 16 }}>
        <button onClick={start} style={{ fontSize: 18, padding: '8px 16px' }}>Start</button>
      </div>
    </div>
  );
}


