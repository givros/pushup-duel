import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.jsx';
import { applyDocumentLanguage } from './i18n/language.js';
import './styles/global.css';

applyDocumentLanguage();

registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) {
      return;
    }

    registration.update();
    window.setInterval(() => {
      registration.update();
    }, 15 * 60 * 1000);
  },
  onRegisterError(error) {
    console.error('PWA registration failed', error);
  }
});

createRoot(document.getElementById('root')).render(<App />);
