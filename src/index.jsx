
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import AuthWrapper from './components/AuthWrapper';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthWrapper>
      <App />
    </AuthWrapper>
  </React.StrictMode>
);
