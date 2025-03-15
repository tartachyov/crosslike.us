// Inject floating UI on LinkedIn pages
if (window.location.hostname.includes('linkedin.com')) {
  const floatingContainer = document.createElement('div');
  const shadowRoot = floatingContainer.attachShadow({ mode: 'open' });
  
  // Load floating UI components
  fetch(chrome.runtime.getURL('floating.html'))
    .then(response => response.text())
    .then(html => {
      shadowRoot.innerHTML = html;
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('floating.js');
      shadowRoot.appendChild(script);
    });
  
  document.body.appendChild(floatingContainer);
}