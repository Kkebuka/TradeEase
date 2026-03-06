import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './styles/main.css';
import './styles/components.css';
import './styles/animations.css';

registerSW({
  immediate: true,
  onRegisterError(error) {
    // Helps diagnose why precache is not created in some local setups.
    console.error('TradeEase SW register error:', error);
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
