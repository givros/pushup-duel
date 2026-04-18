import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.jsx';
import './styles/global.css';

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
