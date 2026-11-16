import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';
import { TypographyProvider } from './context/TypographyContext';
import { PinAuthGate } from './components/PinAuthGate';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TypographyProvider>
      <PinAuthGate>
        <App />
      </PinAuthGate>
    </TypographyProvider>
  </React.StrictMode>
);
