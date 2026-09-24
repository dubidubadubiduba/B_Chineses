let container: HTMLDivElement | null = null;

function ensureContainer(): HTMLDivElement {
  if (container) return container;
  container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.bottom = '0';
  container.style.left = '0';
  container.style.right = '0';
  container.style.maxHeight = '45vh';
  container.style.overflowY = 'auto';
  container.style.background = 'rgba(0,0,0,0.88)';
  container.style.color = '#0f0';
  container.style.fontSize = '11px';
  container.style.fontFamily = 'monospace';
  container.style.zIndex = '999999';
  container.style.padding = '6px';
  container.style.whiteSpace = 'pre-wrap';
  document.body.appendChild(container);
  return container;
}

export function logDebug(msg: string): void {
  const el = ensureContainer();
  const line = document.createElement('div');
  line.textContent = `${new Date().toISOString().slice(11, 23)} ${msg}`;
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
}
