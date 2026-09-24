import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

window.addEventListener('error', (e) => alert('에러: ' + e.message))
window.addEventListener('unhandledrejection', (e) => alert('에러: ' + e.reason))

// One-time cleanup: a stale service worker from an earlier deploy can keep
// serving an old cached JS bundle indefinitely. IndexedDB (legacy vocab data,
// Firebase auth/Firestore cache) is untouched by this.
if (!localStorage.getItem('sw_cleanup_v1') && 'serviceWorker' in navigator) {
  localStorage.setItem('sw_cleanup_v1', '1')
  Promise.all([
    navigator.serviceWorker.getRegistrations().then((regs) => Promise.all(regs.map((r) => r.unregister()))),
    'caches' in window ? caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n)))) : Promise.resolve(),
  ]).then(() => {
    window.location.reload()
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
