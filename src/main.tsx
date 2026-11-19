import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { I18nProvider } from './lib/i18n.tsx';
import { ThemeProvider } from './lib/theme.tsx';

// Google Maps Platform Demo Key Quota Defense (Tier 1)
(window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
  window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
};
const origConsoleError = console.error;
const origConsoleWarn = console.warn;
console.error = (...args: unknown[]) => {
  const msg = args.map((a) => String(a)).join(' ');
  const isMapIdFallbackNotice =
    msg.includes('Unable to fetch configuration for mapId') ||
    (msg.includes('Advanced Markers') &&
      (msg.includes('Map ID') ||
        msg.includes('identifikator') ||
        msg.includes('идентификатор')));
  if (isMapIdFallbackNotice) {
    window.dispatchEvent(new CustomEvent('gmp-mapid-unavailable'));
    origConsoleWarn.apply(console, ['[dezagamiz] Map ID fallback active:', ...args]);
    return;
  }
  origConsoleError.apply(console, args);
  if (
    msg.includes('OverQuotaMapError') ||
    msg.includes('QuotaExceededError')
  ) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
};

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <I18nProvider>
      <App />
    </I18nProvider>
  </ThemeProvider>,
);
