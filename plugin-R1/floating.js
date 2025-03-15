class FloatingUI {
    constructor() {
      this.panel = document.getElementById('floating-panel');
      this.initialize();
    }
  
    initialize() {
      this.addEventListeners();
      this.injectStyles();
      this.connectToBackground();
    }
  
    addEventListeners() {
      document.getElementById('close-btn').addEventListener('click', () => {
        this.panel.style.display = 'none';
      });
  
      document.getElementById('pause-btn').addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'togglePause' });
      });
  
      document.getElementById('settings-btn').addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'openSettings' });
      });
    }
  
    injectStyles() {
      const style = document.createElement('style');
      style.textContent = `
        /* Styles from floating.css */
      `;
      document.head.appendChild(style);
    }
  
    connectToBackground() {
      chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'updateStatus') {
          document.getElementById('status').textContent = message.status;
          document.getElementById('like-count').textContent = message.likes;
          document.getElementById('processed-count').textContent = message.processed;
        }
      });
    }
  }
  
  // Create shadow DOM for isolation
  const container = document.createElement('div');
  document.body.appendChild(container);
  container.attachShadow({ mode: 'open' });
  container.shadowRoot.innerHTML = document.getElementById('floating-panel').outerHTML;
  
  new FloatingUI();