import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';
import { TypographyProvider } from './context/TypographyContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TypographyProvider>
      <App />
    </TypographyProvider>
  </React.StrictMode>
);
