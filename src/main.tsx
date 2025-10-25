import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { SoundProvider } from './contexts/SoundContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/simple-math">
      <SoundProvider>
        <App />
      </SoundProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
