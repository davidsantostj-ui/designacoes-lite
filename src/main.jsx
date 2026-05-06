import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';
import { escapeHtml } from './utils/textUtils';

const showFatalError = (message) => {
  const rootEl = document.getElementById('root');
  if (!rootEl || rootEl.__fatalShown) return;
  rootEl.__fatalShown = true;
  const safeMessage = escapeHtml(message || 'Recarregue o app ou limpe o cache.');
  rootEl.innerHTML = `
          <div style="height:100%;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;font-family:Inter,system-ui,sans-serif;">
            <div>
              <div style="width:48px;height:48px;border-radius:999px;background:#fee2e2;color:#dc2626;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-weight:700;">!</div>
              <h2 style="font-weight:800;letter-spacing:0.08em;text-transform:uppercase;font-size:12px;">Algo deu errado</h2>
              <p style="color:#64748b;font-size:12px;margin-top:8px;">${safeMessage}</p>
              <button style="margin-top:16px;padding:8px 12px;border-radius:12px;background:#0f172a;color:#fff;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;" onclick="location.reload()">Recarregar</button>
            </div>
          </div>
        `;
};

window.addEventListener('error', (ev) => {
  try {
    console.error('Global error event', ev.error || ev.message || ev);
  } catch (e) {
    console.error('Error logging failed', e);
  }
  const msg = (ev && (ev.error?.message || ev.message)) || 'Falha ao iniciar o app.';
  const stack = ev && ev.error && ev.error.stack ? String(ev.error.stack).slice(0, 1000) : '';
  showFatalError(`${msg}${stack ? '\n\n' + stack : ''}`);
});

window.addEventListener('unhandledrejection', (ev) => {
  try {
    console.error('Unhandled rejection', ev.reason);
  } catch (e) {
    console.error('Error logging failed', e);
  }
  const msg = ev?.reason?.message || String(ev?.reason || 'Falha ao iniciar o app.');
  const stack = ev?.reason?.stack ? String(ev.reason.stack).slice(0, 1000) : '';
  showFatalError(`${msg}${stack ? '\n\n' + stack : ''}`);
});

const root = ReactDOM.createRoot(document.getElementById('root'));
try {
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
} catch (err) {
  console.error('Error during initial render', err);
  showFatalError((err && err.message) || 'Erro ao renderizar a aplicação.');
}

const APP_VERSION = '5.1.1';
window.__APP_VERSION__ = APP_VERSION;


